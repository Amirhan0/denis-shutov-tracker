"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logoutIdle } from "@/app/actions/auth";

type Item = { href: string; label: string; icon: React.ReactNode };

const I = {
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" />,
  pen: <path d="M15 4l5 5-11 11H4v-5L15 4Z" />,
  chart: <path d="M5 20V10M12 20V4M19 20v-7" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3 2.2 3.5 5" />
    </>
  ),
  palette: <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8ZM7.5 11h.01M10 7h.01M15 7h.01" />,
};

export const CLIENT_NAV: Item[] = [
  { href: "/app", label: "Главная", icon: I.home },
  { href: "/app/today", label: "Заполнить", icon: I.pen },
  { href: "/app/stats", label: "Статистика", icon: I.chart },
  { href: "/app/settings", label: "Профиль", icon: I.user },
];

export const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Клиенты", icon: I.users },
  { href: "/admin/moods", label: "Настроения", icon: I.palette },
  { href: "/admin/settings", label: "Профиль", icon: I.user },
];

function isActive(path: string, href: string) {
  return href === "/app" || href === "/admin" ? path === href : path.startsWith(href);
}

export function BottomNav({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-safe backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <Link key={it.href} href={it.href} className={`flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-1 text-[0.68rem] font-semibold ${active ? "text-terracotta" : "text-ink-faint"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {it.icon}
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive(path, it.href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper hover:text-ink"}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

/** Автоматический выход при бездействии */
export function IdleLogout({ minutes }: { minutes: number }) {
  const last = useRef(0);
  useEffect(() => {
    last.current = Date.now();
    const bump = () => (last.current = Date.now());
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      if (Date.now() - last.current > minutes * 60_000) void logoutIdle();
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(id);
    };
  }, [minutes]);
  return null;
}
