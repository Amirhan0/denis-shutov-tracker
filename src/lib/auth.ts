import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { DEFAULT_TZ, todayIn } from "./dates";

export const SESSION_COOKIE = "ds_session";
export const REMEMBER_COOKIE = "ds_remember";
/** Автоматический выход при бездействии (минуты) */
export const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 30);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
/** «Запомнить меня»: вход держится 30 дней с последнего визита */
export const REMEMBER_DAYS = 30;
const REMEMBER_MS = REMEMBER_DAYS * 24 * 60 * 60 * 1000;
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type User = {
  id: number;
  name: string;
  login: string;
  role: "client" | "admin";
  onboarded: number;
  created_at: string;
  last_active_at: string | null;
  /** сессия с «Запомнить меня» — без автовыхода по бездействию */
  remember: boolean;
};

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // без maxAge cookie живёт до закрытия браузера
    ...(remember ? { maxAge: REMEMBER_DAYS * 24 * 60 * 60 } : {}),
  };
}

export async function createSession(userId: number, remember: boolean) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  await db
    .prepare("INSERT INTO sessions (id, user_id, created_at, last_seen, remember) VALUES (?, ?, ?, ?, ?)")
    .run(sha256(token), userId, now, now, remember ? 1 : 0);
  await db
    .prepare("DELETE FROM sessions WHERE (remember = 0 AND last_seen < ?) OR last_seen < ? OR created_at < ?")
    .run(now - IDLE_MS, now - REMEMBER_MS, now - MAX_AGE_MS);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(remember));
  if (remember) jar.set(REMEMBER_COOKIE, "1", { ...sessionCookieOptions(true), httpOnly: true });
  else jar.delete(REMEMBER_COOKIE);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
  jar.delete(REMEMBER_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const session = (await db.prepare("SELECT user_id, created_at, last_seen, remember FROM sessions WHERE id = ?").get(id)) as
    | { user_id: number; created_at: number; last_seen: number; remember: number }
    | undefined;
  if (!session) return null;

  const now = Date.now();
  const idleLimit = session.remember ? REMEMBER_MS : IDLE_MS;
  if (now - session.last_seen > idleLimit || now - session.created_at > MAX_AGE_MS) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return null;
  }
  if (now - session.last_seen > 30_000) {
    await db.prepare("UPDATE sessions SET last_seen = ? WHERE id = ?").run(now, id);
  }

  const user = (await db
    .prepare("SELECT id, name, login, role, onboarded, created_at, last_active_at FROM users WHERE id = ?")
    .get(session.user_id)) as Omit<User, "remember"> | undefined;
  return user ? { ...user, remember: !!session.remember } : null;
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

export async function touchActivity(userId: number) {
  await db.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(userId);
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

export async function createResetToken(userId: number, hours = 24): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await db.prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
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
