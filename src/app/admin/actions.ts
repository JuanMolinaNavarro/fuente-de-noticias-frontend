"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { clearSession, setSession } from "@/lib/auth";

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
  await clearSession();
  redirect("/admin/login");
}
