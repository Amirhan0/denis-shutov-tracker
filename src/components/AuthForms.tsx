"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { changePassword, login, register, requestReset, resetPassword, type FormState } from "@/app/actions/auth";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <p className="animate-fade rounded-xl bg-[#f6dcd5] px-4 py-3 text-sm text-bordeaux">{state.error}</p>;
  if (state?.ok) return <p className="animate-fade rounded-xl bg-[#e3ecd9] px-4 py-3 text-sm text-[#3f5a31]">{state.ok}</p>;
  return null;
}

function PasswordInput({ name = "password", placeholder, autoComplete }: { name?: string; placeholder?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        className="field pr-20"
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        minLength={name === "current" ? 1 : 8}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-semibold text-ink-soft hover:text-ink"
      >
        {show ? "скрыть" : "показать"}
      </button>
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="login">Email или телефон</label>
        <input id="login" name="login" className="field" autoComplete="username" required placeholder="you@mail.ru или +7…" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label">Пароль</label>
          <Link href="/forgot" className="text-xs font-semibold text-terracotta hover:underline">Забыли пароль?</Link>
        </div>
        <PasswordInput autoComplete="current-password" />
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 shrink-0 accent-terracotta" />
        Запомнить меня на этом устройстве
      </label>
      <Message state={state} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Входим…" : "Войти"}</button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Имя</label>
        <input id="name" name="name" className="field" autoComplete="given-name" required placeholder="Как к вам обращаться" />
      </div>
      <div>
        <label className="label" htmlFor="login">Email или телефон</label>
        <input id="login" name="login" className="field" autoComplete="username" required placeholder="you@mail.ru или +7…" />
      </div>
      <div>
        <label className="label">Пароль</label>
        <PasswordInput autoComplete="new-password" placeholder="Минимум 8 символов" />
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 shrink-0 accent-terracotta" />
        Запомнить меня на этом устройстве
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream/70 p-3 text-sm leading-snug text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-terracotta" />
        <span>
          Я согласен(на) с{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-terracotta underline-offset-2 hover:underline">
            политикой конфиденциальности
          </Link>{" "}
          и даю согласие на обработку персональных данных
        </span>
      </label>
      <Message state={state} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Создаём…" : "Создать кабинет"}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="login">Email или телефон</label>
        <input id="login" name="login" className="field" autoComplete="username" required />
      </div>
      <Message state={state} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Отправляем…" : "Восстановить пароль"}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label">Новый пароль</label>
        <PasswordInput autoComplete="new-password" placeholder="Минимум 8 символов" />
      </div>
      <Message state={state} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить пароль"}</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Текущий пароль</label>
        <PasswordInput name="current" autoComplete="current-password" />
      </div>
      <div>
        <label className="label">Новый пароль</label>
        <PasswordInput autoComplete="new-password" placeholder="Минимум 8 символов" />
      </div>
      <Message state={state} />
      <button className="btn btn-soft w-full" disabled={pending}>{pending ? "Сохраняем…" : "Изменить пароль"}</button>
    </form>
  );
}
