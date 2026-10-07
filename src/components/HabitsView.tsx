"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addHabit, removeHabit, renameHabit, replaceHabit, toggleHabit } from "@/app/actions/trackers";
import { MONTHS, WEEKDAYS_SHORT, addDays, daysInMonth, formatDayLong, parts, startOfWeek, toISO } from "@/lib/dates";
import { MAX_HABITS } from "@/lib/trackers";
import { Check } from "./Doodles";
import { Sheet } from "./Pickers";

export type HabitDTO = { id: number; title: string; created_at: string; archived_at: string | null };

const activeOn = (h: HabitDTO, d: string) => h.created_at <= d && (h.archived_at === null || d < h.archived_at);

export function HabitsView({ today, habits, initialChecks }: { today: string; habits: HabitDTO[]; initialChecks: Record<number, string[]> }) {
  const [checks, setChecks] = useState(() => {
    const s = new Set<string>();
    for (const [id, dates] of Object.entries(initialChecks)) for (const d of dates) s.add(`${id}:${d}`);
    return s;
  });
  const [date, setDate] = useState(today);
  const [manage, setManage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const p = parts(date);
  const [cursor, setCursor] = useState({ y: p.y, m: p.m });

  const active = habits.filter((h) => h.archived_at === null);
  const dayHabits = habits.filter((h) => activeOn(h, date));
  const weekStart = startOfWeek(date);

  function toggle(id: number, d: string) {
    const key = `${id}:${d}`;
    const done = !checks.has(key);
    const apply = (on: boolean) =>
      setChecks((s) => {
        const n = new Set(s);
        if (on) n.add(key);
        else n.delete(key);
        return n;
      });
    apply(done);
    setError(null);
    startTransition(async () => {
      try {
        await toggleHabit(id, d, done);
      } catch {
        apply(!done);
        setError("Не удалось сохранить — попробуйте ещё раз.");
      }
    });
  }

  const monthEnd = toISO(cursor.y, cursor.m, daysInMonth(cursor.y, cursor.m));
  const monthStart = toISO(cursor.y, cursor.m, 1);
  const monthHabits = habits.filter((h) => h.created_at <= monthEnd && (h.archived_at === null || h.archived_at > monthStart) && (h.archived_at === null || h.archived_at > h.created_at));

  return (
    <div className="space-y-6">
      {/* Выбор дня */}
      <div className="paper p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setDate(addDays(date, -7))} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream" aria-label="Предыдущая неделя">‹</button>
          <span className="text-sm font-semibold text-ink-soft">{formatDayLong(date)}</span>
          <button
            onClick={() => setDate(addDays(date, 7) > today ? today : addDays(date, 7))}
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
            const future = d > today;
            const total = habits.filter((h) => activeOn(h, d)).length;
            const done = habits.filter((h) => activeOn(h, d) && checks.has(`${h.id}:${d}`)).length;
            const sel = d === date;
            return (
              <button
                key={d}
                disabled={future}
                onClick={() => setDate(d)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition ${sel ? "bg-ink text-paper" : "hover:bg-cream"} ${future ? "opacity-30" : ""}`}
              >
                <span className={`text-[0.65rem] font-semibold uppercase ${sel ? "text-paper/70" : "text-ink-faint"}`}>{WEEKDAYS_SHORT[i]}</span>
                <span className="text-base font-semibold">{parts(d).d}</span>
                <span className="flex h-1.5 gap-0.5">
                  {total > 0 && !future && (
                    <span className="h-1.5 w-5 overflow-hidden rounded-full bg-line">
                      <span className="block h-full bg-sage" style={{ width: `${(done / total) * 100}%` }} />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-xl bg-[#f6dcd5] px-4 py-3 text-sm text-bordeaux">{error}</p>}

      {/* Привычки дня */}
      <div className="space-y-2.5">
        {dayHabits.length === 0 && (
          <div className="paper p-6 text-center text-ink-soft">
            {active.length === 0 ? "Добавьте до пяти привычек, которые хотите привить." : "В этот день привычки ещё не велись."}
          </div>
        )}
        {dayHabits.map((h) => {
          const done = checks.has(`${h.id}:${date}`);
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id, date)}
              className={`flex w-full items-center gap-4 rounded-[1.25rem] border-[1.5px] px-4 py-4 text-left transition active:scale-[0.99] ${
                done ? "border-sage/60 bg-[#e6eddc]" : "border-line bg-paper hover:border-ink-faint"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  done ? "animate-pop border-sage bg-sage text-white" : "border-[#d8c8b3]"
                }`}
              >
                {done && <Check className="h-5 w-5" />}
              </span>
              <span className={`text-[1.05rem] font-medium ${done ? "text-[#3f5a31]" : ""}`}>{h.title}</span>
            </button>
          );
        })}
        <button onClick={() => setManage(true)} className="btn btn-ghost btn-sm w-full">
          ✎ Управлять привычками ({active.length}/{MAX_HABITS})
        </button>
      </div>

      {/* Обзор месяца */}
      <div className="paper p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <span className="font-serif text-xl">
            {MONTHS[cursor.m]} {cursor.y}
          </span>
          <button
            onClick={() => setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-cream"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>
        {monthHabits.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-faint">В этом месяце привычек не было</p>
        ) : (
          <div className="space-y-5">
            {monthHabits.map((h) => {
              const days = Array.from({ length: daysInMonth(cursor.y, cursor.m) }, (_, i) => toISO(cursor.y, cursor.m, i + 1));
              const possible = days.filter((d) => activeOn(h, d) && d <= today);
              const done = possible.filter((d) => checks.has(`${h.id}:${d}`)).length;
              return (
                <div key={h.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {h.title}
                      {h.archived_at && <span className="ml-2 text-xs text-ink-faint">в архиве</span>}
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft">
                      {done}/{possible.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
                    {days.map((d, i) => {
                      const on = checks.has(`${h.id}:${d}`);
                      const can = activeOn(h, d) && d <= today;
                      return (
                        <button
                          key={d}
                          disabled={!can}
                          onClick={() => setDate(d)}
                          title={`${i + 1}`}
                          className={`flex aspect-square items-center justify-center rounded-md text-[0.55rem] transition ${
                            on ? "bg-sage text-white" : can ? "border border-line text-ink-faint" : "opacity-25"
                          } ${d === date ? "ring-[1.5px] ring-ink/70" : ""}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={manage} onClose={() => setManage(false)} title="Мои привычки">
        <ManageHabits habits={active} />
      </Sheet>
    </div>
  );
}

function ManageHabits({ habits }: { habits: HabitDTO[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Что-то пошло не так");
      }
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Одновременно — до {MAX_HABITS} привычек. При замене или удалении прошлые отметки сохраняются в истории.
      </p>
      {habits.map((h) => (
        <HabitRow key={h.id + h.title} habit={h} disabled={pending} run={run} />
      ))}
      {habits.length < MAX_HABITS && (
        <form
          className="flex gap-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = newTitle;
            setNewTitle("");
            run(() => addHabit(t));
          }}
        >
          <input className="field" placeholder="Новая привычка" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={60} />
          <button className="btn btn-primary shrink-0" disabled={!newTitle.trim() || pending}>
            Добавить
          </button>
        </form>
      )}
      {error && <p className="text-sm text-bordeaux">{error}</p>}
    </div>
  );
}

function HabitRow({ habit, disabled, run }: { habit: HabitDTO; disabled: boolean; run: (fn: () => Promise<void>) => void }) {
  const [mode, setMode] = useState<null | "rename" | "replace">(null);
  const [value, setValue] = useState(habit.title);

  if (mode) {
    return (
      <form
        className="animate-fade space-y-2 rounded-2xl bg-cream/70 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          run(() => (mode === "rename" ? renameHabit(habit.id, value) : replaceHabit(habit.id, value)));
          setMode(null);
        }}
      >
        <label className="label">{mode === "rename" ? "Новое название" : `Чем заменить «${habit.title}»?`}</label>
        <input className="field" value={value} onChange={(e) => setValue(e.target.value)} autoFocus maxLength={60} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setMode(null)} className="btn btn-sm text-ink-soft">
            Отмена
          </button>
          <button className="btn btn-primary btn-sm" disabled={disabled}>
            Сохранить
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 rounded-2xl border border-line bg-white/60 py-2 pr-2 pl-4">
      <span className="min-w-[9rem] flex-1 font-medium">{habit.title}</span>
      <button onClick={() => setMode("rename")} className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream" disabled={disabled}>
        Переименовать
      </button>
      <button
        onClick={() => {
          setValue("");
          setMode("replace");
        }}
        className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream"
        disabled={disabled}
      >
        Заменить
      </button>
      <button
        onClick={() => confirm(`Убрать привычку «${habit.title}»? Прошлые отметки останутся в истории.`) && run(() => removeHabit(habit.id))}
        className="rounded-full px-2 py-1.5 text-xs font-semibold text-bordeaux hover:bg-[#f6dcd5]"
        disabled={disabled}
        aria-label="Удалить"
      >
        ✕
      </button>
    </div>
  );
}
