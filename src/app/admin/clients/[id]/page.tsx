import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveAssignment, createAssignment, deleteClient } from "@/app/actions/admin";
import { getTz } from "@/lib/auth";
import { addDays, diffDays, formatDay, formatDayLong, formatRange, isISODate, range, relativeDay, todayIn } from "@/lib/dates";
import { getClient, utcToLocalDate } from "@/lib/admin";
import { getAssignments, getEntries, getHabitChecks, getHabitsInRange, getMarks, getMoods, habitActiveOn } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { LEVEL_COLOR, SCALES, type ColorTracker } from "@/lib/trackers";
import { PageTitle } from "@/components/Shell";
import { StatsView } from "@/components/StatsView";
import { ResetLinkButton } from "@/components/AdminClientTools";

const PERIODS = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "custom", label: "Период" },
] as const;

export default async function ClientPage({ params, searchParams }: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const client = getClient(Number(id));
  if (!client) notFound();
  const sp = await searchParams;
  const tz = await getTz();
  const today = todayIn(tz);

  const period = (PERIODS.find((p) => p.key === sp.period)?.key ?? "week") as (typeof PERIODS)[number]["key"];
  let from = addDays(today, -6);
  let to = today;
  if (period === "today") from = today;
  if (period === "month") from = addDays(today, -29);
  if (period === "custom") {
    from = isISODate(sp.from) ? sp.from : addDays(today, -13);
    to = isISODate(sp.to) && sp.to <= today ? sp.to : today;
    if (from > to) [from, to] = [to, from];
    if (diffDays(from, to) > 365) from = addDays(to, -365);
  }

  const stats = computeStats(client.id, from, to);
  const marks: Record<ColorTracker, ReturnType<typeof getMarks>> = {
    rating: getMarks(client.id, "rating", from, to),
    anxiety: getMarks(client.id, "anxiety", from, to),
    mood: getMarks(client.id, "mood", from, to),
  };
  const moods = new Map(getMoods(true).map((m) => [m.id, m.label]));
  const habits = getHabitsInRange(client.id, from, to);
  const checks = getHabitChecks(client.id, from, to);
  const entries = getEntries(client.id, null, from, to);
  const assignments = getAssignments(client.id, true);
  const days = range(from, to).reverse();
  const last = utcToLocalDate(client.last_active_at, tz);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-ink">← Все клиенты</Link>
        <div className="mt-3">
          <PageTitle title={client.name}>
            <span className="text-sm">
              {client.login} · с нами с {formatDay(utcToLocalDate(client.created_at, tz)!)} · последняя активность: {relativeDay(last, today)}
            </span>
          </PageTitle>
        </div>
      </div>

      {/* Задания */}
      <section className="paper p-5 sm:p-6">
        <h2 className="font-serif text-xl">Задания от психолога</h2>
        <form action={createAssignment} className="mt-4 space-y-3">
          <input type="hidden" name="userId" value={client.id} />
          <textarea
            name="text"
            required
            rows={3}
            className="field resize-y"
            placeholder="Например: «Домашнее задание на эту неделю: отмечать тревожность каждый вечер»"
          />
          <button className="btn btn-primary btn-sm">Отправить клиенту</button>
        </form>
        {assignments.length > 0 && (
          <ul className="mt-5 divide-y divide-line/70">
            {assignments.map((a) => (
              <li key={a.id} className={`flex items-start gap-3 py-3 ${a.archived ? "opacity-50" : ""}`}>
                <div className="flex-1">
                  <p className="whitespace-pre-line">{a.text}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {formatDay(utcToLocalDate(a.created_at, tz)!)} ·{" "}
                    {a.archived ? "в архиве" : a.done_at ? <span className="text-sage">клиент отметил, что выполняет</span> : "клиент ещё не отметил"}
                  </p>
                </div>
                {!a.archived && (
                  <form action={archiveAssignment}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-full px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-cream">Убрать</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Период */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`?period=${p.key}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${period === p.key ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:text-ink"}`}
            >
              {p.label}
            </Link>
          ))}
          <span className="ml-auto text-sm text-ink-soft">{formatRange(from, to)}</span>
        </div>
        {period === "custom" && (
          <form className="paper mb-4 flex flex-wrap items-end gap-3 p-4">
            <input type="hidden" name="period" value="custom" />
            <label>
              <span className="label">С</span>
              <input type="date" name="from" defaultValue={from} max={today} className="field py-2" />
            </label>
            <label>
              <span className="label">По</span>
              <input type="date" name="to" defaultValue={to} max={today} className="field py-2" />
            </label>
            <button className="btn btn-soft btn-sm">Показать</button>
          </form>
        )}
        <StatsView s={stats} />
      </section>

      {/* История по дням */}
      <section>
        <h2 className="mb-4 font-serif text-2xl">История заполнения</h2>
        <div className="space-y-3">
          {days.map((d) => {
            const dayHabits = habits.filter((h) => habitActiveOn(h, d));
            const done = dayHabits.filter((h) => checks[h.id]?.includes(d));
            const main = entries.find((e) => e.date === d && e.kind === "main");
            const grat = entries.find((e) => e.date === d && e.kind === "gratitude");
            const empty = !marks.rating[d] && !marks.anxiety[d] && !marks.mood[d] && !done.length && !main && !grat;
            if (empty) {
              return (
                <div key={d} className="rounded-2xl border border-dashed border-line px-5 py-3 text-sm text-ink-faint">
                  {formatDayLong(d)} — без отметок
                </div>
              );
            }
            return (
              <div key={d} className="paper p-5">
                <div className="mb-3 text-xs font-semibold tracking-wide text-terracotta uppercase">{formatDayLong(d)}</div>
                <div className="flex flex-wrap gap-2">
                  {(["rating", "anxiety", "mood"] as const).map((t) => {
                    const m = marks[t][d];
                    if (!m) return null;
                    const label = t === "mood" ? (m.moodId ? moods.get(m.moodId) : m.note) ?? SCALES.mood.labels[m.level] : SCALES[t].labels[m.level];
                    return (
                      <span key={t} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ background: LEVEL_COLOR[m.level] + "40" }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[m.level] }} />
                        <span className="text-ink-soft">{{ rating: "День", anxiety: "Тревога", mood: "Настроение" }[t]}:</span> {label}
                      </span>
                    );
                  })}
                </div>
                {dayHabits.length > 0 && (
                  <p className="mt-3 text-sm text-ink-soft">
                    Привычки {done.length}/{dayHabits.length}
                    {done.length > 0 && <>: {done.map((h) => h.title).join(", ")}</>}
                  </p>
                )}
                {main && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-ink-faint">Главное за день</div>
                    <p className="font-hand text-xl leading-snug whitespace-pre-line">{main.text}</p>
                  </div>
                )}
                {grat && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-ink-faint">Благодарность себе</div>
                    <p className="font-hand text-xl leading-snug whitespace-pre-line">{grat.text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Управление */}
      <section className="paper space-y-5 p-5 sm:p-6">
        <h2 className="font-serif text-xl">Управление клиентом</h2>
        <ResetLinkButton userId={client.id} />
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-bordeaux">Удалить клиента и все его данные</summary>
          <form action={deleteClient} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="userId" value={client.id} />
            <input name="confirm" placeholder="напишите «удалить»" className="field max-w-60 py-2" required />
            <button className="btn btn-sm bg-bordeaux text-white">Удалить навсегда</button>
          </form>
        </details>
      </section>
    </div>
  );
}
