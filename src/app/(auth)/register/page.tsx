import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";

export const metadata = { title: "Регистрация — Денис Шутов" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <>
      <p className="eyebrow">начнём</p>
      <h1 className="h-display mt-1 text-3xl">Ваш личный дневник</h1>
      <p className="mt-2 text-sm text-ink-soft">Ваши записи видите только вы и я — ваш психолог.</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Уже есть кабинет? <Link href="/login" className="font-semibold text-terracotta hover:underline">Войти</Link>
      </p>
    </>
  );
}
