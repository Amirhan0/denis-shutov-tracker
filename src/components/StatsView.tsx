import { LEVELS, LEVEL_COLOR, SCALES, type Level } from "@/lib/trackers";
import type { LevelCounts, Stats } from "@/lib/stats";
import { plural } from "@/lib/dates";

function Bar({ counts, tracker }: { counts: LevelCounts; tracker: "rating" | "anxiety" | "mood" }) {
  const total = LEVELS.reduce((s, l) => s + counts[l], 0);
  if (!total) return <div className="h-3 rounded-full bg-line/60" />;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {LEVELS.map((l) =>
          counts[l] ? <div key={l} style={{ width: `${(counts[l] / total) * 100}%`, background: LEVEL_COLOR[l] }} title={SCALES[tracker].labels[l]} /> : null,
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {LEVELS.map((l: Level) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
            {SCALES[tracker].labels[l]}: <b className="font-semibold text-ink">{counts[l]}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="paper p-5">
      <h3 className="mb-3 font-serif text-lg">{title}</h3>
      {children}
    </div>
  );
}

export function StatsView({ s }: { s: Stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="paper flex items-center gap-5 p-5 md:col-span-2">
        <div className="text-center">
          <div className="font-serif text-4xl">{s.filledDays}</div>
          <div className="text-xs text-ink-soft">{plural(s.filledDays, "день", "дня", "дней")} с отметками</div>
        </div>
        <div className="h-12 w-px bg-line" />
        <div className="text-center">
          <div className="font-serif text-4xl text-ink-faint">{s.emptyDays}</div>
          <div className="text-xs text-ink-soft">без заполнения</div>
        </div>
      </div>

      <Card title="Рейтинг дня">
        <p className="mb-4 leading-relaxed text-ink-soft">{s.rating.text}</p>
        <Bar counts={s.rating.counts} tracker="rating" />
      </Card>

      <Card title="Тревожность">
        <p className="leading-relaxed text-ink-soft">{s.anxiety.text}</p>
        {s.anxiety.filled > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            Спокойных дней: <b className="text-ink">{s.anxiety.calm}</b> · с заметной или сильной тревогой: <b className="text-ink">{s.anxiety.elevated}</b>
          </p>
        )}
        {s.anxiety.trend && <p className="mt-2 text-sm italic text-ink-soft">{s.anxiety.trend}</p>}
        <div className="mt-4">
          <Bar counts={s.anxiety.counts} tracker="anxiety" />
        </div>
      </Card>

      <Card title="Настроение">
        <p className="mb-3 leading-relaxed text-ink-soft">{s.mood.text}</p>
        {s.mood.top.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {s.mood.top.map((m) => (
              <span key={m.label} className="rounded-full bg-cream px-3 py-1 text-sm">
                {m.label} <span className="text-ink-faint">×{m.count}</span>
              </span>
            ))}
          </div>
        )}
        <Bar counts={s.mood.counts} tracker="mood" />
      </Card>

      <Card title="Привычки">
        <p className="mb-4 leading-relaxed text-ink-soft">{s.habitsText}</p>
        <div className="space-y-3">
          {s.habits.filter((h) => h.possible > 0).map((h) => (
            <div key={h.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {h.title}
                  {h.archived && <span className="ml-1 text-xs text-ink-faint">(архив)</span>}
                </span>
                <span className="font-semibold">{h.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-sage" style={{ width: `${h.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Записи">
        <div className="flex gap-6">
          <div>
            <div className="font-serif text-3xl">{s.entries.main}</div>
            <div className="text-sm text-ink-soft">«Главное за день»</div>
          </div>
          <div>
            <div className="font-serif text-3xl">{s.entries.gratitude}</div>
            <div className="text-sm text-ink-soft">«Благодарность себе»</div>
          </div>
        </div>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-ink-faint md:col-span-2">
        Статистика описывает ваши отметки и не является диагнозом или психологическим заключением.
      </p>
    </div>
  );
}
