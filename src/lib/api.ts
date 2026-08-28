/**
 * Cliente de la API NestJS. Solo se usa del lado servidor (Server Components
 * y Server Actions): API_URL es una variable privada, sin NEXT_PUBLIC, así
 * el browser nunca habla directo con el backend (patrón BFF).
 *
 * Los endpoints admin viven en lib/admin-api.ts.
 */
import type { NotaResumen } from "@/components/TarjetaNota";
import { API_URL } from "@/lib/env";

// Se reexporta para no romper los imports existentes.
export { API_URL };

/**
 * Tags de la caché de datos del sitio público. Las server actions del panel
 * llaman updateTag(...) al publicar/despublicar/corregir, así el lector (y el
 * propio editor al volver al sitio) ve el cambio en el acto, sin esperar el
 * revalidate por tiempo.
 */
export const TAGS = {
  notas: "notas", // portada, secciones, relacionadas
  nota: (slug: string) => `nota:${slug}`,
  portada: "portada", // la curación de la home
  categorias: "categorias",
} as const;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** cuerpo JSON de la respuesta de error (message, missing, issues...) */
    public readonly body: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    // Sin opciones de caché explícitas (`next`), no se cachea: los datos del
    // panel siempre son frescos. Las lecturas públicas pasan `next.tags`.
    ...(rest.next ? {} : { cache: "no-store" as const }),
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    let body: Record<string, unknown> | null = null;
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      /* sin cuerpo */
    }
    const rawMsg = body?.message;
    const msg =
      (typeof rawMsg === "string" && rawMsg) ||
      (Array.isArray(rawMsg) && rawMsg.join(". ")) ||
      `API ${res.status} en ${path}`;
    throw new ApiError(res.status, msg, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ── Tipos de la API (JSON serializa las fechas como string) ─────────── */

export type Paginado<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

type NotaPublicaWire = Omit<NotaResumen, "publishedAt"> & {
  publishedAt: string | null;
};

export type NotaDetalle = NotaResumen & {
  content: string | null;
  contentJson: unknown;
  sourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  socialTitle: string | null;
};

export type EstadoNota =
  | "INGESTED"
  | "DRAFT"
  | "IN_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "SPIKED";

export type Categoria = {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  inNav: boolean;
};

const conFecha = <T extends { publishedAt: string | null }>(n: T) => ({
  ...n,
  publishedAt: n.publishedAt ? new Date(n.publishedAt) : null,
});

/* ── Endpoints públicos ──────────────────────────────────────────────── */

export async function listarNotas(params: {
  category?: string;
  limit?: number;
  page?: number;
}): Promise<{ notas: NotaResumen[]; total: number }> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.page) q.set("page", String(params.page));
  const res = await apiFetch<Paginado<NotaPublicaWire>>(
    `/articles?${q.toString()}`,
    { next: { revalidate: 60, tags: [TAGS.notas] } },
  );
  return { notas: res.data.map(conFecha), total: res.meta.total };
}

export async function obtenerNota(slug: string): Promise<NotaDetalle | null> {
  try {
    const nota = await apiFetch<
      Omit<NotaDetalle, "publishedAt"> & { publishedAt: string | null }
    >(`/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300, tags: [TAGS.nota(slug), TAGS.notas] },
    });
    return conFecha(nota);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Vista previa de una nota no publicada (token efímero emitido por el panel). Nunca se cachea. */
export async function obtenerVistaPrevia(token: string): Promise<NotaDetalle | null> {
  try {
    const nota = await apiFetch<
      Omit<NotaDetalle, "publishedAt"> & { publishedAt: string | null }
    >(`/articles/preview/${encodeURIComponent(token)}`);
    return conFecha(nota);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function notasRelacionadas(slug: string): Promise<NotaResumen[]> {
  const notas = await apiFetch<NotaPublicaWire[]>(
    `/articles/${encodeURIComponent(slug)}/related`,
    { next: { revalidate: 300, tags: [TAGS.notas] } },
  );
  return notas.map(conFecha);
}

/** Catálogo de categorías, cacheado 5 min (cambia poco). */
export async function obtenerCategorias(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>("/categories", {
    next: { revalidate: 300, tags: [TAGS.categorias] },
  });
}

/* ── Portada ─────────────────────────────────────────────────────────── */

export type Portada = {
  principal: NotaResumen | null;
  destacadas: NotaResumen[];
  mas: NotaResumen[];
  breaking: NotaResumen[];
  curadaAt: Date | null;
};

/** La home completa en una llamada: curada por la redacción + relleno cronológico + última hora. */
export async function obtenerPortada(): Promise<Portada> {
  type Wire = {
    principal: NotaPublicaWire | null;
    destacadas: NotaPublicaWire[];
    mas: NotaPublicaWire[];
    breaking: NotaPublicaWire[];
    curadaAt: string | null;
  };
  const p = await apiFetch<Wire>("/home", {
    next: { revalidate: 60, tags: [TAGS.notas, TAGS.portada] },
  });
  return {
    principal: p.principal ? conFecha(p.principal) : null,
    destacadas: p.destacadas.map(conFecha),
    mas: p.mas.map(conFecha),
    breaking: p.breaking.map(conFecha),
    curadaAt: p.curadaAt ? new Date(p.curadaAt) : null,
  };
}

/**
 * Portada + relleno: suma al resultado de /home las últimas publicadas que no
 * están ya en la curación (`extra`), para los módulos adicionales de la tapa
 * sin publicidad. /home está topeado en 19 notas del lado backend.
 */
export async function obtenerPortadaAmpliada(): Promise<
  Portada & { extra: NotaResumen[] }
> {
  const [portada, listado] = await Promise.all([
    obtenerPortada(),
    listarNotas({ limit: 50 }),
  ]);
  const enPortada = new Set(
    [portada.principal, ...portada.destacadas, ...portada.mas]
      .filter((n): n is NotaResumen => n !== null)
      .map((n) => n.id),
  );
  return {
    ...portada,
    extra: listado.notas.filter((n) => !enPortada.has(n.id)),
  };
}
