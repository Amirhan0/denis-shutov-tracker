"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOnboardingHabits } from "@/app/actions/trackers";
import { MAX_HABITS } from "@/lib/trackers";

const SUGGESTIONS = [
  "Выпить воду утром",
  "Сделать зарядку",
  "Прогуляться 30 минут",
  "Не пользоваться телефоном перед сном",
  "Читать 20 минут",
  "Лечь спать до 23:00",
  "5 минут тишины",
];

export function WelcomeForm() {
  const [items, setItems] = useState<string[]>(["", "", ""]);
  const filled = items.filter((s) => s.trim());

  function suggest(s: string) {
    setItems((items) => {
      if (items.includes(s)) return items;
      const i = items.findIndex((x) => !x.trim());
      if (i >= 0) return items.map((x, j) => (j === i ? s : x));
      return items.length < MAX_HABITS ? [...items, s] : items;
    });
  }

  return (
    <form action={saveOnboardingHabits} className="space-y-5">
      <div className="space-y-2.5">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-5 text-right font-hand text-2xl text-terracotta">{i + 1}</span>
            <input
              name="habit"
              value={v}
              maxLength={60}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="Например, прогулка 30 минут"
              className="field"
            />
          </div>
        ))}
        {items.length < MAX_HABITS && (
          <button type="button" onClick={() => setItems([...items, ""])} className="ml-8 text-sm font-semibold text-terracotta hover:underline">
            + ещё одна привычка
          </button>
        )}
      </div>

      <div>
        <p className="label">Идеи</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter((s) => !items.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => suggest(s)} className="chip text-sm">
              + {s}
            </button>
          ))}
        </div>
      </div>

      <SubmitButton label={filled.length ? "Сохранить и перейти в кабинет" : "Пропустить — добавлю позже"} />
      <p className="text-center text-xs text-ink-faint">Привычки можно изменить в любой момент</p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full" disabled={pending}>
      {pending ? "Сохраняем…" : label}
    </button>
  );
}
