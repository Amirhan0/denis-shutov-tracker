// Общие описания трекеров — используются и на сервере, и в клиентских компонентах.

export type Level = 1 | 2 | 3 | 4;
export type ColorTracker = "rating" | "anxiety" | "mood";
export type EntryKind = "main" | "gratitude";
export type TrackerKey = ColorTracker | "habits" | EntryKind;

export const LEVELS: Level[] = [1, 2, 3, 4];

export const LEVEL_COLOR: Record<Level, string> = {
  1: "#9BB685",
  2: "#EDC967",
  3: "#E69A5B",
  4: "#C95D51",
};

export const LEVEL_NAME: Record<Level, string> = {
  1: "Зелёный",
  2: "Жёлтый",
  3: "Оранжевый",
  4: "Красный",
};

export const SCALES: Record<ColorTracker, { question: string; labels: Record<Level, string> }> = {
  rating: {
    question: "Каким был этот день?",
    labels: { 1: "Хороший день", 2: "Обычный день", 3: "Непростой день", 4: "Тяжёлый день" },
  },
  anxiety: {
    question: "Сколько было тревоги?",
    labels: {
      1: "Тревога практически отсутствует",
      2: "Лёгкая тревога",
      3: "Заметная тревога",
      4: "Сильная тревога",
    },
  },
  mood: {
    question: "Какое настроение было?",
    labels: { 1: "Зелёная зона", 2: "Жёлтая зона", 3: "Оранжевая зона", 4: "Красная зона" },
  },
};

export const TRACKERS: {
  key: TrackerKey;
  href: string;
  title: string;
  short: string;
  description: string;
  accent: string;
}[] = [
  {
    key: "rating",
    href: "/app/rating",
    title: "Рейтинг дня",
    short: "Рейтинг",
    description: "Оцените день одним цветом — от зелёного до красного.",
    accent: LEVEL_COLOR[1],
  },
  {
    key: "anxiety",
    href: "/app/anxiety",
    title: "Тревожность",
    short: "Тревога",
    description: "Замечайте, сколько тревоги было в течение дня.",
    accent: LEVEL_COLOR[3],
  },
  {
    key: "mood",
    href: "/app/mood",
    title: "Настроение",
    short: "Настроение",
    description: "Отмечайте не только силу, но и оттенок настроения.",
    accent: LEVEL_COLOR[2],
  },
  {
    key: "habits",
    href: "/app/habits",
    title: "Полезные привычки",
    short: "Привычки",
    description: "До пяти привычек, которые вы хотите сделать своими.",
    accent: "#7F9B6E",
  },
  {
    key: "main",
    href: "/app/main",
    title: "Главное за день",
    short: "Главное",
    description: "Что важного произошло сегодня — пара строк для себя.",
    accent: "#C2673F",
  },
  {
    key: "gratitude",
    href: "/app/gratitude",
    title: "Благодарность себе",
    short: "Благодарность",
    description: "За что вы можете поблагодарить себя сегодня.",
    accent: "#8C3A3E",
  },
];

export const ENTRY_META: Record<EntryKind, { title: string; question: string; prompts: string[] }> = {
  main: {
    title: "Главное за день",
    question: "Что главное я сделал(а) сегодня?",
    prompts: ["Сегодня я впервые…", "Сегодня я сделал(а)…", "Сегодня для меня было важно…"],
  },
  gratitude: {
    title: "Благодарность себе",
    question: "За что я благодарен(на) себе сегодня?",
    prompts: ["Я благодарю себя за то, что…", "Сегодня я позаботился(ась) о себе, когда…", "Я горжусь тем, что…"],
  },
};

export const MAX_HABITS = 5;

export type Mood = { id: number; label: string; zone: Level; active: number; position: number };

/** Одно выбранное настроение (готовое из списка или своё — «Другое») */
export type MoodPick = { moodId?: number | null; note?: string | null; level: Level };

/** Отметка дня. Для настроения за день может быть несколько вариантов — `picks` в порядке выбора */
export type Mark = { level: Level; moodId?: number | null; note?: string | null; picks?: MoodPick[] };

export const MAX_MOOD_PICKS = 5;

export function moodPicks(m: Mark | undefined): MoodPick[] {
  if (!m) return [];
  return m.picks?.length ? m.picks : [{ moodId: m.moodId, note: m.note, level: m.level }];
}

export function markFromPicks(picks: MoodPick[]): Mark | null {
  if (!picks.length) return null;
  return { level: Math.max(...picks.map((p) => p.level)) as Level, moodId: picks[0].moodId ?? null, note: picks[0].note ?? null, picks };
}

/** Фон клетки: один цвет или диагональные полосы, если за день отмечены разные зоны */
export function markBackground(m: Mark): string {
  const levels = [...new Set(moodPicks(m).map((p) => p.level))];
  if (levels.length <= 1) return LEVEL_COLOR[m.level];
  const step = 100 / levels.length;
  return `linear-gradient(135deg, ${levels.map((l, i) => `${LEVEL_COLOR[l]} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
}

/** Подписи зон настроения для печатной версии */
export const DEFAULT_MOODS_PRINT: Record<Level, string[]> = {
  1: ["Радость", "Спокойствие", "Удовлетворение", "Вдохновение"],
  2: ["Нейтральность", "Усталость", "Грусть"],
  3: ["Раздражение", "Тревога", "Обида"],
  4: ["Злость", "Сильная тревога", "Отчаяние"],
};
