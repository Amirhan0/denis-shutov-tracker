import Link from "next/link";
import { getTz } from "@/lib/auth";
import { relativeDay, todayIn } from "@/lib/dates";
import { clientStatus, fillPercent, getClients, utcToLocalDate } from "@/lib/admin";
import { PageTitle } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/AdminClientTools";
import { Sprout } from "@/components/Doodles";
import { appUrl } from "@/lib/url";

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const tz = await getTz();
  const inviteLink = `${await appUrl()}/register`;
  const today = todayIn(tz);
  const q = String((await searchParams).q ?? "").trim().toLowerCase();
  const all = await getClients();
  const clients = all.filter((c) => !q || c.name.toLowerCase().includes(q) || c.login.includes(q));
  const rows = await Promise.all(
    clients.map(async (c) => {
      const last = utcToLocalDate(c.last_active_at, tz);
      const pct = await fillPercent(c, today, tz);
      return { ...c, last, pct, status: clientStatus(last, utcToLocalDate(c.created_at, tz), pct, today) };
    }),
  );
  const attention = rows.filter((r) => r.status.tone === "warn").length;

  return (
    <div>
      {all.length === 0 ? (
        <PageTitle eyebrow="панель психолога" title="Клиенты" />
      ) : (
        <>
          <PageTitle eyebrow="панель психолога" title="Клиенты">
            {rows.length} в списке{attention > 0 && <> · <span className="text-[#9a4a22]">{attention} требуют внимания</span></>}
          </PageTitle>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form className="w-full max-w-md">
              <input name="q" defaultValue={q} placeholder="Поиск по имени, email или телефону" className="field" />
            </form>
            <CopyButton text={inviteLink} label="Скопировать ссылку для клиента" className="btn btn-ghost btn-sm shrink-0" />
          </div>
        </>
      )}

      {rows.length === 0 ? (
        q ? (
          <div className="paper p-8 text-center text-ink-soft">Никого не нашли по запросу «{q}»</div>
        ) : (
          <div className="paper flex flex-col items-center p-8 text-center sm:p-12">
            <Sprout className="h-14 w-14 text-sage" />
            <h2 className="mt-4 font-serif text-2xl">Здесь появятся ваши клиенты</h2>
            <p className="mt-2 max-w-md text-ink-soft">
              Отправьте клиенту ссылку на регистрацию. Как только он создаст кабинет, вы увидите его в этом списке.
            </p>
            <div className="mt-6 w-full max-w-md rounded-2xl bg-cream px-4 py-3 font-medium break-all text-ink">{inviteLink}</div>
            <CopyButton text={inviteLink} className="btn btn-primary mt-4" />
          </div>
        )
      ) : (
        <>
          {/* Таблица на десктопе */}
          <div className="paper hidden overflow-hidden md:block">
            <table className="w-full text-left">
              <thead className="border-b border-line text-xs tracking-wide text-ink-faint uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Клиент</th>
                  <th className="px-5 py-3 font-semibold">Последняя активность</th>
                  <th className="px-5 py-3 font-semibold">Заполнение (7 дн.)</th>
                  <th className="px-5 py-3 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-cream/50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/clients/${r.id}`} className="font-semibold hover:text-terracotta">{r.name}</Link>
                      <div className="text-xs text-ink-faint">{r.login}</div>
                    </td>
                    <td className="px-5 py-4 text-ink-soft">{relativeDay(r.last, today)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-line/70">
                          <div className="h-full rounded-full bg-sage" style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold">{r.pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Карточки на телефоне */}
          <div className="space-y-2.5 md:hidden">
            {rows.map((r) => (
              <Link key={r.id} href={`/admin/clients/${r.id}`} className="paper block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-ink-faint">{relativeDay(r.last, today)}</div>
                  </div>
                  <StatusBadge s={r.status} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/70">
                    <div className="h-full rounded-full bg-sage" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{r.pct}%</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
