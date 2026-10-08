import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { LEVEL_COLOR, TRACKERS, type Level } from "@/lib/trackers";
import { SiteFooter, SiteHeader } from "@/components/Site";
import { Cloud, Sprout, Squiggle, TRACKER_ICON, Underline } from "@/components/Doodles";

const STEPS = [
  { n: "01", title: "Наблюдай", text: "Каждый день удели несколько минут себе." },
  { n: "02", title: "Отмечай", text: "Заполняй трекеры и фиксируй своё состояние." },
  { n: "03", title: "Замечай", text: "Через несколько дней и недель становятся видны закономерности." },
  { n: "04", title: "Меняй", text: "Используй наблюдения, чтобы постепенно менять привычки и отношение к себе." },
];

// Декоративная «страница трекера» для первого экрана
function HeroSheet() {
  const months = ["Сен", "Окт", "Ноя", "Дек"];
  const seq: (Level | 0)[] = [1, 1, 2, 1, 3, 2, 1, 1, 2, 4, 3, 2, 1, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1];
  return (
    <div className="relative mx-auto w-full max-w-sm rotate-[1.5deg] lg:max-w-md">
      <div className="paper absolute inset-0 translate-x-3 translate-y-3 -rotate-3 opacity-70" />
      <div className="paper relative p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="font-serif text-lg">Рейтинг дня</span>
          <span className="font-hand text-xl text-terracotta">осень</span>
        </div>
        <div className="grid grid-cols-[1.6rem_repeat(4,1fr)] gap-1.5 text-[0.7rem] text-ink-faint">
          <span />
          {months.map((m) => (
            <span key={m} className="text-center font-semibold">
              {m}
            </span>
          ))}
          {Array.from({ length: 12 }).map((_, row) => (
            <div key={row} className="contents">
              <span className="text-right leading-6">{row + 1}</span>
              {months.map((_, col) => {
                const i = row * 4 + col;
                const lvl = col === 3 && row > 4 ? 0 : seq[(i * 7) % seq.length];
                return (
                  <span
                    key={col}
                    className="h-6 rounded-md border border-line"
                    style={lvl ? { background: LEVEL_COLOR[lvl], borderColor: "transparent" } : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-ink-soft">
          {([1, 2, 3, 4] as Level[]).map((l) => (
            <span key={l} className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
              {["хорошо", "обычно", "непросто", "тяжело"][l - 1]}
            </span>
          ))}
        </div>
      </div>
      <span className="font-hand absolute -bottom-10 -left-4 -rotate-6 text-2xl text-terracotta">
        всего пара минут в день ↗
      </span>
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const startHref = user ? (user.role === "admin" ? "/admin" : "/app") : "/register";

  return (
    <>
      <SiteHeader authed={user?.role ?? null} />
      <main className="overflow-x-clip">
        {/* Первый экран */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 pt-12 pb-24 md:pt-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="eyebrow mb-4">личный дневник наблюдений</p>
            <h1 className="h-display text-[2.6rem] sm:text-6xl">
              Денис Шутов
              <span className="text-ink-faint"> | </span>
              <span className="italic text-terracotta">Психолог</span>
            </h1>
            <p className="relative mt-6 inline-block font-serif text-2xl italic leading-snug text-bordeaux sm:text-[1.7rem]">
              Наблюдать за собой — значит лучше себя понимать.
              <Underline className="absolute -bottom-3 left-0 h-3 w-2/3 text-mustard" />
            </p>
            <p className="mt-8 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
              Трекеры помогают замечать закономерности в своём состоянии, привычках, настроении и ежедневной жизни. Регулярные
              небольшие наблюдения помогают лучше понимать себя и постепенно выстраивать более гармоничный баланс между мыслями,
              эмоциями, привычками и действиями.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={startHref} className="btn btn-primary text-base">
                Начать вести трекеры
              </Link>
              <Link href="/pdf" className="btn btn-ghost text-base">
                Скачать трекеры
              </Link>
            </div>
          </div>
          <HeroSheet />
        </section>

        {/* Как это работает */}
        <section id="how" className="scroll-mt-20 border-y border-line/70 bg-paper/60">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">как это работает</p>
            <h2 className="h-display mt-2 text-4xl">Четыре простых шага</h2>
            <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <span className="font-hand text-6xl leading-none text-terracotta/80">{s.n}</span>
                  <h3 className="mt-3 font-serif text-2xl">{s.title}</h3>
                  <Squiggle className="mt-2 h-2 w-16 text-mustard" />
                  <p className="mt-3 leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Трекеры */}
        <section id="trackers" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">онлайн-трекеры</p>
              <h2 className="h-display mt-2 text-4xl">Шесть страниц вашего дневника</h2>
            </div>
            <p className="max-w-md text-ink-soft">
              Заполняются с телефона за 1–2 минуты. Всё сохраняется автоматически, а через неделю вы увидите первую статистику.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKERS.map((t) => {
              const Icon = TRACKER_ICON[t.key];
              return (
                <div key={t.key} className="paper group p-6 transition hover:-translate-y-0.5">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: t.accent + "33", color: t.accent }}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 font-serif text-xl">{t.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{t.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href={startHref} className="btn btn-primary">
              {user ? "Перейти в кабинет" : "Зарегистрироваться и начать"}
            </Link>
          </div>

          {/* PDF */}
          <div className="paper relative mt-16 overflow-hidden p-8 md:flex md:items-center md:justify-between md:p-10">
            <Cloud className="absolute -right-6 -top-6 h-36 w-36 text-mustard/30" />
            <div className="relative">
              <h3 className="h-display text-3xl">Предпочитаете бумагу?</h3>
              <p className="mt-3 max-w-lg text-ink-soft">
                Скачайте трекеры в PDF и ведите их от руки: рейтинг дня, тревожность, настроение, привычки, главное за день и
                благодарность себе.
              </p>
            </div>
            <Link href="/pdf" className="btn btn-soft relative mt-6 md:mt-0">
              Скачать PDF
            </Link>
          </div>
        </section>

        {/* Обо мне */}
        <section id="about" className="scroll-mt-20 border-y border-line/70 bg-paper/60">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[0.8fr_1.2fr]">
            <div className="relative mx-auto w-64 md:w-full md:max-w-xs">
              <div className="paper aspect-[4/5] -rotate-2 p-3">
                <div className="flex h-full items-center justify-center rounded-2xl bg-[#efe2cf]">
                  {/* Замените на фото: <Image src="/denis.jpg" … /> */}
                  <span className="font-serif text-6xl italic text-terracotta/70">ДШ</span>
                </div>
              </div>
              <Sprout className="absolute -right-6 -bottom-6 h-20 w-20 text-sage" />
            </div>
            <div>
              <p className="eyebrow">обо мне</p>
              <h2 className="h-display mt-2 text-4xl">Денис Шутов</h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                Я психолог. Помогаю людям лучше понимать себя, свои эмоции и привычки — и бережно менять то, что хочется изменить.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Трекеры — инструмент, который я использую в работе между сессиями: они помогают заметить то, что обычно
                ускользает, и принести на встречу не только ощущения, но и наблюдения.
              </p>
            </div>
          </div>
        </section>

        {/* Финал */}
        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <Sprout className="mx-auto h-14 w-14 text-sage" />
          <p className="mt-6 font-serif text-2xl leading-relaxed sm:text-[1.75rem]">
            Маленькие ежедневные действия со временем становятся частью нашей жизни. Наблюдая за собой, мы лучше понимаем себя —
            <span className="italic text-terracotta"> и можем постепенно менять то, что хотим изменить.</span>
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={SITE.instagram} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Мой Instagram
            </a>
            <a href={SITE.telegram} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Написать мне в Telegram
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
