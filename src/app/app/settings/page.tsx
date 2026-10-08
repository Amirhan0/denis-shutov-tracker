import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { IDLE_MINUTES, REMEMBER_DAYS, requireClient } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/AuthForms";
import { PageTitle } from "@/components/Shell";
import { SITE } from "@/lib/site";

export default async function SettingsPage() {
  const user = await requireClient();
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageTitle eyebrow="профиль" title={user.name} />
      <div className="paper p-5">
        <div className="text-sm text-ink-soft">Вход по</div>
        <div className="font-medium">{user.login}</div>
        <Link href="/app/habits" className="mt-4 block text-sm font-semibold text-terracotta hover:underline">Управлять привычками →</Link>
      </div>
      <div className="paper p-5">
        <h2 className="mb-4 font-serif text-lg">Сменить пароль</h2>
        <ChangePasswordForm />
      </div>
      <div className="paper space-y-3 p-5 text-sm text-ink-soft">
        <p>
          Ваши записи видите только вы и ваш психолог.{" "}
          {user.remember
            ? `Это устройство запомнено — вход сохранится, если заходить хотя бы раз в ${REMEMBER_DAYS} дней. На чужом устройстве не забудьте выйти.`
            : `Для безопасности мы автоматически выходим из аккаунта после ${IDLE_MINUTES} минут бездействия.`}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
          <Link href="/" className="text-terracotta hover:underline">Главная страница сайта</Link>
          <Link href="/privacy" className="text-terracotta hover:underline">Политика конфиденциальности</Link>
          <Link href="/pdf" className="text-terracotta hover:underline">PDF-трекеры</Link>
          <a href={SITE.telegram} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">Написать Денису</a>
        </div>
      </div>
      <form action={logout}>
        <button className="btn btn-ghost w-full">Выйти из аккаунта</button>
      </form>
    </div>
  );
}
