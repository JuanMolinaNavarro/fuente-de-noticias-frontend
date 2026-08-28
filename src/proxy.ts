import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "fdn_token";

/**
 * Proxy (el antiguo middleware): corre antes de renderizar cualquier ruta
 * bajo /admin. Sólo mira si EXISTE la cookie de sesión y, si no, redirige al
 * login (rápido, sin llamar al backend). NO valida el token: eso lo hace el
 * layout del panel con /auth/me en cada render, y cada server action vuelve
 * a exigirlo. Los docs de Next son explícitos en que el proxy no debe ser la
 * única capa de auth — acá es sólo la primera puerta.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(COOKIE);

  if (pathname.startsWith("/admin/login")) {
    // Ya logueado → directo al panel
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
