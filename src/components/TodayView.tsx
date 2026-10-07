"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { setMark, toggleHabit } from "@/app/actions/trackers";
import { formatDayLong } from "@/lib/dates";
import { ENTRY_META, SCALES, type EntryKind, type Level, type Mark, type Mood } from "@/lib/trackers";
import { Check, TRACKER_ICON } from "./Doodles";
import { LinedTextarea, SaveStatus, useAutosave } from "./JournalView";
import { LevelPicker, MoodPicker } from "./Pickers";

type Props = {
  date: string;
  today: string;
  marks: { rating?: Mark; anxiety?: Mark; mood?: Mark };
  moods: Mood[];
  habits: { id: number; title: string }[];
  checked: number[];
  entries: { main: string; gratitude: string };
};

function Section({ icon, title, done, children, aside }: { icon: keyof typeof TRACKER_ICON; title: string; done: boolean; children: ReactNode; aside?: ReactNode }) {
  const Icon = TRACKER_ICON[icon];
  return (
    <section className="paper p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${done ? "bg-sage text-white" : "bg-cream text-terracotta"}`}>
          {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </span>
        <h2 className="flex-1 font-serif text-lg">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function TodayView({ date, today, marks: initialMarks, moods, habits, checked, entries }: Props) {
  const [marks, setMarks] = useState(initialMarks);
  const [checks, setChecks] = useState(new Set(checked));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function saveMark(tracker: "rating" | "anxiety" | "mood", mark: Mark) {
    const prev = marks[tracker];
    setMarks((m) => ({ ...m, [tracker]: mark }));
    startTransition(async () => {
      try {
        await setMark(tracker, date, mark.level, mark.moodId ?? null, mark.note ?? null);
      } catch {
        setMarks((m) => ({ ...m, [tracker]: prev }));
        setError("Не удалось сохранить — проверьте интернет.");
      }
    });
  }

  function toggle(id: number) {
    const done = !checks.has(id);
    const apply = (on: boolean) =>
      setChecks((s) => {
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
    apply(done);
    startTransition(async () => {
      try {
        await toggleHabit(id, date, done);
      } catch {
        apply(!done);
        setError("Не удалось сохранить — проверьте интернет.");
      }
    });
  }

  const moodLabel = marks.mood ? (marks.mood.moodId ? moods.find((m) => m.id === marks.mood!.moodId)?.label : marks.mood.note) : null;

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-[#f6dcd5] px-4 py-3 text-sm text-bordeaux">{error}</p>}

      <Section icon="rating" title="Рейтинг дня" done={!!marks.rating}>
        <LevelPicker compact tracker="rating" value={marks.rating?.level as Level | undefined} onChange={(l) => saveMark("rating", { level: l })} />
      </Section>

      <Section icon="anxiety" title="Тревожность" done={!!marks.anxiety}>
        <LevelPicker compact tracker="anxiety" value={marks.anxiety?.level as Level | undefined} onChange={(l) => saveMark("anxiety", { level: l })} />
      </Section>

      <Section icon="mood" title={SCALES.mood.question} done={!!marks.mood} aside={moodLabel && <span className="text-sm text-ink-soft">{moodLabel}</span>}>
        <MoodPicker moods={moods} value={marks.mood} onChange={(m) => saveMark("mood", m)} />
      </Section>

      <Section
        icon="habits"
        title="Полезные привычки"
        done={habits.length > 0 && checks.size >= habits.length}
        aside={habits.length > 0 && <span className="text-sm font-semibold text-ink-soft">{habits.filter((h) => checks.has(h.id)).length}/{habits.length}</span>}
      >
        {habits.length === 0 ? (
          <Link href="/app/habits" className="text-sm font-semibold text-terracotta hover:underline">
            + Добавить привычки
          </Link>
        ) : (
          <div className="space-y-2">
            {habits.map((h) => {
              const done = checks.has(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:scale-[0.99] ${done ? "bg-[#e6eddc]" : "bg-cream/70 hover:bg-cream"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? "animate-pop border-sage bg-sage text-white" : "border-[#d8c8b3] bg-white/50"}`}>
                    {done && <Check className="h-4 w-4" />}
                  </span>
                  <span className={`font-medium ${done ? "text-[#3f5a31]" : ""}`}>{h.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <EntrySection kind="main" date={date} initial={entries.main} />
      <EntrySection kind="gratitude" date={date} initial={entries.gratitude} />

      <div className="pt-4 text-center">
        <Link href="/app" className="btn btn-primary">
          Готово
        </Link>
        <p className="mt-3 text-xs text-ink-faint">Всё сохраняется автоматически · {date === today ? "сегодня" : formatDayLong(date)}</p>
      </div>
    </div>
  );
}

function EntrySection({ kind, date, initial }: { kind: EntryKind; date: string; initial: string }) {
  const [text, setText] = useState(initial);
  const { status, schedule, flush } = useAutosave(kind, date);
  return (
    <Section icon={kind} title={ENTRY_META[kind].question} done={!!text.trim()} aside={<SaveStatus status={status} />}>
      <LinedTextarea
        value={text}
        onChange={(v) => {
          setText(v);
          schedule(v);
        }}
        onBlur={() => void flush()}
        placeholder={ENTRY_META[kind].prompts[0]}
        rows={4}
      />
    </Section>
  );
}
