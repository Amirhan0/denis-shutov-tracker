"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createResetToken, requireAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/url";

function clientExists(id: number) {
  return !!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'client'").get(id);
}

export async function createAssignment(fd: FormData) {
  await requireAdmin();
  const userId = Number(fd.get("userId"));
  const text = String(fd.get("text") ?? "").trim().slice(0, 2000);
  if (!text || !clientExists(userId)) return;
  db.prepare("INSERT INTO assignments (user_id, text) VALUES (?, ?)").run(userId, text);
  revalidatePath(`/admin/clients/${userId}`);
}

export async function archiveAssignment(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const row = db.prepare("SELECT user_id FROM assignments WHERE id = ?").get(id) as { user_id: number } | undefined;
  if (!row) return;
  db.prepare("UPDATE assignments SET archived = 1 WHERE id = ?").run(id);
  revalidatePath(`/admin/clients/${row.user_id}`);
}

export async function createResetLink(userId: number): Promise<string> {
  await requireAdmin();
  if (!clientExists(userId)) throw new Error("Клиент не найден");
  return `${await appUrl()}/reset/${createResetToken(userId, 72)}`;
}

export async function deleteClient(fd: FormData) {
  await requireAdmin();
  const userId = Number(fd.get("userId"));
  if (fd.get("confirm") !== "удалить") return;
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'client'").run(userId);
  redirect("/admin");
}

// ---------- Настроения ----------

export async function addMood(fd: FormData) {
  await requireAdmin();
  const label = String(fd.get("label") ?? "").trim().slice(0, 40);
  const zone = Number(fd.get("zone"));
  if (!label || ![1, 2, 3, 4].includes(zone)) return;
  const { p } = db.prepare("SELECT COALESCE(MAX(position), 0) + 1 AS p FROM moods WHERE zone = ?").get(zone) as { p: number };
  db.prepare("INSERT INTO moods (label, zone, position) VALUES (?, ?, ?)").run(label, zone, p);
  revalidatePath("/admin/moods");
}

export async function updateMood(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const label = String(fd.get("label") ?? "").trim().slice(0, 40);
  const zone = Number(fd.get("zone"));
  if (!label || ![1, 2, 3, 4].includes(zone)) return;
  db.transaction(() => {
    db.prepare("UPDATE moods SET label = ?, zone = ? WHERE id = ?").run(label, zone, id);
    db.prepare("UPDATE marks SET level = ? WHERE tracker = 'mood' AND mood_id = ?").run(zone, id);
  })();
  revalidatePath("/admin/moods");
}

export async function toggleMood(fd: FormData) {
  await requireAdmin();
  db.prepare("UPDATE moods SET active = 1 - active WHERE id = ?").run(Number(fd.get("id")));
  revalidatePath("/admin/moods");
}
