import Link from "next/link";
import { SITE } from "@/lib/site";
import { Squiggle } from "./Doodles";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="font-serif text-[1.15rem] font-medium tracking-tight text-ink">Денис Шутов</span>
      {!compact && <span className="font-hand text-xl text-terracotta">психолог</span>}
    </Link>
  );
}

export function SiteHeader({ authed }: { authed?: "client" | "admin" | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-medium">
          <a href="/#how" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink md:block">
            Как это работает
          </a>
          <a href="/#trackers" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink md:block">
            Трекеры
          </a>
          <a href="/#about" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink md:block">
            Обо мне
          </a>
          {authed ? (
            <Link href={authed === "admin" ? "/admin" : "/app"} className="btn btn-primary btn-sm ml-2">
              Кабинет
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm ml-2">
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <Squiggle className="mt-2 h-2.5 w-24 text-terracotta/50" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="hover:text-ink">
            Instagram
          </a>
          <a href={SITE.telegram} target="_blank" rel="noreferrer" className="hover:text-ink">
            Telegram
          </a>
          {SITE.email && (
            <a href={`mailto:${SITE.email}`} className="hover:text-ink">
              {SITE.email}
            </a>
          )}
          <Link href="/privacy" className="hover:text-ink">
            Политика конфиденциальности
          </Link>
        </div>
        <p className="text-ink-faint">© {new Date().getFullYear()} Денис Шутов</p>
      </div>
    </footer>
  );
}
