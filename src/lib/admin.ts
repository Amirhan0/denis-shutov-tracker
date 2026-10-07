import "server-only";
import { db } from "./db";
import { addDays, diffDays } from "./dates";
import { getFilledDates } from "./data";

export type ClientRow = {
  id: number;
  name: string;
  login: string;
  created_at: string;
  last_active_at: string | null;
};

/** UTC-время из SQLite → дата в часовом поясе tz */
export function utcToLocalDate(utc: string | null, tz: string): string | null {
  if (!utc) return null;
  const d = new Date(utc.replace(" ", "T") + "Z");
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  } catch {
    return utc.slice(0, 10);
  }
}

export function getClients(): ClientRow[] {
  return db
    .prepare("SELECT id, name, login, created_at, last_active_at FROM users WHERE role = 'client' ORDER BY last_active_at DESC NULLS LAST, id DESC")
    .all() as ClientRow[];
}

export function getClient(id: number): ClientRow | undefined {
  return db.prepare("SELECT id, name, login, created_at, last_active_at FROM users WHERE id = ? AND role = 'client'").get(id) as ClientRow | undefined;
}

/** Процент заполнения за последние 7 дней (6 трекеров в день) */
export function fillPercent(c: ClientRow, today: string, tz: string): number {
  const registered = utcToLocalDate(c.created_at, tz) ?? today;
  const from = registered > addDays(today, -6) ? registered : addDays(today, -6);
  const days = diffDays(from, today) + 1;
  const filled = getFilledDates(c.id, from, today);
  let sum = 0;
  for (const n of filled.values()) sum += Math.min(n, 6);
  return Math.round((sum / (days * 6)) * 100);
}

export type Status = { label: string; tone: "ok" | "warn" | "new" };

export function clientStatus(lastActive: string | null, created: string | null, pct: number, today: string): Status {
  if (!lastActive || (created && diffDays(created, today) < 2 && pct === 0)) return { label: "новый", tone: "new" };
  const idle = diffDays(lastActive, today);
  if (idle <= 2 && pct >= 40) return { label: "активен", tone: "ok" };
  return { label: "требуется внимание", tone: "warn" };
}
