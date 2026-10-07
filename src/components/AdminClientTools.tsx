"use client";

import { useState, useTransition } from "react";
import { createResetLink } from "@/app/actions/admin";

export function ResetLinkButton({ userId }: { userId: number }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        className="btn btn-soft btn-sm"
        disabled={pending}
        onClick={() => start(async () => setLink(await createResetLink(userId)))}
      >
        Ссылка для смены пароля
      </button>
      {link && (
        <div className="animate-fade mt-3 rounded-xl bg-cream p-3 text-xs">
          <p className="mb-2 text-ink-soft">Отправьте клиенту — ссылка действует 3 дня:</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="field py-2 text-xs" onFocus={(e) => e.target.select()} />
            <button
              className="btn btn-primary btn-sm shrink-0"
              onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}
            >
              {copied ? "✓" : "Копировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
