"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { ApiError, TAGS } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  crearNota,
  crearTokenVistaPrevia,
  fijarZonaPortada,
  guardarNota,
  obtenerRevision,
  publicarPortada,
  restaurarRevision,
  transicionNota,
  type EdicionNota,
  type NotaDetalle,
  type Transicion,
} from "@/lib/admin-api";

/**
 * Resultado uniforme de las actions del editor. El cliente nunca ve un throw:
 * los errores esperables (403, 409, 422, 400) vuelven como datos para que la
 * UI los muestre en su lugar; sólo lo inesperado (API caída) explota al
 * error boundary.
 */
export type Resultado<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; missing?: string[] };

const NOMBRES: Record<string, string> = {
  title: "título",
  content: "cuerpo",
  categoryId: "sección",
  note: "nota",
};

function fallo(error: unknown): Resultado<never> {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) redirect("/admin/login");
  const missing = Array.isArray(error.body?.missing)
    ? (error.body?.missing as string[])
    : undefined;
  const issues = Array.isArray(error.body?.issues)
    ? (error.body?.issues as { path: string; message: string }[])
    : undefined;
  const mensaje = missing
    ? `Falta completar: ${missing.map((m) => NOMBRES[m] ?? m).join(", ")}.`
    : issues?.length
      ? `${error.message}: ${issues.slice(0, 3).map((i) => `${i.path} — ${i.message}`).join("; ")}`
      : error.message;
  return { ok: false, status: error.status, error: mensaje, missing };
}

/** El sitio público sólo cambia cuando cambia algo visible. */
function invalidarPublico(nota: NotaDetalle) {
  updateTag(TAGS.notas);
  if (nota.slug) updateTag(TAGS.nota(nota.slug));
}

/* ── Crear ───────────────────────────────────────────────────────────── */

export type EstadoCrear = { error?: string; fieldErrors?: Record<string, string> };

export async function crearNotaAction(
  _prev: EstadoCrear,
  formData: FormData,
): Promise<EstadoCrear> {
  const { token } = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { fieldErrors: { title: "El título es obligatorio" } };
  let id: string;
  try {
    const nota = await crearNota(token, {
      title,
      kicker: String(formData.get("kicker") ?? "").trim() || undefined,
      summary: String(formData.get("summary") ?? "").trim() || undefined,
      categoryId: String(formData.get("categoryId") ?? "") || undefined,
    });
    id = nota.id;
  } catch (error) {
    const r = fallo(error);
    return { error: r.ok ? undefined : r.error };
  }
  redirect(`/admin/notas/${id}`);
}

/* ── Editar ──────────────────────────────────────────────────────────── */

export async function guardarNotaAction(
  id: string,
  cambios: EdicionNota,
): Promise<Resultado<NotaDetalle>> {
  const { token } = await requireSession();
  try {
    const nota = await guardarNota(token, id, cambios);
    // Una corrección sobre una nota publicada es visible para el lector
    if (nota.status === "PUBLISHED") invalidarPublico(nota);
    return { ok: true, data: nota };
  } catch (error) {
    return fallo(error);
  }
}

export async function transicionAction(
  id: string,
  accion: Transicion,
  body: Record<string, unknown> = {},
): Promise<Resultado<NotaDetalle>> {
  const { token } = await requireSession();
  try {
    const nota = await transicionNota(token, id, accion, body);
    if (["publish", "unpublish", "unschedule"].includes(accion)) invalidarPublico(nota);
    return { ok: true, data: nota };
  } catch (error) {
    return fallo(error);
  }
}

/** Atajo del editor: pone la nota como principal del borrador de portada y
 *  publica la portada en el acto. Pisa la nota principal actual; el backend
 *  valida que la nota esté PUBLISHED o SCHEDULED. */
export async function ponerComoPrincipalAction(id: string): Promise<Resultado<undefined>> {
  const { token } = await requireSession("ADMIN", "EDITOR");
  try {
    await fijarZonaPortada(token, "PRINCIPAL", [id]);
    await publicarPortada(token);
    updateTag(TAGS.portada);
    return { ok: true, data: undefined };
  } catch (error) {
    return fallo(error);
  }
}

export async function crearVistaPreviaAction(id: string): Promise<Resultado<{ url: string }>> {
  const { token } = await requireSession();
  try {
    const { token: t } = await crearTokenVistaPrevia(token, id);
    return { ok: true, data: { url: `/vista-previa/${t}` } };
  } catch (error) {
    return fallo(error);
  }
}

export async function obtenerRevisionAction(id: string, rid: string) {
  const { token } = await requireSession();
  try {
    const rev = await obtenerRevision(token, id, rid);
    return { ok: true as const, data: rev };
  } catch (error) {
    return fallo(error);
  }
}

export async function restaurarRevisionAction(
  id: string,
  rid: string,
): Promise<Resultado<NotaDetalle>> {
  const { token } = await requireSession();
  try {
    const nota = await restaurarRevision(token, id, rid);
    if (nota.status === "PUBLISHED") invalidarPublico(nota);
    return { ok: true, data: nota };
  } catch (error) {
    return fallo(error);
  }
}
