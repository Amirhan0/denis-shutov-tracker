import { addMood, toggleMood, updateMood } from "@/app/actions/admin";
import { getMoods } from "@/lib/data";
import { LEVELS, LEVEL_COLOR, SCALES } from "@/lib/trackers";
import { PageTitle } from "@/components/Shell";

function ZoneSelect({ value }: { value?: number }) {
  return (
    <select name="zone" defaultValue={value ?? 2} className="field w-auto py-2">
      {LEVELS.map((l) => (
        <option key={l} value={l}>{SCALES.mood.labels[l]}</option>
      ))}
    </select>
  );
}

export default async function MoodsPage() {
  const moods = await getMoods(true);
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="настройки" title="Настроения">
        Набор настроений, из которых клиенты выбирают в трекере. Скрытые настроения сохраняются в старых отметках.
      </PageTitle>
      <div className="space-y-6">
        {LEVELS.map((zone) => (
          <div key={zone} className="paper p-5">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-lg">
              <span className="h-4 w-4 rounded-full" style={{ background: LEVEL_COLOR[zone] }} />
              {SCALES.mood.labels[zone]}
            </h2>
            <div className="space-y-2">
              {moods.filter((m) => m.zone === zone).map((m) => (
                <div key={m.id} className={`flex flex-wrap items-center gap-2 ${m.active ? "" : "opacity-50"}`}>
                  <form action={updateMood} className="flex flex-1 flex-wrap gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="label" defaultValue={m.label} className="field min-w-36 flex-1 py-2" required maxLength={40} />
                    <ZoneSelect value={m.zone} />
                    <button className="btn btn-soft btn-sm">Сохранить</button>
                  </form>
                  <form action={toggleMood}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-sm text-ink-soft hover:bg-cream">{m.active ? "Скрыть" : "Вернуть"}</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
        <form action={addMood} className="paper flex flex-wrap items-end gap-2 p-5">
          <label className="min-w-40 flex-1">
            <span className="label">Новое настроение</span>
            <input name="label" className="field py-2" required maxLength={40} placeholder="Например, Нежность" />
          </label>
          <ZoneSelect />
          <button className="btn btn-primary btn-sm">Добавить</button>
        </form>
      </div>
    </div>
  );
}
