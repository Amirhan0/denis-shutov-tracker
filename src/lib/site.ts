// Контакты Дениса (можно переопределить переменными окружения NEXT_PUBLIC_*)
export const SITE = {
  name: "Денис Шутов",
  role: "Психолог",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/denis__shutov",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/DenisShutov",
  /** если пусто — email на сайте не показывается */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};
