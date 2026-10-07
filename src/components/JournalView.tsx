"use client";

import { useEffect, useRef, useState } from "react";
import { saveEntry } from "@/app/actions/trackers";
import { WEEKDAYS_SHORT, addDays, formatDay, formatDayLong, parts, startOfWeek } from "@/lib/dates";
import { ENTRY_META, type EntryKind } from "@/lib/trackers";

type Status = "idle" | "saving" | "saved" | "error";

/** Хук автосохранения текста с задержкой */
export function useAutosave(kind: EntryKind, date: string, onSaved?: (text: string, date: string) => void) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ date: string; text: string } | null>(null);

  async function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setStatus("saving");
    try {
      await saveEntry(kind, job.date, job.text);
      onSaved?.(job.text, job.date);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function schedule(text: string) {
    pending.current = { date, text };
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }

  // сохраняем при смене даты / уходе со страницы
  useEffect(() => () => void flush(), [date]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, schedule, flush };
}

export function SaveStatus({ status }: { status: Status }) {
  const text = { idle: "", saving: "сохраняю…", saved: "сохранено ✓", error: "не сохранилось — проверьте интернет" }[status];
  return <span className={`text-xs font-medium ${status === "error" ? "text-bordeaux" : "text-ink-faint"}`}>{text}</span>;
}

export function LinedTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 7,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      maxLength={5000}
      className="lined block w-full resize-none rounded-2xl border border-line font-hand text-[1.45rem] text-ink outline-none placeholder:text-ink-faint/70 focus:border-terracotta/50"
      style={{ minHeight: `${rows * 2}rem` }}
    />
  );
}

export function JournalView({ kind, today, initialEntries }: { kind: EntryKind; today: string; initialEntries: Record<string, string> }) {
  const meta = ENTRY_META[kind];
  const [entries, setEntries] = useState(initialEntries);
  const [date, setDate] = useState(today);
  const [text, setText] = useState(initialEntries[today] ?? "");
  const { status, schedule, flush } = useAutosave(kind, date, (t, d) => {
    if (!t.trim())
      setEntries((e) => {
        const n = { ...e };
        delete n[d];
        return n;
      });
  });

  function pick(d: string) {
    if (d > today) return;
    void flush();
    setDate(d);
    setText(entries[d] ?? "");
  }

  function update(v: string) {
    setText(v);
    setEntries((e) => ({ ...e, [date]: v }));
    schedule(v);
  }

  const weekStart = startOfWeek(date);
  const past = Object.entries(entries)
    .filter(([d, t]) => t.trim() && d !== date)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  return (
    <div className="space-y-6">
      {/* Неделя */}
      <div className="paper p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button onClick={() => pick(addDays(date, -7))} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream" aria-label="Предыдущая неделя">‹</button>
          <label className="relative cursor-pointer rounded-full px-3 py-1 text-sm font-semibold text-ink-soft hover:bg-cream">
            {formatDayLong(date)} ▾
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && pick(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Выбрать дату"
            />
          </label>
          <button
            onClick={() => pick(addDays(date, 7) > today ? today : addDays(date, 7))}
            disabled={date >= today}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream disabled:opacity-30"
            aria-label="Следующая неделя"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(weekStart, i);
            const sel = d === date;
            const has = !!entries[d]?.trim();
            return (
              <button
                key={d}
                disabled={d > today}
                onClick={() => pick(d)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition ${sel ? "bg-ink text-paper" : "hover:bg-cream"} disabled:opacity-30`}
              >
                <span className={`text-[0.65rem] font-semibold uppercase ${sel ? "text-paper/70" : "text-ink-faint"}`}>{WEEKDAYS_SHORT[i]}</span>
                <span className="text-base font-semibold">{parts(d).d}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${has ? (sel ? "bg-paper" : "bg-terracotta") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Страница */}
      <div className="paper p-4 sm:p-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg italic text-bordeaux">{meta.question}</h2>
          <SaveStatus status={status} />
        </div>
        <LinedTextarea value={text} onChange={update} onBlur={() => void flush()} placeholder={meta.prompts[0]} rows={8} />
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {meta.prompts.map((p) => (
            <button
              key={p}
              onClick={() => update((text.trim() ? text.replace(/\s*$/, "\n") : "") + p.replace("…", " "))}
              className="chip shrink-0 text-sm text-ink-soft"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* Прошлые записи */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 px-1 font-serif text-xl">Предыдущие записи</h3>
          <div className="space-y-2.5">
            {past.map(([d, t]) => (
              <button key={d} onClick={() => pick(d)} className="paper block w-full p-4 text-left transition hover:-translate-y-0.5">
                <div className="text-xs font-semibold tracking-wide text-terracotta uppercase">{formatDay(d)}</div>
                <p className="mt-1 line-clamp-2 font-hand text-xl leading-snug text-ink">{t}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
