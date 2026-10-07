"use client";

import { useOptimistic, useTransition } from "react";
import { setAssignmentDone } from "@/app/actions/trackers";
import { Check } from "./Doodles";

export function AssignmentCard({ id, text, done }: { id: number; text: string; done: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [, start] = useTransition();
  return (
    <div className="relative overflow-hidden rounded-[1.375rem] border border-[#e9cdb9] bg-[#f8e8dc] p-5">
      <p className="font-hand text-2xl leading-none text-terracotta">задание от Дениса</p>
      <p className={`mt-3 whitespace-pre-line leading-relaxed ${optimistic ? "text-ink-soft line-through decoration-terracotta/40" : ""}`}>{text}</p>
      <button
        onClick={() =>
          start(async () => {
            setOptimistic(!optimistic);
            await setAssignmentDone(id, !optimistic);
          })
        }
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${optimistic ? "bg-sage text-white" : "bg-white/70 text-ink hover:bg-white"}`}
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${optimistic ? "border-white" : "border-ink-faint"}`}>
          {optimistic && <Check className="h-3.5 w-3.5" />}
        </span>
        {optimistic ? "Выполняю" : "Отметить, что выполняю"}
      </button>
    </div>
  );
}
