"use client";

import { useMemo, useState, useTransition } from "react";
import { setMark, setMoods } from "@/app/actions/trackers";
import { enqueue } from "@/lib/queue";
import { MONTHS, MONTHS_SHORT, WEEKDAYS_SHORT, daysInMonth, formatDayLong, parts, toISO, weekdayIndex } from "@/lib/dates";
import { SCALES, markBackground, markFromPicks, moodPicks, type ColorTracker, type Mark, type Mood } from "@/lib/trackers";
import { Legend, LevelPicker, MoodPicker, Sheet, markLabel } from "./Pickers";

type Props = {
  tracker: ColorTracker;
  today: string;
  initialMarks: Record<string, Mark>;
  moods?: Mood[];
};

export function ColorTrackerView({ tracker, today, initialMarks, moods = [] }: Props) {
  const [marks, setMarks] = useState(initialMarks);
  const [view, setView] = useState<"month" | "year">("month");
  const t = parts(today);
  const [cursor, setCursor] = useState({ y: t.y, m: t.m });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const moodMap = useMemo(() => new Map(moods.map((m) => [m.id, m])), [moods]);

  function save(date: string, mark: Mark | null, keepOpen = false) {
    const prev = marks[date];
    setMarks((all) => {
      const next = { ...all };
      if (mark) next[date] = mark;
      else delete next[date];
      return next;
    });
    if (!keepOpen) setTimeout(() => setSelected(null), 160);
    setError(null);
    startTransition(async () => {
      try {
        if (tracker === "mood") await enqueue(() => setMoods(date, moodPicks(mark ?? undefined)));
        else await setMark(tracker, date, mark?.level ?? null, mark?.moodId ?? null, mark?.note ?? null);
      } catch {
        setMarks((all) => {
          const next = { ...all };
          if (prev) next[date] = prev;
          else delete next[date];
          return next;
        });
        setError("Не удалось сохранить — проверьте интернет и попробуйте ещё раз.");
      }
    });
  }

  const shiftMonth = (d: number) =>
    setCursor(({ y, m }) => {
      const n = y * 12 + m + d;
      return { y: Math.floor(n / 12), m: n % 12 };
    });

  const filledThisMonth = Object.keys(marks).filter((d) => d.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`)).length;

  return (
    <div>
      {/* Переключатель вида */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#ece1d0] p-1 text-sm font-semibold">
          {(["month", "year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 transition ${view === v ? "bg-paper text-ink shadow-sm" : "text-ink-soft"}`}
            >
              {v === "month" ? "Месяц" : "Год"}
            </button>
          ))}
        </div>
        <button onClick={() => setSelected(today)} className="btn btn-primary btn-sm">
          Отметить сегодня
        </button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-[#f6dcd5] px-4 py-3 text-sm text-bordeaux">{error}</p>}

      <div className="paper p-4 sm:p-6">
        {/* Навигация */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => (view === "month" ? shiftMonth(-1) : setCursor((c) => ({ ...c, y: c.y - 1 })))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream"
            aria-label="Назад"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-serif text-xl">{view === "month" ? `${MONTHS[cursor.m]} ${cursor.y}` : cursor.y}</div>
            {view === "month" && <div className="text-xs text-ink-faint">отмечено дней: {filledThisMonth}</div>}
          </div>
          <button
            onClick={() => (view === "month" ? shiftMonth(1) : setCursor((c) => ({ ...c, y: c.y + 1 })))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream"
            aria-label="Вперёд"
          >
            ›
          </button>
        </div>

        {view === "month" ? (
          <MonthGrid
            y={cursor.y}
            m={cursor.m}
            today={today}
            marks={marks}
            onPick={setSelected}
            label={(d) => markLabel(tracker, marks[d], moodMap)}
            showLabels={tracker === "mood"}
          />
        ) : (
          <YearGrid y={cursor.y} today={today} marks={marks} onPick={setSelected} label={(d) => markLabel(tracker, marks[d], moodMap)} />
        )}
      </div>

      <div className="mt-5 px-1">
        <Legend tracker={tracker} />
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected && (
            <>
              <div className="text-xs font-sans font-semibold tracking-wide text-ink-faint uppercase">{formatDayLong(selected)}</div>
              {SCALES[tracker].question}
            </>
          )
        }
      >
        {selected && (
          <div key={selected}>
            {tracker === "mood" ? (
              <>
                <MoodPicker moods={moods} value={marks[selected]} onChange={(picks) => save(selected, markFromPicks(picks), true)} />
                <button onClick={() => setSelected(null)} className="btn btn-primary mt-5 w-full">
                  Готово
                </button>
              </>
            ) : (
              <LevelPicker tracker={tracker} value={marks[selected]?.level} onChange={(l) => save(selected, { level: l })} />
            )}
            {marks[selected] && (
              <button onClick={() => save(selected, null)} className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold text-ink-soft hover:bg-cream">
                Очистить отметку
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function MonthGrid({
  y,
  m,
  today,
  marks,
  onPick,
  label,
  showLabels,
}: {
  y: number;
  m: number;
  today: string;
  marks: Record<string, Mark>;
  onPick: (d: string) => void;
  label: (d: string) => string;
  showLabels: boolean;
}) {
  const total = daysInMonth(y, m);
  const offset = weekdayIndex(toISO(y, m, 1));
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[0.7rem] font-semibold tracking-wide text-ink-faint uppercase">
        {WEEKDAYS_SHORT.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={"e" + i} />
        ))}
        {Array.from({ length: total }).map((_, i) => {
          const d = toISO(y, m, i + 1);
          const mark = marks[d];
          const future = d > today;
          const isToday = d === today;
          const text = label(d);
          return (
            <button
              key={d}
              disabled={future}
              onClick={() => onPick(d)}
              title={text || undefined}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition sm:rounded-2xl ${
                mark ? "text-[#2e2420] shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)]" : "border-[1.5px] border-dashed border-line text-ink-soft hover:border-ink-faint"
              } ${future ? "opacity-35" : "active:scale-95"} ${isToday ? "ring-2 ring-ink/70 ring-offset-2 ring-offset-paper" : ""}`}
              style={mark ? { background: markBackground(mark) } : undefined}
            >
              {i + 1}
              {showLabels && mark && (
                <span className="hidden w-full truncate px-1 text-[0.62rem] font-medium opacity-80 sm:block">{text}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearGrid({
  y,
  today,
  marks,
  onPick,
  label,
}: {
  y: number;
  today: string;
  marks: Record<string, Mark>;
  onPick: (d: string) => void;
  label: (d: string) => string;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <div className="grid min-w-[19rem] grid-cols-[1.4rem_repeat(12,minmax(0,1fr))] gap-[3px] text-[0.62rem] sm:gap-1 sm:text-xs">
        <span />
        {MONTHS_SHORT.map((mm) => (
          <span key={mm} className="pb-1 text-center font-semibold text-ink-faint">
            {mm}
          </span>
        ))}
        {Array.from({ length: 31 }).map((_, row) => (
          <div key={row} className="contents">
            <span className="flex items-center justify-end pr-1 text-ink-faint">{row + 1}</span>
            {Array.from({ length: 12 }).map((_, col) => {
              if (row + 1 > daysInMonth(y, col)) return <span key={col} />;
              const d = toISO(y, col, row + 1);
              const mark = marks[d];
              const future = d > today;
              return (
                <button
                  key={col}
                  disabled={future}
                  onClick={() => onPick(d)}
                  title={`${row + 1} ${MONTHS_SHORT[col].toLowerCase()}${mark ? " — " + label(d) : ""}`}
                  className={`h-5 rounded-[5px] sm:h-6 ${mark ? "" : "border border-line"} ${future ? "opacity-40" : "hover:opacity-80"} ${
                    d === today ? "ring-[1.5px] ring-ink/70" : ""
                  }`}
                  style={mark ? { background: markBackground(mark) } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
