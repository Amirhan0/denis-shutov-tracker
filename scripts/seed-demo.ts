// Демо-данные для просмотра: npm run seed-demo
// Админ: admin@demo.ru / demo12345 · Клиенты: anna@demo.ru, maria@demo.ru, ivan@demo.ru / demo12345
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db.ts";
import { addDays, todayIn } from "../src/lib/dates.ts";

const hash = bcrypt.hashSync("demo12345", 10);
const today = todayIn("Europe/Moscow");
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

db.prepare(
  `INSERT INTO users (name, login, password_hash, role, onboarded, consent_at) VALUES ('Денис', 'admin@demo.ru', ?, 'admin', 1, datetime('now'))
   ON CONFLICT (login) DO NOTHING`,
).run(hash);

const moods = db.prepare("SELECT id, zone FROM moods").all() as { id: number; zone: number }[];
const MAIN = ["Сегодня я впервые сходил(а) на йогу", "Закончил(а) большой рабочий проект", "Позвонил(а) маме и долго разговаривали", "Сегодня для меня было важно выспаться", "Разобрал(а) завалы на столе"];
const GRAT = ["За то, что не стал(а) ругать себя за ошибку", "За то, что вовремя легла спать", "За то, что попросил(а) о помощи", "За прогулку, хотя было лень"];

const clients = [
  { name: "Анна", login: "anna@demo.ru", fill: 0.92, days: 60, lastAgo: 0 },
  { name: "Мария", login: "maria@demo.ru", fill: 0.76, days: 40, lastAgo: 1 },
  { name: "Иван", login: "ivan@demo.ru", fill: 0.4, days: 30, lastAgo: 5 },
];

for (const c of clients) {
  const existing = db.prepare("SELECT id FROM users WHERE login = ?").get(c.login) as { id: number } | undefined;
  if (existing) db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
  const start = addDays(today, -c.days);
  const uid = Number(
    db
      .prepare(
        `INSERT INTO users (name, login, password_hash, onboarded, consent_at, created_at, last_active_at)
         VALUES (?, ?, ?, 1, datetime('now'), datetime('now', ?), datetime('now', ?))`,
      )
      .run(c.name, c.login, hash, `-${c.days} days`, `-${c.lastAgo} days`).lastInsertRowid,
  );
  const habitIds = ["Выпить воду утром", "Зарядка", "Прогулка 30 минут", "Читать 20 минут"].map((t, i) =>
    Number(db.prepare("INSERT INTO habits (user_id, title, position, created_at) VALUES (?, ?, ?, ?)").run(uid, t, i, start).lastInsertRowid),
  );
  const mark = db.prepare("INSERT INTO marks (user_id, tracker, date, level, mood_id) VALUES (?, ?, ?, ?, ?)");
  const entry = db.prepare("INSERT INTO entries (user_id, kind, date, text) VALUES (?, ?, ?, ?)");
  const check = db.prepare("INSERT INTO habit_checks (habit_id, date) VALUES (?, ?)");
  for (let d = start; d <= addDays(today, -c.lastAgo); d = addDays(d, 1)) {
    if (rnd() > c.fill) continue;
    const base = 1 + Math.floor(rnd() * rnd() * 4);
    mark.run(uid, "rating", d, base, null);
    mark.run(uid, "anxiety", d, Math.min(4, Math.max(1, base + (rnd() > 0.6 ? 1 : 0))), null);
    const m = pick(moods.filter((x) => Math.abs(x.zone - base) <= 1));
    mark.run(uid, "mood", d, m.zone, m.id);
    habitIds.forEach((h) => rnd() < 0.65 && check.run(h, d));
    if (rnd() < 0.6) entry.run(uid, "main", d, pick(MAIN));
    if (rnd() < 0.5) entry.run(uid, "gratitude", d, pick(GRAT));
  }
  if (c.name === "Анна") {
    db.prepare("INSERT INTO assignments (user_id, text) VALUES (?, ?)").run(uid, "Домашнее задание на эту неделю: отмечать тревожность каждый вечер.");
  }
}
console.log("Демо-данные созданы. Админ: admin@demo.ru / demo12345");
