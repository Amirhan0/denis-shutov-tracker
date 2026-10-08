import { getToday, requireClient } from "@/lib/auth";
import { getHabitChecks, getHabitsInRange } from "@/lib/data";
import { HabitsView } from "@/components/HabitsView";
import { PageTitle } from "@/components/Shell";

export default async function HabitsPage() {
  const user = await requireClient();
  const today = await getToday();
  const habits = await getHabitsInRange(user.id, "2000-01-01", today);
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="маленькие шаги" title="Полезные привычки">
        Нажмите на привычку, чтобы отметить её выполненной.
      </PageTitle>
      <HabitsView
        today={today}
        habits={habits.map(({ id, title, created_at, archived_at }) => ({ id, title, created_at, archived_at }))}
        initialChecks={await getHabitChecks(user.id, "2000-01-01", today)}
      />
    </div>
  );
}
