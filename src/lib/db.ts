import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");

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

function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  const { n } = db.prepare("SELECT COUNT(*) AS n FROM moods").get() as { n: number };
  if (n === 0) {
    const insert = db.prepare("INSERT INTO moods (label, zone, position) VALUES (?, ?, ?)");
    DEFAULT_MOODS.forEach(([label, zone], i) => insert.run(label, zone, i));
  }
  return db;
}

const globalForDb = globalThis as unknown as { __db?: Database.Database };

export const db = globalForDb.__db ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;
