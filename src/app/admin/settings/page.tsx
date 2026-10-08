import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { IDLE_MINUTES, requireAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/AuthForms";
import { PageTitle } from "@/components/Shell";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageTitle eyebrow="профиль" title={user.name} />
      <div className="paper p-5">
        <div className="text-sm text-ink-soft">Вход по</div>
        <div className="font-medium">{user.login}</div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href="/" className="text-terracotta hover:underline">Главная страница сайта →</Link>
          <Link href="/pdf" className="text-terracotta hover:underline">PDF-трекеры</Link>
          <Link href="/admin/moods" className="text-terracotta hover:underline">Настроения</Link>
        </div>
      </div>
      <div className="paper p-5">
        <h2 className="mb-4 font-serif text-lg">Сменить пароль</h2>
        <ChangePasswordForm />
      </div>
      <p className="px-1 text-sm text-ink-soft">
        Для безопасности данных клиентов выход из аккаунта происходит автоматически после {IDLE_MINUTES} минут бездействия.
      </p>
      <form action={logout}>
        <button className="btn btn-ghost w-full">Выйти из аккаунта</button>
      </form>
    </div>
  );
}
