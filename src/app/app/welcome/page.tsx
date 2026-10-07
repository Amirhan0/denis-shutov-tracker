import { requireClient } from "@/lib/auth";
import { WelcomeForm } from "@/components/WelcomeForm";
import { Sprout } from "@/components/Doodles";

export default async function WelcomePage() {
  const user = await requireClient();
  return (
    <div className="mx-auto max-w-lg">
      <div className="paper relative p-6 sm:p-8">
        <Sprout className="absolute -top-8 right-4 h-16 w-16 text-sage" />
        <p className="eyebrow">шаг 1 из 2 · {user.name}, добро пожаловать</p>
        <h1 className="h-display mt-2 text-3xl">Какие привычки вы хотите привить?</h1>
        <p className="mt-2 text-ink-soft">Выберите или впишите до пяти. Лучше начать с малого — двух-трёх достаточно.</p>
        <div className="mt-6">
          <WelcomeForm />
        </div>
      </div>
    </div>
  );
}
