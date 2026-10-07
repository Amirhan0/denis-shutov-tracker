import type { Metadata, Viewport } from "next";
import { Caveat, Lora, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "cyrillic"], style: ["normal", "italic"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Денис Шутов | Психолог",
  description: "Наблюдать за собой — значит лучше себя понимать. Онлайн-трекеры состояния, настроения и привычек.",
};

export const viewport: Viewport = {
  themeColor: "#f5eee2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Часовой пояс браузера нужен серверу, чтобы правильно понимать, какое «сегодня» у клиента
const tzScript = `try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(z&&document.cookie.indexOf('tz='+encodeURIComponent(z))<0)document.cookie='tz='+encodeURIComponent(z)+';path=/;max-age=31536000;samesite=lax'}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} ${lora.variable} ${caveat.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: tzScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
