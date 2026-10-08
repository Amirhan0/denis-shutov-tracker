"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LEVELS, LEVEL_COLOR, MAX_MOOD_PICKS, SCALES, moodPicks, type ColorTracker, type Level, type Mark, type Mood, type MoodPick } from "@/lib/trackers";
import { Check } from "./Doodles";

/** Нижняя «шторка» на телефоне, модальное окно на десктопе */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="animate-fade absolute inset-0 bg-[#3b2f2a]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-paper px-5 pt-3 pb-safe shadow-2xl sm:max-w-md sm:rounded-[1.75rem] sm:pb-6">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="font-serif text-xl">{title}</div>
          <button onClick={onClose} className="-mr-1 rounded-full p-2 text-ink-faint hover:bg-cream hover:text-ink" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

export function markLabel(tracker: ColorTracker, mark: Mark | undefined, moods: Map<number, Mood>): string {
  if (!mark) return "";
  if (tracker === "mood")
    return (
      moodPicks(mark)
        .map((p) => (p.moodId ? moods.get(p.moodId)?.label : p.note))
        .filter(Boolean)
        .join(", ") || SCALES.mood.labels[mark.level]
    );
  return SCALES[tracker].labels[mark.level];
}

/** Выбор уровня для «Рейтинга дня» и «Тревожности» */
export function LevelPicker({
  tracker,
  value,
  onChange,
  compact = false,
}: {
  tracker: "rating" | "anxiety";
  value?: Level;
  onChange: (level: Level) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {LEVELS.map((l) => {
          const active = value === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange(l)}
              title={SCALES[tracker].labels[l]}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-[0.72rem] leading-tight transition ${
                active ? "border-ink/70 bg-white" : "border-transparent bg-cream/70 hover:bg-cream"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${active ? "animate-pop" : ""}`}
                style={{ background: LEVEL_COLOR[l] }}
              >
                {active && <Check className="h-5 w-5" />}
              </span>
              <span className="text-center text-ink-soft">{SCALES[tracker].labels[l].replace(" день", "").replace("Тревога практически отсутствует", "Почти нет")}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {LEVELS.map((l) => {
        const active = value === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition ${
              active ? "border-ink/60 bg-white" : "border-transparent bg-cream/70 hover:bg-cream"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: LEVEL_COLOR[l] }}>
              {active && <Check className="h-5 w-5" />}
            </span>
            <span className="font-medium">{SCALES[tracker].labels[l]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Выбор настроения: можно отметить несколько (например, утром спокойствие, вечером злость) */
export function MoodPicker({
  moods,
  value,
  onChange,
}: {
  moods: Mood[];
  value?: Mark;
  onChange: (picks: MoodPick[]) => void;
}) {
  const active = moods.filter((m) => m.active);
  const picks = moodPicks(value);
  // последний выбор — чтобы быстрые тапы подряд не теряли друг друга до перерисовки
  const latest = useRef(picks);
  latest.current = picks;
  const emit = (next: MoodPick[]) => {
    latest.current = next;
    onChange(next);
  };
  const custom = picks.filter((p) => !p.moodId);
  const [other, setOther] = useState(false);
  const [note, setNote] = useState("");
  const [zone, setZone] = useState<Level>(2);
  const full = picks.length >= MAX_MOOD_PICKS;

  function toggle(m: Mood) {
    const cur = latest.current;
    if (cur.some((p) => p.moodId === m.id)) emit(cur.filter((p) => p.moodId !== m.id));
    else if (cur.length < MAX_MOOD_PICKS) emit([...cur, { moodId: m.id, level: m.zone }]);
  }

  return (
    <div className="space-y-4">
      <p className="-mt-1 text-sm text-ink-faint">Можно выбрать несколько — например, утром одно, вечером другое.</p>
      {LEVELS.map((zoneLevel) => {
        const list = active.filter((m) => m.zone === zoneLevel);
        if (!list.length) return null;
        return (
          <div key={zoneLevel} className="flex flex-wrap gap-2">
            {list.map((m) => {
              const order = picks.findIndex((p) => p.moodId === m.id);
              const selected = order >= 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m)}
                  disabled={!selected && full}
                  className="chip disabled:opacity-40"
                  style={
                    selected
                      ? { background: LEVEL_COLOR[m.zone], borderColor: LEVEL_COLOR[m.zone], color: "#2e2420", fontWeight: 600 }
                      : { borderColor: LEVEL_COLOR[m.zone] + "99" }
                  }
                >
                  {selected ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[0.65rem] font-bold">{order + 1}</span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[m.zone] }} />
                  )}
                  {m.label}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {custom.map((p) => (
          <button
            key={p.note}
            type="button"
            onClick={() => emit(latest.current.filter((x) => x.note !== p.note || x.moodId))}
            className="chip"
            style={{ background: LEVEL_COLOR[p.level], borderColor: LEVEL_COLOR[p.level], color: "#2e2420", fontWeight: 600 }}
            title="Убрать"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[0.65rem] font-bold">{picks.indexOf(p) + 1}</span>
            {p.note} ✕
          </button>
        ))}
        {!full && (
          <button type="button" onClick={() => setOther((o) => !o)} className={`chip ${other ? "border-ink/50 bg-white" : ""}`}>
            ✎ Другое
          </button>
        )}
      </div>
      {other && !full && (
        <form
          className="animate-fade space-y-3 rounded-2xl bg-cream/70 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const t = note.trim();
            if (!t) return;
            emit([...latest.current, { note: t, level: zone, moodId: null }]);
            setNote("");
            setOther(false);
          }}
        >
          <input
            className="field"
            placeholder="Как бы вы назвали настроение?"
            value={note}
            maxLength={40}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">Цвет:</span>
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setZone(l)}
                aria-label={SCALES.mood.labels[l]}
                className={`h-8 w-8 rounded-full border-2 transition ${zone === l ? "scale-110 border-ink/70" : "border-transparent"}`}
                style={{ background: LEVEL_COLOR[l] }}
              />
            ))}
            <button className="btn btn-primary btn-sm ml-auto" disabled={!note.trim()}>
              Добавить
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function Legend({ tracker }: { tracker: ColorTracker }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-soft">
      {LEVELS.map((l) => (
        <span key={l} className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
          {SCALES[tracker].labels[l]}
        </span>
      ))}
    </div>
  );
}
