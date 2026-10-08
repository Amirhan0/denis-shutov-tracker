import "server-only";
import { addDays, diffDays, range } from "./dates";
import { getEntries, getFilledDates, getHabitChecks, getHabitsInRange, getMarks, getMoods, habitActiveOn } from "./data";
import { LEVELS, moodPicks, type Level, type Mark } from "./trackers";

// Статистика — описательная, не диагностическая.

export type LevelCounts = Record<Level, number>;

export type Stats = {
  from: string;
  to: string;
  days: number;
  rating: { counts: LevelCounts; filled: number; dominant: Level | null; text: string };
  anxiety: { counts: LevelCounts; filled: number; calm: number; elevated: number; dominant: Level | null; text: string; trend: string | null };
  mood: { counts: LevelCounts; filled: number; top: { label: string; count: number }[]; text: string };
  habits: { id: number; title: string; done: number; possible: number; pct: number; archived: boolean }[];
  habitsText: string;
  entries: { main: number; gratitude: number };
  filledDays: number;
  emptyDays: number;
};

const RATING_PHRASE: Record<Level, string> = {
  1: "чаще всего дни отмечались как хорошие",
  2: "чаще всего дни отмечались как обычные",
  3: "чаще всего дни отмечались как непростые",
  4: "чаще всего дни отмечались как тяжёлые",
};

const ANXIETY_PHRASE: Record<Level, string> = {
  1: "тревога чаще всего практически не отмечалась",
  2: "тревожность чаще отмечалась как лёгкая",
  3: "тревожность чаще отмечалась как заметная",
  4: "тревожность чаще отмечалась как сильная",
};

const MOOD_ZONE_PHRASE: Record<Level, string> = {
  1: "чаще отмечались настроения из зелёной зоны",
  2: "чаще отмечались настроения из жёлтой зоны",
  3: "чаще отмечались настроения из оранжевой зоны",
  4: "чаще отмечались настроения из красной зоны",
};

function countLevels(marks: Record<string, Mark>): LevelCounts {
  const c: LevelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const m of Object.values(marks)) c[m.level]++;
  return c;
}

/** Преобладающий уровень; null — если отметок нет или несколько уровней поровну */
function dominant(c: LevelCounts): Level | null {
  const max = Math.max(...LEVELS.map((l) => c[l]));
  const top = LEVELS.filter((l) => c[l] === max);
  return max > 0 && top.length === 1 ? top[0] : null;
}

const total = (c: LevelCounts) => LEVELS.reduce((s, l) => s + c[l], 0);

function avg(marks: Record<string, Mark>): number | null {
  const v = Object.values(marks);
  return v.length ? v.reduce((s, m) => s + m.level, 0) / v.length : null;
}

export async function computeStats(userId: number, from: string, to: string, periodWord = "За этот период"): Promise<Stats> {
  const days = diffDays(from, to) + 1;
  const lead = periodWord;

  // Рейтинг дня
  const ratingMarks = await getMarks(userId, "rating", from, to);
  const rc = countLevels(ratingMarks);
  const rDom = dominant(rc);
  const ratingText = rDom
    ? `${lead} ${RATING_PHRASE[rDom]}.`
    : total(rc)
      ? `${lead} дни оценивались по-разному — без одного преобладающего цвета.`
      : "Рейтинг дня пока не отмечался.";

  // Тревожность + сравнение с предыдущим периодом такой же длины
  const anxMarks = await getMarks(userId, "anxiety", from, to);
  const ac = countLevels(anxMarks);
  const aDom = dominant(ac);
  const prevMarks = await getMarks(userId, "anxiety", addDays(from, -days), addDays(from, -1));
  const nowAvg = avg(anxMarks);
  const prevAvg = avg(prevMarks);
  let trend: string | null = null;
  if (nowAvg !== null && prevAvg !== null) {
    const d = nowAvg - prevAvg;
    trend =
      Math.abs(d) < 0.3
        ? "По сравнению с предыдущим периодом уровень тревоги отмечался примерно так же."
        : d < 0
          ? "По сравнению с предыдущим периодом тревога отмечалась реже и мягче."
          : "По сравнению с предыдущим периодом тревога отмечалась чаще или сильнее.";
  }

  // Настроение
  const moodMarks = await getMarks(userId, "mood", from, to);
  // за день может быть несколько настроений — считаем каждое
  const mc: LevelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const moods = new Map((await getMoods(true)).map((m) => [m.id, m.label]));
  const freq = new Map<string, { count: number; zone: Level }>();
  for (const m of Object.values(moodMarks)) {
    for (const p of moodPicks(m)) {
      mc[p.level]++;
      const label = p.moodId ? moods.get(p.moodId) : p.note;
      if (label) freq.set(label, { count: (freq.get(label)?.count ?? 0) + 1, zone: p.level });
    }
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1].count - a[1].count);
  const top = sorted.slice(0, 3).map(([label, v]) => ({ label, count: v.count }));
  const mDom = dominant(mc);
  // самое частое настроение внутри преобладающей зоны — только если оно действительно повторялось
  const inZone = sorted.filter(([, v]) => v.zone === mDom);
  const favourite = inZone[0] && inZone[0][1].count > 1 && (inZone[1]?.[1].count ?? 0) < inZone[0][1].count ? inZone[0][0] : null;
  const moodText = mDom
    ? `${lead} ${MOOD_ZONE_PHRASE[mDom]}${favourite ? `, чаще всего — «${favourite.toLowerCase()}»` : ""}.`
    : total(mc)
      ? `${lead} настроение было разным — без одной преобладающей зоны.`
      : "Настроение пока не отмечалось.";

  // Привычки
  const habits = await getHabitsInRange(userId, from, to);
  const checks = await getHabitChecks(userId, from, to);
  const dates = range(from, to);
  const habitStats = habits.map((h) => {
    const possible = dates.filter((d) => habitActiveOn(h, d)).length;
    const done = (checks[h.id] ?? []).filter((d) => habitActiveOn(h, d)).length;
    return { id: h.id, title: h.title, done, possible, pct: possible ? Math.round((done / possible) * 100) : 0, archived: !!h.archived_at };
  });
  const ranked = habitStats.filter((h) => h.possible > 0).sort((a, b) => b.pct - a.pct);
  let habitsText = "Привычки пока не добавлены.";
  if (ranked.length === 1) habitsText = `Привычка «${ranked[0].title}» выполнялась в ${ranked[0].pct}% дней.`;
  else if (ranked.length > 1) {
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    habitsText =
      best.pct === worst.pct
        ? `Все привычки выполнялись примерно одинаково — около ${best.pct}% дней.`
        : `Самой стабильной была привычка «${best.title}» (${best.pct}%). Реже всего получалось «${worst.title}» (${worst.pct}%).`;
  }

  const entries = await getEntries(userId, null, from, to);
  const filled = await getFilledDates(userId, from, to);

  return {
    from,
    to,
    days,
    rating: { counts: rc, filled: Object.keys(ratingMarks).length, dominant: rDom, text: ratingText },
    anxiety: {
      counts: ac,
      filled: Object.keys(anxMarks).length,
      calm: ac[1],
      elevated: ac[3] + ac[4],
      dominant: aDom,
      text: aDom
        ? `${lead} ${ANXIETY_PHRASE[aDom]}.`
        : total(ac)
          ? `${lead} уровень тревоги менялся — без одного преобладающего.`
          : "Тревожность пока не отмечалась.",
      trend,
    },
    mood: { counts: mc, filled: Object.keys(moodMarks).length, top, text: moodText },
    habits: habitStats,
    habitsText,
    entries: {
      main: entries.filter((e) => e.kind === "main").length,
      gratitude: entries.filter((e) => e.kind === "gratitude").length,
    },
    filledDays: filled.size,
    emptyDays: days - filled.size,
  };
}
