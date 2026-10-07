// Все даты в приложении — строки вида YYYY-MM-DD в часовом поясе пользователя.

export const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
export const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
export const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

export const DEFAULT_TZ = "Europe/Moscow";

export function todayIn(tz: string = DEFAULT_TZ): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TZ }).format(new Date());
  }
}

export function hourIn(tz: string = DEFAULT_TZ): number {
  try {
    return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  } catch {
    return new Date().getHours();
  }
}

export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

export function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function addDays(iso: string, n: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/** 0 = понедельник … 6 = воскресенье */
export function weekdayIndex(iso: string): number {
  return (new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

/** «6 октября» */
export function formatDay(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS_GEN[m]}`;
}

/** «6 октября, понедельник» */
export function formatDayLong(iso: string): string {
  return `${formatDay(iso)}, ${WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()]}`;
}

/** «29 сен — 5 окт» */
export function formatRange(from: string, to: string): string {
  const a = parts(from);
  const b = parts(to);
  if (from === to) return formatDay(from);
  if (a.m === b.m) return `${a.d}–${b.d} ${MONTHS_GEN[b.m]}`;
  return `${formatDay(from)} — ${formatDay(to)}`;
}

export function relativeDay(iso: string | null, today: string): string {
  if (!iso) return "ещё не заходил(а)";
  const n = diffDays(iso, today);
  if (n <= 0) return "сегодня";
  if (n === 1) return "вчера";
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "день" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "дня" : "дней";
  return `${n} ${word} назад`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
