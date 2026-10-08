// Выгрузка всех данных в JSON: npm run backup  (хранит последние 30 копий в ./backups)
// Turso дополнительно делает собственные резервные копии с восстановлением на момент времени.
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db.ts";

const TABLES = ["users", "moods", "habits", "habit_checks", "marks", "entries", "assignments"];
const dump: Record<string, unknown[]> = {};
for (const t of TABLES) dump[t] = await db.prepare(`SELECT * FROM ${t}`).all();

const dir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `app-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(file, JSON.stringify(dump));
const all = fs.readdirSync(dir).filter((f) => f.startsWith("app-")).sort();
for (const old of all.slice(0, Math.max(0, all.length - 30))) fs.unlinkSync(path.join(dir, old));
console.log("Резервная копия:", file);
