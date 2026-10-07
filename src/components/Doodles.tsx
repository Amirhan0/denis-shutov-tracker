// Небольшая «ручная графика» — линии и значки, как нарисованные ручкой в ежедневнике.

type P = { className?: string };

export function Squiggle({ className }: P) {
  return (
    <svg viewBox="0 0 200 14" fill="none" className={className} aria-hidden>
      <path
        d="M2 9c12-6 22-6 33 0s21 6 33 0 22-6 33 0 21 6 33 0 22-6 33 0 21 6 31 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Underline({ className }: P) {
  return (
    <svg viewBox="0 0 220 18" fill="none" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M3 12C50 5 120 3 217 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 15c50-4 110-5 160-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function Sprout({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path d="M32 58V30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 34c-2-10-10-16-21-15 1 11 9 17 21 15Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 28c1-11 9-18 21-18 0 12-8 19-21 18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Sun({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <circle cx="32" cy="32" r="11" stroke="currentColor" strokeWidth="2.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <path
            key={i}
            d={`M${32 + Math.cos(a) * 18} ${32 + Math.sin(a) * 18}L${32 + Math.cos(a) * 25} ${32 + Math.sin(a) * 25}`}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function Heart({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M32 53S9 40 9 24c0-7 5-12 12-12 5 0 9 3 11 7 2-4 6-7 11-7 7 0 12 5 12 12 0 16-23 29-23 29Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Star({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M32 8l6 16 17 1-13 11 4 17-14-9-14 9 4-17L9 25l17-1 6-16Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wave({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path d="M6 26c6-7 12-7 18 0s12 7 18 0 12-7 16-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 40c6-7 12-7 18 0s12 7 18 0 12-7 16-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Cloud({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M18 46h30a10 10 0 0 0 1-20 14 14 0 0 0-27-3A11 11 0 0 0 18 46Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pen({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path d="M44 10l10 10-28 28-13 3 3-13 28-28Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 16l10 10" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function Check({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const TRACKER_ICON = {
  rating: Star,
  anxiety: Wave,
  mood: Sun,
  habits: Sprout,
  main: Pen,
  gratitude: Heart,
} as const;
