import type { Status } from "@/lib/admin";

const TONES = {
  ok: "bg-[#e3ecd9] text-[#3f5a31]",
  warn: "bg-[#f8e1cf] text-[#9a4a22]",
  new: "bg-[#ece4f3] text-[#5b4a72]",
};

export function StatusBadge({ s }: { s: Status }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONES[s.tone]}`}>{s.label}</span>;
}
