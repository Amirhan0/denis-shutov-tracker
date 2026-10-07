import { getToday, requireClient } from "@/lib/auth";
import { getMarks, getMoods } from "@/lib/data";
import { ColorTrackerView } from "@/components/ColorTrackerView";
import { PageTitle } from "@/components/Shell";

export default async function Page() {
  const user = await requireClient();
  const today = await getToday();
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="оттенки дня" title="Настроение">
        Выберите настроение, которое было главным в этот день.
      </PageTitle>
      <ColorTrackerView tracker="mood" today={today} initialMarks={getMarks(user.id, "mood", "2000-01-01", "2999-12-31")} moods={getMoods(true)} />
    </div>
  );
}
