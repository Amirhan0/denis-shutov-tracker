import Link from "next/link";
import { ForgotForm } from "@/components/AuthForms";

export const metadata = { title: "Восстановление пароля — Денис Шутов" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="h-display text-3xl">Восстановление пароля</h1>
      <p className="mt-2 text-sm text-ink-soft">Укажите email — пришлём ссылку, чтобы задать новый пароль.</p>
      <div className="mt-6">
        <ForgotForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-terracotta hover:underline">← Ко входу</Link>
      </p>
    </>
  );
}
