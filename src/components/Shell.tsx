import { IDLE_MINUTES } from "@/lib/auth";
import { ADMIN_NAV, BottomNav, CLIENT_NAV, IdleLogout, TopNav } from "./AppNav";
import { Logo } from "./Site";

export function Shell({ admin = false, children }: { admin?: boolean; children: React.ReactNode }) {
  const items = admin ? ADMIN_NAV : CLIENT_NAV;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 md:h-16">
          <Logo href={admin ? "/admin" : "/app"} compact={false} />
          <TopNav items={items} />
          {admin && <span className="rounded-full bg-bordeaux/10 px-3 py-1 text-xs font-semibold text-bordeaux md:hidden">админ</span>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-5 md:pb-16">{children}</main>
      <BottomNav items={items} />
      <IdleLogout minutes={IDLE_MINUTES} />
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="h-display mt-1 text-[2rem] sm:text-4xl">{title}</h1>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
    </div>
  );
}
