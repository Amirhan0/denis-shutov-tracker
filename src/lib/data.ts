import "server-only";
import { db } from "./db";
import type { ColorTracker, EntryKind, Level, Mark, Mood } from "./trackers";

export async function getMoods(includeInactive = false): Promise<Mood[]> {
  return (await db
    .prepare(`SELECT id, label, zone, active, position FROM moods ${includeInactive ? "" : "WHERE active = 1"} ORDER BY zone, position, id`)
    .all()) as Mood[];
}

export async function getMarks(userId: number, tracker: ColorTracker, from: string, to: string): Promise<Record<string, Mark>> {
  const rows = await db
    .prepare("SELECT date, level, mood_id, note FROM marks WHERE user_id = ? AND tracker = ? AND date BETWEEN ? AND ?")
    .all(userId, tracker, from, to) as { date: string; level: Level; mood_id: number | null; note: string | null }[];
  const out: Record<string, Mark> = {};
  for (const r of rows) out[r.date] = { level: r.level, moodId: r.mood_id, note: r.note };
  return out;
}

export type Habit = { id: number; title: string; position: number; created_at: string; archived_at: string | null };

export async function getActiveHabits(userId: number): Promise<Habit[]> {
  return (await db
    .prepare("SELECT id, title, position, created_at, archived_at FROM habits WHERE user_id = ? AND archived_at IS NULL ORDER BY position, id")
    .all(userId)) as Habit[];
}

/** Привычки, которые существовали хотя бы один день в периоде (включая заменённые) */
export async function getHabitsInRange(userId: number, from: string, to: string): Promise<Habit[]> {
  return (await db
    .prepare(
      `SELECT id, title, position, created_at, archived_at FROM habits
       WHERE user_id = ? AND created_at <= ? AND (archived_at IS NULL OR (archived_at > ? AND archived_at > created_at))
       ORDER BY archived_at IS NULL, position, id`,
    )
    .all(userId, to, from)) as Habit[];
}

export function habitActiveOn(h: Habit, date: string) {
  return h.created_at <= date && (h.archived_at === null || date < h.archived_at);
}

/** { habitId: [даты] } */
export async function getHabitChecks(userId: number, from: string, to: string): Promise<Record<number, string[]>> {
  const rows = await db
    .prepare(
      `SELECT c.habit_id, c.date FROM habit_checks c JOIN habits h ON h.id = c.habit_id
       WHERE h.user_id = ? AND c.date BETWEEN ? AND ?`,
    )
    .all(userId, from, to) as { habit_id: number; date: string }[];
  const out: Record<number, string[]> = {};
  for (const r of rows) (out[r.habit_id] ??= []).push(r.date);
  return out;
}

export async function getEntry(userId: number, kind: EntryKind, date: string): Promise<string> {
  const row = await db.prepare("SELECT text FROM entries WHERE user_id = ? AND kind = ? AND date = ?").get(userId, kind, date) as
    | { text: string }
    | undefined;
  return row?.text ?? "";
}

export type Entry = { kind: EntryKind; date: string; text: string };

export async function getEntries(userId: number, kind: EntryKind | null, from: string, to: string): Promise<Entry[]> {
  return (await db
    .prepare(
      `SELECT kind, date, text FROM entries WHERE user_id = ? AND (? IS NULL OR kind = ?) AND date BETWEEN ? AND ?
       AND trim(text) <> '' ORDER BY date DESC`,
    )
    .all(userId, kind, kind, from, to)) as Entry[];
}

export async function getRecentEntries(userId: number, kind: EntryKind, limit = 30): Promise<Entry[]> {
  return (await db
    .prepare("SELECT kind, date, text FROM entries WHERE user_id = ? AND kind = ? AND trim(text) <> '' ORDER BY date DESC LIMIT ?")
    .all(userId, kind, limit)) as Entry[];
}

export type DayStatus = {
  rating: boolean;
  anxiety: boolean;
  mood: boolean;
  habitsDone: number;
  habitsTotal: number;
  main: boolean;
  gratitude: boolean;
};

export async function getDayStatus(userId: number, date: string): Promise<DayStatus> {
  const marks = await db.prepare("SELECT tracker FROM marks WHERE user_id = ? AND date = ?").all(userId, date) as { tracker: string }[];
  const entries = await db
    .prepare("SELECT kind FROM entries WHERE user_id = ? AND date = ? AND trim(text) <> ''")
    .all(userId, date) as { kind: string }[];
  const habits = (await getHabitsInRange(userId, date, date)).filter((h) => habitActiveOn(h, date));
  const checks = await getHabitChecks(userId, date, date);
  const has = (t: string) => marks.some((m) => m.tracker === t);
  return {
    rating: has("rating"),
    anxiety: has("anxiety"),
    mood: has("mood"),
    habitsDone: habits.filter((h) => checks[h.id]?.length).length,
    habitsTotal: habits.length,
    main: entries.some((e) => e.kind === "main"),
    gratitude: entries.some((e) => e.kind === "gratitude"),
  };
}

export type Assignment = { id: number; text: string; created_at: string; done_at: string | null; archived: number };

export async function getAssignments(userId: number, includeArchived = false): Promise<Assignment[]> {
  return (await db
    .prepare(
      `SELECT id, text, created_at, done_at, archived FROM assignments WHERE user_id = ? ${includeArchived ? "" : "AND archived = 0"}
       ORDER BY archived, created_at DESC`,
    )
    .all(userId)) as Assignment[];
}

/** Набор дат, в которые клиент хоть что-то заполнил */
export async function getFilledDates(userId: number, from: string, to: string): Promise<Map<string, number>> {
  const rows = await db
    .prepare(
      `SELECT date, COUNT(*) AS n FROM (
         SELECT date, tracker AS k FROM marks WHERE user_id = ? AND date BETWEEN ? AND ?
         UNION ALL SELECT date, kind FROM entries WHERE user_id = ? AND date BETWEEN ? AND ? AND trim(text) <> ''
         UNION ALL SELECT DISTINCT c.date, 'habits' FROM habit_checks c JOIN habits h ON h.id = c.habit_id
           WHERE h.user_id = ? AND c.date BETWEEN ? AND ?
       ) GROUP BY date`,
    )
    .all(userId, from, to, userId, from, to, userId, from, to) as { date: string; n: number }[];
  return new Map(rows.map((r) => [r.date, r.n]));
}
