"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createResetToken,
  createSession,
  destroySession,
  isValidLogin,
  normalizeLogin,
  rateLimit,
  requireUser,
  sha256,
} from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/url";

export type FormState = { error?: string; ok?: string } | undefined;

const MIN_PASSWORD = 8;
let DUMMY_HASH: string | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get("name") ?? "").trim();
  const login = normalizeLogin(String(fd.get("login") ?? ""));
  const password = String(fd.get("password") ?? "");

  if (!name) return { error: "Как к вам обращаться?" };
  if (!isValidLogin(login)) return { error: "Укажите корректный email или номер телефона" };
  if (password.length < MIN_PASSWORD) return { error: `Пароль — минимум ${MIN_PASSWORD} символов` };
  if (fd.get("consent") !== "on") return { error: "Нужно согласие с политикой конфиденциальности" };
  if (!rateLimit("register:" + (await clientIp()), 10, 60 * 60 * 1000)) return { error: "Слишком много попыток, попробуйте позже" };

  const exists = await db.prepare("SELECT 1 FROM users WHERE login = ?").get(login);
  if (exists) return { error: "Такой аккаунт уже есть — попробуйте войти" };

  const hash = await bcrypt.hash(password, 12);
  const { lastInsertRowid } = await db
    .prepare("INSERT INTO users (name, login, password_hash, consent_at, last_active_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))")
    .run(name.slice(0, 60), login, hash);
  await createSession(Number(lastInsertRowid), fd.get("remember") === "on");
  redirect("/app/welcome");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const login = normalizeLogin(String(fd.get("login") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!rateLimit("login:" + login) || !rateLimit("login-ip:" + (await clientIp()), 30)) {
    return { error: "Слишком много попыток. Подождите 15 минут." };
  }
  const user = await db.prepare("SELECT id, password_hash, role FROM users WHERE login = ?").get(login) as
    | { id: number; password_hash: string; role: string }
    | undefined;
  // сравниваем и для несуществующего пользователя, чтобы время ответа не выдавало наличие аккаунта
  const ok = await bcrypt.compare(password, user?.password_hash ?? (DUMMY_HASH ??= await bcrypt.hash("dummy", 12)));
  if (!user || !ok) return { error: "Неверный логин или пароль" };

  await createSession(user.id, fd.get("remember") === "on");
  redirect(user.role === "admin" ? "/admin" : "/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function logoutIdle() {
  await destroySession();
  redirect("/login?idle=1");
}

export async function requestReset(_: FormState, fd: FormData): Promise<FormState> {
  const login = normalizeLogin(String(fd.get("login") ?? ""));
  const done: FormState = {
    ok: "Если такой аккаунт существует, мы отправили ссылку для восстановления на почту. Если вы регистрировались по телефону — напишите Денису, он пришлёт ссылку.",
  };
  if (!rateLimit("reset:" + (await clientIp()), 5)) return { error: "Слишком много попыток, попробуйте позже" };

  const user = await db.prepare("SELECT id, name FROM users WHERE login = ?").get(login) as { id: number; name: string } | undefined;
  if (user && login.includes("@")) {
    const token = await createResetToken(user.id);
    const link = `${await appUrl()}/reset/${token}`;
    await sendMail(
      login,
      "Восстановление пароля",
      `${user.name}, здравствуйте!\n\nЧтобы задать новый пароль, перейдите по ссылке (действует 24 часа):\n${link}\n\nЕсли вы не запрашивали восстановление — просто проигнорируйте это письмо.`,
    );
  }
  return done;
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Пароль — минимум ${MIN_PASSWORD} символов` };

  const row = await db.prepare("SELECT user_id, expires_at, used FROM password_resets WHERE token_hash = ?").get(sha256(token)) as
    | { user_id: number; expires_at: number; used: number }
    | undefined;
  if (!row || row.used || row.expires_at < Date.now()) return { error: "Ссылка устарела. Запросите новую." };

  const hash = await bcrypt.hash(password, 12);
  await db.batch([
    ["UPDATE users SET password_hash = ? WHERE id = ?", hash, row.user_id],
    ["UPDATE password_resets SET used = 1 WHERE user_id = ?", row.user_id],
    ["DELETE FROM sessions WHERE user_id = ?", row.user_id],
  ]);
  redirect("/login?reset=1");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  if (next.length < MIN_PASSWORD) return { error: `Новый пароль — минимум ${MIN_PASSWORD} символов` };
  const row = (await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id)) as { password_hash: string };
  if (!(await bcrypt.compare(current, row.password_hash))) return { error: "Текущий пароль указан неверно" };
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await bcrypt.hash(next, 12), user.id);
  return { ok: "Пароль изменён" };
}
