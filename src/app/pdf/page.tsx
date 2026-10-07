import Link from "next/link";
import { MONTHS_SHORT } from "@/lib/dates";
import { DEFAULT_MOODS_PRINT, LEVELS, LEVEL_COLOR, SCALES, type ColorTracker } from "@/lib/trackers";
import { Logo } from "@/components/Site";
import { PrintButton } from "@/components/PrintButton";
import { Heart, Pen, Sprout, Star, Sun, Wave } from "@/components/Doodles";

export const metadata = { title: "PDF-трекеры — Денис Шутов" };

function Page({ title, icon, children, note }: { title: string; icon?: React.ReactNode; children: React.ReactNode; note?: string }) {
  return (
    <section className="print-page paper mx-auto mb-8 flex w-full max-w-[210mm] flex-col p-6 sm:p-10 print:mb-0 print:h-[273mm] print:max-w-none print:rounded-none print:p-0">
      <header className="mb-5 flex items-end justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          {icon && <span className="text-terracotta">{icon}</span>}
          <h2 className="font-serif text-2xl">{title}</h2>
        </div>
        <span className="font-hand text-lg text-ink-faint">Денис Шутов · психолог</span>
      </header>
      <div className="flex-1">{children}</div>
      {note && <p className="mt-3 text-[0.7rem] text-ink-faint">{note}</p>}
    </section>
  );
}

function Legend({ tracker }: { tracker: ColorTracker }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-ink-soft">
      {LEVELS.map((l) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: LEVEL_COLOR[l] }} />
          {SCALES[tracker].labels[l]}
        </span>
      ))}
    </div>
  );
}

function YearTable() {
  return (
    <table className="w-full table-fixed border-collapse text-[0.62rem]">
      <thead>
        <tr>
          <th className="w-6" />
          {MONTHS_SHORT.map((m) => (
            <th key={m} className="pb-1 font-semibold text-ink-soft">{m}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 31 }).map((_, d) => (
          <tr key={d}>
            <td className="pr-1 text-right text-ink-faint">{d + 1}</td>
            {MONTHS_SHORT.map((m, i) => {
              const exists = d < [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
              return <td key={m} className={`h-[6.3mm] border ${exists ? "border-[#d9cbb8]" : "border-transparent bg-[#f2ebe0]"}`} />;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HabitHalf({ from, to }: { from: number; to: number }) {
  const days = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <table className="w-full table-fixed border-collapse text-[0.65rem]">
      <thead>
        <tr>
          <th className="w-[34%] pb-1 text-left font-semibold text-ink-soft">Привычка</th>
          {days.map((d) => (
            <th key={d} className="pb-1 font-semibold text-ink-soft">{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, r) => (
          <tr key={r}>
            <td className="h-[11mm] border-b border-[#d9cbb8]" />
            {days.map((d) => (
              <td key={d} className="border border-[#d9cbb8]" />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Journal({ question, prompts }: { question: string; prompts: string }) {
  return (
    <div>
      <p className="mb-4 font-serif text-lg italic text-bordeaux">{question}</p>
      <p className="mb-4 text-xs text-ink-faint">{prompts}</p>
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 text-[0.7rem] font-semibold text-ink-soft">Дата: ____________</div>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-[8mm] border-b border-[#d9cbb8]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PdfPage() {
  const hasPdf = true; // public/trackers.pdf генерируется командой npm run pdf
  return (
    <div className="pb-16 print:pb-0">
      <div className="no-print sticky top-0 z-20 border-b border-line/70 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Logo />
          <div className="flex gap-2">
            {hasPdf && (
              <a href="/trackers.pdf" download="Трекеры — Денис Шутов.pdf" className="btn btn-primary btn-sm">
                Скачать PDF
              </a>
            )}
            <PrintButton className={`btn btn-sm ${hasPdf ? "btn-ghost" : "btn-primary"}`} />
          </div>
        </div>
      </div>

      <div className="no-print mx-auto max-w-[210mm] px-5 pt-10 pb-8">
        <p className="eyebrow">для тех, кто любит бумагу</p>
        <h1 className="h-display mt-2 text-4xl">PDF-трекеры</h1>
        <p className="mt-3 text-ink-soft">
          Скачайте пакет из шести трекеров, распечатайте на A4 и ведите от руки. Раскрашивайте клетки цветными карандашами или
          маркерами. {!hasPdf && "Нажмите «Распечатать» и выберите «Сохранить как PDF»."}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-terracotta hover:underline">← На главную</Link>
      </div>

      <div className="px-3 print:px-0">
        <Page title="Рейтинг дня" icon={<Star className="h-7 w-7" />} note="Каждый вечер закрасьте клетку дня цветом, который лучше всего описывает день.">
          <Legend tracker="rating" />
          <YearTable />
        </Page>

        <Page title="Тревожность" icon={<Wave className="h-7 w-7" />} note="Отмечайте уровень тревоги за день — без оценок, просто наблюдение.">
          <Legend tracker="anxiety" />
          <YearTable />
        </Page>

        <Page title="Настроение" icon={<Sun className="h-7 w-7" />}>
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.7rem] text-ink-soft sm:grid-cols-4">
            {LEVELS.map((l) => (
              <div key={l}>
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: LEVEL_COLOR[l] }} />
                  {SCALES.mood.labels[l]}
                </span>
                <div>{DEFAULT_MOODS_PRINT[l].join(", ")}</div>
              </div>
            ))}
          </div>
          <YearTable />
        </Page>

        <Page title="Полезные привычки" icon={<Sprout className="h-7 w-7" />} note="Впишите до пяти привычек. Ставьте ✓ или закрашивайте клетку в дни, когда получилось.">
          <div className="mb-4 text-sm text-ink-soft">Месяц: ______________________</div>
          <HabitHalf from={1} to={16} />
          <div className="h-8" />
          <HabitHalf from={17} to={31} />
        </Page>

        <Page title="Главное за день" icon={<Pen className="h-7 w-7" />}>
          <Journal question="Что главное я сделал(а) сегодня?" prompts="Сегодня я впервые… · Сегодня я сделал(а)… · Сегодня для меня было важно…" />
        </Page>

        <Page title="Благодарность себе" icon={<Heart className="h-7 w-7" />}>
          <Journal question="За что я благодарен(на) себе сегодня?" prompts="Именно себе — за усилия, заботу, смелость, отдых." />
        </Page>
      </div>
    </div>
  );
}
