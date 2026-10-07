import { ResetForm } from "@/components/AuthForms";

export const metadata = { title: "Новый пароль — Денис Шутов" };

export default async function ResetPage({ params }: PageProps<"/reset/[token]">) {
  const { token } = await params;
  return (
    <>
      <h1 className="h-display text-3xl">Новый пароль</h1>
      <p className="mt-2 text-sm text-ink-soft">Придумайте пароль, который будет знать только вы.</p>
      <div className="mt-6">
        <ResetForm token={token} />
      </div>
    </>
  );
}
