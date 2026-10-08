import Link from "next/link";
import { getToday, requireClient } from "@/lib/auth";
import { addDays, formatRange, isISODate, startOfWeek } from "@/lib/dates";
import { computeStats } from "@/lib/stats";
import { PageTitle } from "@/components/Shell";
import { StatsView } from "@/components/StatsView";

export default async function StatsPage({ searchParams }: PageProps<"/app/stats">) {
  const user = await requireClient();
  const today = await getToday();
  const sp = await searchParams;
  const thisWeek = startOfWeek(today);
  const from = isISODate(sp.week) && sp.week <= thisWeek ? startOfWeek(sp.week) : thisWeek;
  const end = addDays(from, 6);
  const to = end > today ? today : end;
  const isCurrent = from === thisWeek;
  const s = await computeStats(user.id, from, to, isCurrent ? "На этой неделе" : "На той неделе");

  return (
    <div>
      <PageTitle eyebrow="еженедельная статистика" title="Моя неделя" />
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={`/app/stats?week=${addDays(from, -7)}`} className="btn btn-ghost btn-sm">‹ Раньше</Link>
        <span className="text-center font-semibold">
          {formatRange(from, end)}
          {isCurrent && <span className="block text-xs font-normal text-ink-faint">текущая неделя</span>}
        </span>
        {isCurrent ? <span className="w-[6.5rem]" /> : <Link href={`/app/stats?week=${addDays(from, 7)}`} className="btn btn-ghost btn-sm">Позже ›</Link>}
      </div>
      <StatsView s={s} />
    </div>
  );
}
