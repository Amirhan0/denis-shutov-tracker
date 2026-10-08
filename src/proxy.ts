import { NextResponse, type NextRequest } from "next/server";

const SESSION = "ds_session";
const REMEMBER = "ds_remember";
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

// Быстрая проверка: без cookie сессии в закрытые разделы не пускаем.
// Полная проверка сессии и роли — на сервере в layout каждого раздела.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const res = NextResponse.next();
  // «Запомнить меня»: продлеваем cookie при каждом визите, чтобы ежедневные пользователи не вводили пароль
  if (request.cookies.has(REMEMBER)) {
    const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: REMEMBER_MAX_AGE };
    res.cookies.set(SESSION, token, opts);
    res.cookies.set(REMEMBER, "1", opts);
  }
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
