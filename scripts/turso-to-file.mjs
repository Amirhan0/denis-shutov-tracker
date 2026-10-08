// Перенос всех данных из Turso в локальный файл SQLite:
//   node --env-file=.env.local scripts/turso-to-file.mjs ./app.db
import { createClient } from "@libsql/client";
import fs from "node:fs";

const out = process.argv[2];
if (!out || !process.env.TURSO_DATABASE_URL) {
  console.error("Нужны TURSO_DATABASE_URL и путь к файлу: node --env-file=.env.local scripts/turso-to-file.mjs ./app.db");
  process.exit(1);
}
if (fs.existsSync(out)) fs.unlinkSync(out);

const src = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const dst = createClient({ url: "file:" + out });

const objects = await src.execute(
  "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY type = 'index'",
);
for (const o of objects.rows) await dst.execute(o.sql);

for (const t of objects.rows.filter((o) => o.type === "table")) {
  const rs = await src.execute(`SELECT * FROM "${t.name}"`);
  if (!rs.rows.length) continue;
  const cols = rs.columns.map((c) => `"${c}"`).join(", ");
  const qs = rs.columns.map(() => "?").join(", ");
  await dst.batch(
    rs.rows.map((r) => ({ sql: `INSERT INTO "${t.name}" (${cols}) VALUES (${qs})`, args: rs.columns.map((_, i) => r[i]) })),
    "write",
  );
  console.log(`${t.name}: ${rs.rows.length}`);
}
dst.close();
console.log("Готово:", out);
