import { getToday, requireClient } from "@/lib/auth";
import { getMarks } from "@/lib/data";
import { ColorTrackerView } from "@/components/ColorTrackerView";
import { PageTitle } from "@/components/Shell";

export default async function Page() {
  const user = await requireClient();
  const today = await getToday();
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="наблюдение за тревогой" title="Тревожность">
        Отмечайте, сколько тревоги было в течение дня — без оценок, просто наблюдение.
      </PageTitle>
      <ColorTrackerView tracker="anxiety" today={today} initialMarks={getMarks(user.id, "anxiety", "2000-01-01", "2999-12-31")} />
    </div>
  );
}
