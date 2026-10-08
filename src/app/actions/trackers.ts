"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getToday, requireClient, touchActivity } from "@/lib/auth";
import { addDays, isISODate } from "@/lib/dates";
import { getActiveHabits } from "@/lib/data";
import { MAX_HABITS, type ColorTracker, type EntryKind } from "@/lib/trackers";

async function checkDate(date: string) {
  // +1 день запаса на разницу часовых поясов
  if (!isISODate(date) || date < "2020-01-01" || date > addDays(await getToday(), 1)) throw new Error("Некорректная дата");
}

export async function setMark(tracker: ColorTracker, date: string, level: number | null, moodId?: number | null, note?: string | null) {
  const user = await requireClient();
  if (!["rating", "anxiety", "mood"].includes(tracker)) throw new Error("Неизвестный трекер");
  await checkDate(date);

  if (level === null) {
    await db.prepare("DELETE FROM marks WHERE user_id = ? AND tracker = ? AND date = ?").run(user.id, tracker, date);
  } else {
    if (![1, 2, 3, 4].includes(level)) throw new Error("Некорректное значение");
    let mood: number | null = null;
    let text: string | null = null;
    if (tracker === "mood") {
      if (moodId) {
        const row = (await db.prepare("SELECT zone FROM moods WHERE id = ?").get(moodId)) as { zone: number } | undefined;
        if (!row) throw new Error("Неизвестное настроение");
        mood = moodId;
        level = row.zone;
      } else {
        text = (note ?? "").trim().slice(0, 40) || null;
      }
    }
    await db.prepare(
      `INSERT INTO marks (user_id, tracker, date, level, mood_id, note) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, tracker, date) DO UPDATE SET level = excluded.level, mood_id = excluded.mood_id,
       note = excluded.note, updated_at = datetime('now')`,
    ).run(user.id, tracker, date, level, mood, text);
  }
  await touchActivity(user.id);
}

export async function toggleHabit(habitId: number, date: string, done: boolean) {
  const user = await requireClient();
  await checkDate(date);
  const habit = await db.prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?").get(habitId, user.id);
  if (!habit) throw new Error("Привычка не найдена");
  if (done) await db.prepare("INSERT OR IGNORE INTO habit_checks (habit_id, date) VALUES (?, ?)").run(habitId, date);
  else await db.prepare("DELETE FROM habit_checks WHERE habit_id = ? AND date = ?").run(habitId, date);
  await touchActivity(user.id);
}

export async function saveEntry(kind: EntryKind, date: string, text: string) {
  const user = await requireClient();
  if (kind !== "main" && kind !== "gratitude") throw new Error("Неизвестный тип записи");
  await checkDate(date);
  const value = String(text).slice(0, 5000);
  if (!value.trim()) {
    await db.prepare("DELETE FROM entries WHERE user_id = ? AND kind = ? AND date = ?").run(user.id, kind, date);
  } else {
    await db.prepare(
      `INSERT INTO entries (user_id, kind, date, text) VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, kind, date) DO UPDATE SET text = excluded.text, updated_at = datetime('now')`,
    ).run(user.id, kind, date, value);
  }
  await touchActivity(user.id);
}

// ---------- Управление привычками ----------

function cleanTitle(v: unknown) {
  return String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
}

export async function addHabit(title: string) {
  const user = await requireClient();
  const t = cleanTitle(title);
  if (!t) return;
  const active = await getActiveHabits(user.id);
  if (active.length >= MAX_HABITS) throw new Error(`Можно вести не больше ${MAX_HABITS} привычек одновременно`);
  const pos = active.reduce((m, h) => Math.max(m, h.position), -1) + 1;
  await db.prepare("INSERT INTO habits (user_id, title, position, created_at) VALUES (?, ?, ?, ?)").run(user.id, t, pos, await getToday());
  revalidatePath("/app", "layout");
}

export async function renameHabit(id: number, title: string) {
  const user = await requireClient();
  const t = cleanTitle(title);
  if (!t) return;
  await db.prepare("UPDATE habits SET title = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL").run(t, id, user.id);
  revalidatePath("/app", "layout");
}

/** Удаление = архивирование: отметки за прошлые дни сохраняются */
export async function removeHabit(id: number) {
  const user = await requireClient();
  const today = await getToday();
  const h = (await db.prepare("SELECT created_at FROM habits WHERE id = ? AND user_id = ? AND archived_at IS NULL").get(id, user.id)) as
    | { created_at: string }
    | undefined;
  if (!h) return;
  const hasHistory = await db.prepare("SELECT 1 FROM habit_checks WHERE habit_id = ? AND date < ? LIMIT 1").get(id, today);
  if (!hasHistory && h.created_at >= today) {
    await db.batch([
      ["DELETE FROM habit_checks WHERE habit_id = ?", id],
      ["DELETE FROM habits WHERE id = ?", id],
    ]);
  } else {
    await db.batch([
      ["UPDATE habits SET archived_at = ? WHERE id = ?", today, id],
      ["DELETE FROM habit_checks WHERE habit_id = ? AND date >= ?", id, today],
    ]);
  }
  revalidatePath("/app", "layout");
}

/** Замена: старая привычка уходит в историю, новая занимает её место */
export async function replaceHabit(id: number, title: string) {
  const user = await requireClient();
  const t = cleanTitle(title);
  if (!t) return;
  const old = (await db.prepare("SELECT position FROM habits WHERE id = ? AND user_id = ? AND archived_at IS NULL").get(id, user.id)) as
    | { position: number }
    | undefined;
  if (!old) return;
  await removeHabit(id);
  await db.prepare("INSERT INTO habits (user_id, title, position, created_at) VALUES (?, ?, ?, ?)").run(user.id, t, old.position, await getToday());
  revalidatePath("/app", "layout");
}

export async function saveOnboardingHabits(fd: FormData) {
  const user = await requireClient();
  const today = await getToday();
  const titles = fd.getAll("habit").map(cleanTitle).filter(Boolean).slice(0, MAX_HABITS);
  const existing = (await getActiveHabits(user.id)).length;
  await db.batch([
    ...titles
      .slice(0, MAX_HABITS - existing)
      .map((t, i): [string, ...(string | number)[]] => ["INSERT INTO habits (user_id, title, position, created_at) VALUES (?, ?, ?, ?)", user.id, t, existing + i, today]),
    ["UPDATE users SET onboarded = 1 WHERE id = ?", user.id],
  ]);
  redirect("/app");
}

export async function setAssignmentDone(id: number, done: boolean) {
  const user = await requireClient();
  await db.prepare("UPDATE assignments SET done_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ? AND user_id = ?").run(
    done ? 1 : 0,
    id,
    user.id,
  );
  revalidatePath("/app");
}
