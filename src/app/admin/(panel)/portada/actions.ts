"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { ApiError, TAGS } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  fijarZonaPortada,
  listarNotasAdmin,
  publicarPortada,
  republicarPortada,
  type BorradorPortada,
  type NotaFila,
  type VersionPortada,
  type ZonaPortada,
} from "@/lib/admin-api";

export type ResultadoPortada<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function fallo(error: unknown): ResultadoPortada<never> {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) redirect("/admin/login");
  return { ok: false, status: error.status, error: error.message };
}

/** Guarda el orden de UNA zona del borrador (no toca el sitio). */
export async function fijarZonaAction(zone: ZonaPortada, articleIds: string[]): Promise<ResultadoPortada<BorradorPortada>> {
  const { token } = await requireSession("ADMIN", "EDITOR");
  try {
    return { ok: true, data: await fijarZonaPortada(token, zone, articleIds) };
  } catch (error) {
    return fallo(error);
  }
}

/** Publica el borrador como versión: el sitio la ve en el acto (updateTag). */
export async function publicarPortadaAction(): Promise<ResultadoPortada<VersionPortada>> {
  const { token } = await requireSession("ADMIN", "EDITOR");
  try {
    const v = await publicarPortada(token);
    updateTag(TAGS.portada);
    return { ok: true, data: v };
  } catch (error) {
    return fallo(error);
  }
}

export async function republicarPortadaAction(id: string): Promise<ResultadoPortada<VersionPortada>> {
  const { token } = await requireSession("ADMIN", "EDITOR");
  try {
    const v = await republicarPortada(token, id);
    updateTag(TAGS.portada);
    return { ok: true, data: v };
  } catch (error) {
    return fallo(error);
  }
}

/** Candidatas para la portada: publicadas (y programadas), con búsqueda. */
export async function buscarPublicadasAction(q: string): Promise<ResultadoPortada<NotaFila[]>> {
  const { token } = await requireSession("ADMIN", "EDITOR");
  try {
    const r = await listarNotasAdmin(token, { status: "PUBLISHED", q: q || undefined, limit: 30 });
    return { ok: true, data: r.notas };
  } catch (error) {
    return fallo(error);
  }
}
