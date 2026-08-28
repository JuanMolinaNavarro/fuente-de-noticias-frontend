import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * La sesión es un JWT emitido por el backend NestJS.
 * El browser solo ve esta cookie httpOnly; el token viaja del servidor de
 * Next a la API como header Authorization (patrón BFF).
 */
const COOKIE = "fdn_token";

export type Rol = "ADMIN" | "EDITOR" | "REDACTOR";

export type Usuario = {
  id: string;
  email: string;
  name: string;
  role: Rol;
};

export type Sesion = { token: string; user: Usuario };

export async function setSession(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // En producción la cookie sólo viaja por HTTPS; en dev (http://localhost)
    // `secure` la haría desaparecer.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 h, igual que la expiración del JWT
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

/**
 * Sesión validada contra el backend (firma, expiración, usuario activo, rol
 * fresco). Envuelta en React `cache()`: dentro de un mismo render (layout +
 * page + componentes) se consulta /auth/me UNA vez, no una por componente.
 * Devuelve null si no hay sesión o el token ya no sirve.
 */
export const getSession = cache(async (): Promise<Sesion | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    const user = await apiFetch<Usuario>("/auth/me", { token });
    return { token, user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error; // API caída ≠ sesión inválida: mejor error visible que login infinito
  }
});

/** Para páginas y actions: exige sesión (y opcionalmente ciertos roles). */
export async function requireSession(...roles: Rol[]): Promise<Sesion> {
  const sesion = await getSession();
  if (!sesion) redirect("/admin/login");
  if (roles.length && !roles.includes(sesion.user.role)) redirect("/admin?sin-permiso=1");
  return sesion;
}

export function esEditor(role: Rol) {
  return role === "ADMIN" || role === "EDITOR";
}
