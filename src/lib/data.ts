import "server-only";
import { db } from "./db";
import type { ColorTracker, EntryKind, Level, Mark, Mood } from "./trackers";

export function getMoods(includeInactive = false): Mood[] {
  return db
    .prepare(`SELECT id, label, zone, active, position FROM moods ${includeInactive ? "" : "WHERE active = 1"} ORDER BY zone, position, id`)
    .all() as Mood[];
}

export function getMarks(userId: number, tracker: ColorTracker, from: string, to: string): Record<string, Mark> {
  const rows = db
    .prepare("SELECT date, level, mood_id, note FROM marks WHERE user_id = ? AND tracker = ? AND date BETWEEN ? AND ?")
    .all(userId, tracker, from, to) as { date: string; level: Level; mood_id: number | null; note: string | null }[];
  const out: Record<string, Mark> = {};
  for (const r of rows) out[r.date] = { level: r.level, moodId: r.mood_id, note: r.note };
  return out;
}

export type Habit = { id: number; title: string; position: number; created_at: string; archived_at: string | null };

export function getActiveHabits(userId: number): Habit[] {
  return db
    .prepare("SELECT id, title, position, created_at, archived_at FROM habits WHERE user_id = ? AND archived_at IS NULL ORDER BY position, id")
    .all(userId) as Habit[];
}

/** Привычки, которые существовали хотя бы один день в периоде (включая заменённые) */
export function getHabitsInRange(userId: number, from: string, to: string): Habit[] {
  return db
    .prepare(
      `SELECT id, title, position, created_at, archived_at FROM habits
       WHERE user_id = ? AND created_at <= ? AND (archived_at IS NULL OR (archived_at > ? AND archived_at > created_at))
       ORDER BY archived_at IS NULL, position, id`,
    )
    .all(userId, to, from) as Habit[];
}

export function habitActiveOn(h: Habit, date: string) {
  return h.created_at <= date && (h.archived_at === null || date < h.archived_at);
}

/** { habitId: [даты] } */
export function getHabitChecks(userId: number, from: string, to: string): Record<number, string[]> {
  const rows = db
    .prepare(
      `SELECT c.habit_id, c.date FROM habit_checks c JOIN habits h ON h.id = c.habit_id
       WHERE h.user_id = ? AND c.date BETWEEN ? AND ?`,
    )
    .all(userId, from, to) as { habit_id: number; date: string }[];
  const out: Record<number, string[]> = {};
  for (const r of rows) (out[r.habit_id] ??= []).push(r.date);
  return out;
}

export function getEntry(userId: number, kind: EntryKind, date: string): string {
  const row = db.prepare("SELECT text FROM entries WHERE user_id = ? AND kind = ? AND date = ?").get(userId, kind, date) as
    | { text: string }
    | undefined;
  return row?.text ?? "";
}

export type Entry = { kind: EntryKind; date: string; text: string };

export function getEntries(userId: number, kind: EntryKind | null, from: string, to: string): Entry[] {
  return db
    .prepare(
      `SELECT kind, date, text FROM entries WHERE user_id = ? AND (? IS NULL OR kind = ?) AND date BETWEEN ? AND ?
       AND trim(text) <> '' ORDER BY date DESC`,
    )
    .all(userId, kind, kind, from, to) as Entry[];
}

export function getRecentEntries(userId: number, kind: EntryKind, limit = 30): Entry[] {
  return db
    .prepare("SELECT kind, date, text FROM entries WHERE user_id = ? AND kind = ? AND trim(text) <> '' ORDER BY date DESC LIMIT ?")
    .all(userId, kind, limit) as Entry[];
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

export function getDayStatus(userId: number, date: string): DayStatus {
  const marks = db.prepare("SELECT tracker FROM marks WHERE user_id = ? AND date = ?").all(userId, date) as { tracker: string }[];
  const entries = db
    .prepare("SELECT kind FROM entries WHERE user_id = ? AND date = ? AND trim(text) <> ''")
    .all(userId, date) as { kind: string }[];
  const habits = getHabitsInRange(userId, date, date).filter((h) => habitActiveOn(h, date));
  const checks = getHabitChecks(userId, date, date);
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

export function getAssignments(userId: number, includeArchived = false): Assignment[] {
  return db
    .prepare(
      `SELECT id, text, created_at, done_at, archived FROM assignments WHERE user_id = ? ${includeArchived ? "" : "AND archived = 0"}
       ORDER BY archived, created_at DESC`,
    )
    .all(userId) as Assignment[];
}

/** Набор дат, в которые клиент хоть что-то заполнил */
export function getFilledDates(userId: number, from: string, to: string): Map<string, number> {
  const rows = db
    .prepare(
      `SELECT date, COUNT(*) AS n FROM (
         SELECT date, tracker AS k FROM marks WHERE user_id = @uid AND date BETWEEN @from AND @to
         UNION ALL SELECT date, kind FROM entries WHERE user_id = @uid AND date BETWEEN @from AND @to AND trim(text) <> ''
         UNION ALL SELECT DISTINCT c.date, 'habits' FROM habit_checks c JOIN habits h ON h.id = c.habit_id
           WHERE h.user_id = @uid AND c.date BETWEEN @from AND @to
       ) GROUP BY date`,
    )
    .all({ uid: userId, from, to }) as { date: string; n: number }[];
  return new Map(rows.map((r) => [r.date, r.n]));
}
