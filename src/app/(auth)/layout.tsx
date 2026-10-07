import { Logo } from "@/components/Site";
import { Sprout } from "@/components/Doodles";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">
        <div className="relative w-full max-w-md">
          <Sprout className="absolute -top-10 -right-2 h-16 w-16 rotate-12 text-sage/70" />
          <div className="paper relative p-7 sm:p-9">{children}</div>
        </div>
      </main>
    </div>
  );
}
