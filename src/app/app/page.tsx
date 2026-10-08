import Link from "next/link";
import { redirect } from "next/navigation";
import { getTz, requireClient } from "@/lib/auth";
import { formatDay, hourIn, todayIn } from "@/lib/dates";
import { getAssignments, getDayStatus } from "@/lib/data";
import { TRACKERS } from "@/lib/trackers";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Check, TRACKER_ICON, Underline } from "@/components/Doodles";

function greeting(h: number) {
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
}

export default async function Dashboard() {
  const user = await requireClient();
  if (!user.onboarded) redirect("/app/welcome");
  const tz = await getTz();
  const today = todayIn(tz);
  const s = await getDayStatus(user.id, today);
  const assignments = await getAssignments(user.id);

  const rows: { key: (typeof TRACKERS)[number]["key"]; done: boolean; text: string }[] = [
    { key: "rating", done: s.rating, text: s.rating ? "заполнен" : "не заполнен" },
    { key: "anxiety", done: s.anxiety, text: s.anxiety ? "заполнена" : "не заполнена" },
    { key: "mood", done: s.mood, text: s.mood ? "заполнено" : "не заполнено" },
    {
      key: "habits",
      done: s.habitsTotal > 0 && s.habitsDone === s.habitsTotal,
      text: s.habitsTotal ? `${s.habitsDone}/${s.habitsTotal}` : "не добавлены",
    },
    { key: "main", done: s.main, text: s.main ? "заполнено" : "не заполнено" },
    { key: "gratitude", done: s.gratitude, text: s.gratitude ? "заполнено" : "не заполнено" },
  ];
  const doneCount = rows.filter((r) => r.done).length;
  const pct = Math.round((doneCount / rows.length) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-[2rem] sm:text-4xl">
          {greeting(hourIn(tz))}, <span className="relative inline-block italic text-terracotta">
            {user.name}
            <Underline className="absolute -bottom-2 left-0 h-2.5 w-full text-mustard" />
          </span>
        </h1>
        <p className="mt-3 text-ink-soft">Сегодня: {formatDay(today)}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Прогресс дня */}
        <div className="paper p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">Прогресс дня</h2>
            <div className="relative h-14 w-14">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eadfce" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#7f9b6e" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{doneCount}/6</span>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-line/70">
            {rows.map((r) => {
              const t = TRACKERS.find((x) => x.key === r.key)!;
              return (
                <li key={r.key}>
                  <Link href={t.href} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${r.done ? "bg-sage text-white" : "border-2 border-line"}`}>
                      {r.done && <Check className="h-4 w-4" />}
                    </span>
                    <span className="flex-1 font-medium">{t.title}</span>
                    <span className={`text-sm ${r.done ? "text-sage" : "text-ink-faint"}`}>{r.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/app/today" className="btn btn-primary mt-5 w-full">
            {doneCount === 6 ? "Всё заполнено — посмотреть" : doneCount === 0 ? "Начать заполнение" : "Продолжить заполнение"}
          </Link>
        </div>

        <div className="space-y-5">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} id={a.id} text={a.text} done={!!a.done_at} />
          ))}
          <Link href="/app/stats" className="paper block p-5 transition hover:-translate-y-0.5">
            <p className="font-hand text-2xl leading-none text-terracotta">статистика недели</p>
            <p className="mt-2 text-ink-soft">Посмотрите, какие закономерности уже видны в ваших отметках →</p>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-serif text-2xl">Мои трекеры</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRACKERS.map((t) => {
            const Icon = TRACKER_ICON[t.key];
            return (
              <Link key={t.key} href={t.href} className="paper group flex flex-col p-4 transition hover:-translate-y-0.5 sm:p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: t.accent + "33", color: t.accent }}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-3 font-serif text-[1.05rem] leading-tight">{t.title}</span>
                <span className="mt-1 hidden text-sm leading-snug text-ink-soft sm:block">{t.description}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
