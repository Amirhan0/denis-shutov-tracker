import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { DEFAULT_TZ, todayIn } from "./dates";

export const SESSION_COOKIE = "ds_session";
/** Автоматический выход при бездействии (минуты) */
export const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 30);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type User = {
  id: number;
  name: string;
  login: string;
  role: "client" | "admin";
  onboarded: number;
  created_at: string;
  last_active_at: string | null;
};

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  db.prepare("INSERT INTO sessions (id, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)").run(sha256(token), userId, now, now);
  db.prepare("DELETE FROM sessions WHERE last_seen < ?").run(now - IDLE_MS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const session = db.prepare("SELECT user_id, created_at, last_seen FROM sessions WHERE id = ?").get(id) as
    | { user_id: number; created_at: number; last_seen: number }
    | undefined;
  if (!session) return null;

  const now = Date.now();
  if (now - session.last_seen > IDLE_MS || now - session.created_at > MAX_AGE_MS) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return null;
  }
  if (now - session.last_seen > 30_000) {
    db.prepare("UPDATE sessions SET last_seen = ? WHERE id = ?").run(now, id);
  }

  const user = db
    .prepare("SELECT id, name, login, role, onboarded, created_at, last_active_at FROM users WHERE id = ?")
    .get(session.user_id) as User | undefined;
  return user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireClient(): Promise<User> {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/app");
  return user;
}

/** Часовой пояс пользователя — выставляется браузером в cookie `tz` */
export async function getTz(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  if (!tz) return process.env.APP_TZ || DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export async function getToday(): Promise<string> {
  return todayIn(await getTz());
}

export function touchActivity(userId: number) {
  db.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(userId);
}

// Простая защита от перебора паролей (в памяти процесса)
const attempts = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max = 8, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.until < now) {
    attempts.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  rec.count++;
  return rec.count <= max;
}

export function createResetToken(userId: number, hours = 24): string {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    Date.now() + hours * 3600 * 1000,
  );
  return token;
}

export function normalizeLogin(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v.includes("@")) return v;
  // телефон: оставляем цифры, 8XXXXXXXXXX → 7XXXXXXXXXX
  let digits = v.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  return digits ? "+" + digits : v;
}

export function isValidLogin(login: string): boolean {
  if (login.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);
  return /^\+\d{10,15}$/.test(login);
}
