"use client";

export function PrintButton({ className = "btn btn-ghost" }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={className}>
      Распечатать
    </button>
  );
}
