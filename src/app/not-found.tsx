import Link from "next/link";
import { Cloud } from "@/components/Doodles";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Cloud className="h-20 w-20 text-terracotta/60" />
      <h1 className="h-display mt-4 text-4xl">Такой страницы нет</h1>
      <p className="mt-3 text-ink-soft">Возможно, она переехала. Давайте вернёмся на главную.</p>
      <Link href="/" className="btn btn-primary mt-8">На главную</Link>
    </main>
  );
}
