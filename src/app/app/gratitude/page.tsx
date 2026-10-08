import { getToday, requireClient } from "@/lib/auth";
import { getEntries } from "@/lib/data";
import { ENTRY_META } from "@/lib/trackers";
import { JournalView } from "@/components/JournalView";
import { PageTitle } from "@/components/Shell";

export default async function Page() {
  const user = await requireClient();
  const today = await getToday();
  const entries = Object.fromEntries((await getEntries(user.id, "gratitude", "2000-01-01", today)).map((e) => [e.date, e.text]));
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="бережно к себе" title={ENTRY_META.gratitude.title} />
      <JournalView kind="gratitude" today={today} initialEntries={entries} />
    </div>
  );
}
