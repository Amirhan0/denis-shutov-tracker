import { getToday, requireClient } from "@/lib/auth";
import { formatDayLong, isISODate } from "@/lib/dates";
import { getEntry, getHabitChecks, getHabitsInRange, getMarks, getMoods, habitActiveOn } from "@/lib/data";
import { PageTitle } from "@/components/Shell";
import { TodayView } from "@/components/TodayView";

export default async function TodayPage({ searchParams }: PageProps<"/app/today">) {
  const user = await requireClient();
  const today = await getToday();
  const sp = await searchParams;
  const date = isISODate(sp.date) && sp.date <= today ? sp.date : today;

  const habits = (await getHabitsInRange(user.id, date, date)).filter((h) => habitActiveOn(h, date));
  const checks = await getHabitChecks(user.id, date, date);

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle eyebrow={date === today ? "сегодня" : "заполнение за день"} title={formatDayLong(date)}>
        Пара минут для себя. Всё сохраняется автоматически.
      </PageTitle>
      <TodayView
        key={date}
        date={date}
        today={today}
        marks={{
          rating: (await getMarks(user.id, "rating", date, date))[date],
          anxiety: (await getMarks(user.id, "anxiety", date, date))[date],
          mood: (await getMarks(user.id, "mood", date, date))[date],
        }}
        moods={await getMoods(true)}
        habits={habits.map((h) => ({ id: h.id, title: h.title }))}
        checked={habits.filter((h) => checks[h.id]).map((h) => h.id)}
        entries={{ main: await getEntry(user.id, "main", date), gratitude: await getEntry(user.id, "gratitude", date) }}
      />
    </div>
  );
}
