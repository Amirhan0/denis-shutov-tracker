import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Вход — Денис Шутов" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/app");
  const sp = await searchParams;
  return (
    <>
      <p className="eyebrow">с возвращением</p>
      <h1 className="h-display mt-1 text-3xl">Вход в кабинет</h1>
      {sp.idle && (
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-ink-soft">
          Выход из аккаунта произошёл после долгого бездействия — так ваши записи остаются в безопасности.
        </p>
      )}
      {sp.reset && <p className="mt-4 rounded-xl bg-[#e3ecd9] px-4 py-3 text-sm text-[#3f5a31]">Пароль обновлён. Войдите с новым паролем.</p>}
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Ещё нет кабинета?{" "}
        <Link href="/register" className="font-semibold text-terracotta hover:underline">Зарегистрироваться</Link>
      </p>
    </>
  );
}
