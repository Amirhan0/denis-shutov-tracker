import { getToday, requireClient } from "@/lib/auth";
import { getMarks } from "@/lib/data";
import { ColorTrackerView } from "@/components/ColorTrackerView";
import { PageTitle } from "@/components/Shell";

export default async function Page() {
  const user = await requireClient();
  const today = await getToday();
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="как прошёл день" title="Рейтинг дня">
        Нажмите на день и выберите цвет. Отметку всегда можно изменить.
      </PageTitle>
      <ColorTrackerView tracker="rating" today={today} initialMarks={await getMarks(user.id, "rating", "2000-01-01", "2999-12-31")} />
    </div>
  );
}
