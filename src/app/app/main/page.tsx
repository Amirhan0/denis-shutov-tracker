import { getToday, requireClient } from "@/lib/auth";
import { getEntries } from "@/lib/data";
import { ENTRY_META } from "@/lib/trackers";
import { JournalView } from "@/components/JournalView";
import { PageTitle } from "@/components/Shell";

export default async function Page() {
  const user = await requireClient();
  const today = await getToday();
  const entries = Object.fromEntries((await getEntries(user.id, "main", "2000-01-01", today)).map((e) => [e.date, e.text]));
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="страница дня" title={ENTRY_META.main.title} />
      <JournalView kind="main" today={today} initialEntries={entries} />
    </div>
  );
}
