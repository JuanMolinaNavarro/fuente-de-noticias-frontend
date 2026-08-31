"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { cerrarSesionBackend } from "@/lib/admin-api";
import { clearSession, getToken, setSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  let accessToken: string;
  try {
    const res = await apiFetch<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    accessToken = res.accessToken;
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 400)
    ) {
      redirect(`/admin/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    }
    throw error;
  }

  await setSession(accessToken);
  // Sólo rutas internas del panel: evita redirecciones abiertas
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  // Primero revocar en el backend (mata el token en el servidor: uno robado
  // deja de valer YA, no a las 12 h); después borrar la cookie. Si el backend
  // no responde, la cookie se borra igual: el logout local nunca se bloquea.
  const token = await getToken();
  if (token) {
    try {
      await cerrarSesionBackend(token);
    } catch {
      /* backend caído o token ya vencido: borrar la cookie alcanza */
    }
  }
  await clearSession();
  redirect("/admin/login");
}
