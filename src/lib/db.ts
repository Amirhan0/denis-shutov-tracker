import "server-only";
import { createClient, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// В продакшене — Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN), локально — файл ./data/app.db
const LOCAL_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");
const URL = process.env.TURSO_DATABASE_URL || "file:" + LOCAL_PATH;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  consent_at TEXT,
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS moods (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  zone INTEGER NOT NULL CHECK (zone BETWEEN 1 AND 4),
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

-- Цветовые трекеры: рейтинг дня, тревожность, настроение
CREATE TABLE IF NOT EXISTS marks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tracker TEXT NOT NULL CHECK (tracker IN ('rating', 'anxiety', 'mood')),
  date TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  mood_id INTEGER REFERENCES moods(id),
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, tracker, date)
);

-- Привычки не удаляются физически: archived_at скрывает их, история отметок остаётся
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS habit_checks (
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  PRIMARY KEY (habit_id, date)
);

-- «Главное за день» и «Благодарность себе»
CREATE TABLE IF NOT EXISTS entries (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('main', 'gratitude')),
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, kind, date)
);

-- Задания от психолога
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  done_at TEXT,
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
`;

const DEFAULT_MOODS: [string, number][] = [
  ["Радость", 1],
  ["Спокойствие", 1],
  ["Удовлетворение", 1],
  ["Вдохновение", 1],
  ["Нейтральность", 2],
  ["Усталость", 2],
  ["Грусть", 2],
  ["Раздражение", 3],
  ["Тревога", 3],
  ["Обида", 3],
  ["Злость", 4],
  ["Сильная тревога", 4],
  ["Отчаяние", 4],
];

const client = createClient({ url: URL, authToken: process.env.TURSO_AUTH_TOKEN });

const globalForDb = globalThis as unknown as { __dbReady?: Promise<void> };

function ready() {
  globalForDb.__dbReady ??= (async () => {
    if (URL.startsWith("file:")) fs.mkdirSync(path.dirname(LOCAL_PATH), { recursive: true });
    await client.executeMultiple(SCHEMA);
    // миграция: несколько настроений за день
    const markCols = await client.execute("PRAGMA table_info(marks)");
    if (!markCols.rows.some((r) => r[1] === "picks")) {
      await client.execute("ALTER TABLE marks ADD COLUMN picks TEXT");
    }
    // миграция: флаг «запомнить меня» у сессий
    const cols = await client.execute("PRAGMA table_info(sessions)");
    if (!cols.rows.some((r) => r[1] === "remember")) {
      await client.execute("ALTER TABLE sessions ADD COLUMN remember INTEGER NOT NULL DEFAULT 0");
    }
    const rs = await client.execute("SELECT COUNT(*) AS n FROM moods");
    if (Number(rs.rows[0][0]) === 0) {
      await client.batch(
        DEFAULT_MOODS.map(([label, zone], i) => ({ sql: "INSERT INTO moods (label, zone, position) VALUES (?, ?, ?)", args: [label, zone, i] })),
        "write",
      );
    }
  })().catch((e) => {
    globalForDb.__dbReady = undefined;
    throw e;
  });
  return globalForDb.__dbReady;
}

type Arg = InValue | boolean | undefined;
const norm = (args: Arg[]): InValue[] => args.map((a) => (a === undefined ? null : typeof a === "boolean" ? Number(a) : a));

async function exec(sql: string, args: Arg[]) {
  await ready();
  const rs = await client.execute({ sql, args: norm(args) });
  const rows = rs.rows.map((row) => {
    const o: Record<string, unknown> = {};
    rs.columns.forEach((c, i) => (o[c] = row[i]));
    return o;
  });
  return { rows, lastInsertRowid: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected };
}

/** Тонкая обёртка в стиле better-sqlite3, но асинхронная */
export const db = {
  prepare(sql: string) {
    return {
      get: async (...args: Arg[]) => (await exec(sql, args)).rows[0] as unknown,
      all: async (...args: Arg[]) => (await exec(sql, args)).rows as unknown[],
      run: async (...args: Arg[]) => {
        const r = await exec(sql, args);
        return { lastInsertRowid: r.lastInsertRowid, changes: r.changes };
      },
    };
  },
  /** Несколько изменений одной транзакцией */
  async batch(statements: [string, ...Arg[]][]) {
    await ready();
    await client.batch(
      statements.map(([sql, ...args]) => ({ sql, args: norm(args) })),
      "write",
    );
  },
};

/** Полное удаление пользователя со всеми данными */
export async function deleteUserData(userId: number) {
  await db.batch([
    ["DELETE FROM habit_checks WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)", userId],
    ["DELETE FROM habits WHERE user_id = ?", userId],
    ["DELETE FROM marks WHERE user_id = ?", userId],
    ["DELETE FROM entries WHERE user_id = ?", userId],
    ["DELETE FROM assignments WHERE user_id = ?", userId],
    ["DELETE FROM sessions WHERE user_id = ?", userId],
    ["DELETE FROM password_resets WHERE user_id = ?", userId],
    ["DELETE FROM users WHERE id = ?", userId],
  ]);
}
