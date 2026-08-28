"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { actualizarMedia, listarMedia, subirMedia, type Media } from "@/lib/admin-api";
import type { EstadoForm } from "@/components/admin/FormAccion";

export type ResultadoMedia<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function fallo(error: unknown): ResultadoMedia<never> {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) redirect("/admin/login");
  return { ok: false, status: error.status, error: error.message };
}

/**
 * Sube UNA imagen. El FormData llega del browser (campo `file` + alt/caption)
 * y se reenvía al backend con el token: el browser nunca habla con
 * :4000 (BFF). El límite de tamaño lo chequean los dos extremos.
 */
export async function subirMediaAction(formData: FormData): Promise<ResultadoMedia<Media>> {
  const { token } = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, status: 400, error: "Elegí un archivo de imagen." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, status: 413, error: "La imagen supera los 8 MB." };
  }
  try {
    const media = await subirMedia(token, formData);
    revalidatePath("/admin/media");
    return { ok: true, data: media };
  } catch (error) {
    return fallo(error);
  }
}

export async function buscarMediaAction(q: string, page = 1): Promise<ResultadoMedia<Awaited<ReturnType<typeof listarMedia>>>> {
  const { token } = await requireSession();
  try {
    return { ok: true, data: await listarMedia(token, { q: q || undefined, page }) };
  } catch (error) {
    return fallo(error);
  }
}

export async function actualizarMediaAction(
  id: string,
  data: { alt?: string; caption?: string; focalX?: number; focalY?: number },
): Promise<ResultadoMedia<Media>> {
  const { token } = await requireSession();
  try {
    const m = await actualizarMedia(token, id, data);
    revalidatePath("/admin/media");
    return { ok: true, data: m };
  } catch (error) {
    return fallo(error);
  }
}

/** Variante para FormAccion (formularios de la página de biblioteca). */
export async function editarMediaFormAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const r = await actualizarMediaAction(String(fd.get("id")), {
    alt: String(fd.get("alt") ?? "").trim(),
    caption: String(fd.get("caption") ?? "").trim(),
  });
  return r.ok ? { ok: true, mensaje: "Guardado." } : { ok: false, error: r.error };
}
