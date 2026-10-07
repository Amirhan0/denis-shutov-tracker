// Резервная копия базы: npm run backup  (хранит последние 30 копий в ./backups)
// Пример cron (каждую ночь в 3:00): 0 3 * * * cd /srv/tracker && npm run backup
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db.ts";

const dir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `app-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
await db.backup(file);
const all = fs.readdirSync(dir).filter((f) => f.startsWith("app-") && f.endsWith(".db")).sort();
for (const old of all.slice(0, Math.max(0, all.length - 30))) fs.unlinkSync(path.join(dir, old));
console.log("Резервная копия:", file);
