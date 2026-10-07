// Создать или обновить аккаунт психолога:
//   npm run create-admin -- denis@mail.ru 'надёжный-пароль' 'Денис'
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db.ts";

const [login, password, name = "Денис"] = process.argv.slice(2);
if (!login || !password || password.length < 8) {
  console.error("Использование: npm run create-admin -- <email> <пароль от 8 символов> [имя]");
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
db.prepare(
  `INSERT INTO users (name, login, password_hash, role, onboarded, consent_at) VALUES (?, ?, ?, 'admin', 1, datetime('now'))
   ON CONFLICT (login) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin', name = excluded.name`,
).run(name, login.trim().toLowerCase(), hash);
console.log(`Готово: администратор ${login}`);
