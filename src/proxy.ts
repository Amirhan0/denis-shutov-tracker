import { NextResponse, type NextRequest } from "next/server";

// Быстрая проверка: без cookie сессии в закрытые разделы не пускаем.
// Полная проверка сессии и роли — на сервере в layout каждого раздела.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("ds_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
