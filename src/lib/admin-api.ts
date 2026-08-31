/**
 * Cliente tipado de los endpoints /admin/* del backend. Sólo servidor (Server
 * Components y Server Actions): el token nunca llega al browser.
 *
 * Convención: los tipos `*Wire` son lo que viaja en JSON (fechas como string);
 * los mappers `con*` convierten a Date en el borde y el resto de la app
 * trabaja siempre con Date.
 */
import { API_URL, ApiError, apiFetch, type Categoria, type EstadoNota, type Paginado } from "@/lib/api";
import type { Rol } from "@/lib/auth";

/* ── Tipos ───────────────────────────────────────────────────────────── */

export type Persona = { id: string; name: string };

/** Ficha completa de una imagen de la biblioteca (como la devuelve el backend en Article.featuredMedia). */
export type MediaRef = {
  id: string;
  url: string;
  thumbUrl: string | null;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
};

export type FuenteResumen = {
  sourceName: string;
  sourceUrl: string;
  originalTitle: string;
  originalImageUrl: string | null;
};

export type FuenteCompleta = FuenteResumen & {
  guid: string;
  feedUrl: string;
  originalContent: string;
};

/** Fila de la bandeja (GET /admin/articles). Sin cuerpo. */
export type NotaFila = {
  id: string;
  origin: "FEED" | "ORIGINAL";
  status: EstadoNota;
  kicker: string | null;
  title: string | null;
  summary: string | null;
  slug: string | null;
  imageUrl: string | null;
  /** miniatura de la biblioteca (fila de la bandeja) */
  featuredMedia: { id: string; url: string; thumbUrl: string | null; alt: string | null } | null;
  categoryId: string | null;
  categoryRef: Pick<Categoria, "id" | "name" | "slug" | "color"> | null;
  isBreaking: boolean;
  breakingUntil: Date | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  sourceSimilarity: number | null;
  reviewNote: string | null;
  createdBy: Persona | null;
  lastEditedBy: Persona | null;
  source: FuenteResumen | null;
};

/** Detalle (GET /admin/articles/:id): lo que abre el editor. */
export type NotaDetalle = Omit<NotaFila, "source" | "featuredMedia"> & {
  featuredMedia: MediaRef | null;
  featuredMediaId: string | null;
  content: string | null;
  contentJson: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  socialTitle: string | null;
  firstPublishedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: Persona | null;
  source: FuenteCompleta | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  // Sin email: el backend dejó de exponerlo en el detalle (lo ve cualquier
  // rol; los correos viven en /admin/users, sólo ADMIN).
  authors: { order: number; user: Persona }[];
  _count: { revisions: number };
};

export type Revision = {
  id: string;
  version: number;
  reason:
    | "AUTOSAVE"
    | "MANUAL"
    | "SUBMIT"
    | "PUBLISH"
    | "UNPUBLISH"
    | "CORRECTION"
    | "RESTORE";
  note: string | null;
  createdAt: Date;
  createdBy: Persona | null;
};

export type StatsAdmin = {
  ingested: number;
  draft: number;
  inReview: number;
  scheduled: number;
  published: number;
  spiked: number;
};

export type UsuarioAdmin = {
  id: string;
  email: string;
  name: string;
  role: Rol;
  isActive: boolean;
  createdAt: Date;
};

export type Feed = {
  id: string;
  url: string;
  enabled: boolean;
  categoryId: string | null;
  category: Categoria | null;
};

export type EventoAuditoria = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string | null;
  diff: unknown;
  createdAt: Date;
  user: (Persona & { email: string }) | null;
};

/** Datos editables de una nota (PATCH /admin/articles/:id). */
export type EdicionNota = Partial<{
  kicker: string;
  title: string;
  summary: string;
  contentJson: unknown;
  content: string;
  categoryId: string;
  tagNames: string[];
  authorIds: string[];
  imageUrl: string;
  featuredMediaId: string;
  seoTitle: string;
  seoDescription: string;
  socialTitle: string;
  isBreaking: boolean;
  breakingUntil: string | null;
  note: string;
  expectedUpdatedAt: string;
}>;

export type FiltrosBandeja = {
  status?: EstadoNota;
  origin?: "FEED" | "ORIGINAL";
  categoryId?: string;
  authorId?: string;
  q?: string;
  from?: string;
  to?: string;
  sort?: "updatedAt" | "publishedAt" | "fetchedAt" | "scheduledAt" | "title";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type Transicion =
  | "submit"
  | "return"
  | "publish"
  | "unschedule"
  | "unpublish"
  | "spike"
  | "restore";

/* ── Mappers de fechas ───────────────────────────────────────────────── */

type Wire<T, K extends keyof T> = Omit<T, K> & Record<K, string | null>;

const fecha = (v: string | null | undefined) => (v ? new Date(v) : null);

const FECHAS_FILA = [
  "breakingUntil",
  "scheduledAt",
  "publishedAt",
  "fetchedAt",
  "createdAt",
  "updatedAt",
] as const;

function conFechasFila<T extends Record<(typeof FECHAS_FILA)[number], unknown>>(a: T) {
  const out: Record<string, unknown> = { ...a };
  for (const k of FECHAS_FILA) out[k] = fecha(a[k] as string | null);
  return out;
}

const conFechasNota = (a: Wire<NotaFila, (typeof FECHAS_FILA)[number]>): NotaFila =>
  conFechasFila(a) as unknown as NotaFila;

const conFechasDetalle = (
  a: Wire<NotaDetalle, (typeof FECHAS_FILA)[number] | "firstPublishedAt" | "reviewedAt">,
): NotaDetalle =>
  ({
    ...conFechasFila(a),
    firstPublishedAt: fecha(a.firstPublishedAt),
    reviewedAt: fecha(a.reviewedAt),
  }) as unknown as NotaDetalle;

/* ── Notas ───────────────────────────────────────────────────────────── */

export async function statsAdmin(token: string) {
  return apiFetch<StatsAdmin>("/admin/articles/stats", { token });
}

export async function listarNotasAdmin(
  token: string,
  f: FiltrosBandeja = {},
): Promise<{ notas: NotaFila[]; total: number; totalPages: number; page: number }> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
  }
  const res = await apiFetch<Paginado<Wire<NotaFila, (typeof FECHAS_FILA)[number]>>>(
    `/admin/articles?${q.toString()}`,
    { token },
  );
  return {
    notas: res.data.map(conFechasNota),
    total: res.meta.total,
    totalPages: res.meta.totalPages,
    page: res.meta.page,
  };
}

export async function obtenerNotaAdmin(token: string, id: string): Promise<NotaDetalle> {
  const a = await apiFetch<Parameters<typeof conFechasDetalle>[0]>(
    `/admin/articles/${id}`,
    { token },
  );
  return conFechasDetalle(a);
}

export async function crearNota(
  token: string,
  data: { title: string; kicker?: string; summary?: string; categoryId?: string },
): Promise<NotaDetalle> {
  const a = await apiFetch<Parameters<typeof conFechasDetalle>[0]>("/admin/articles", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
  return conFechasDetalle(a);
}

export async function guardarNota(
  token: string,
  id: string,
  data: EdicionNota,
): Promise<NotaDetalle> {
  const a = await apiFetch<Parameters<typeof conFechasDetalle>[0]>(
    `/admin/articles/${id}`,
    { method: "PATCH", body: JSON.stringify(data), token },
  );
  return conFechasDetalle(a);
}

export async function transicionNota(
  token: string,
  id: string,
  accion: Transicion,
  body: Record<string, unknown> = {},
): Promise<NotaDetalle> {
  const a = await apiFetch<Parameters<typeof conFechasDetalle>[0]>(
    `/admin/articles/${id}/${accion}`,
    { method: "POST", body: JSON.stringify(body), token },
  );
  return conFechasDetalle(a);
}

export async function listarRevisiones(token: string, id: string, page = 1) {
  const res = await apiFetch<Paginado<Wire<Revision, "createdAt">>>(
    `/admin/articles/${id}/revisions?page=${page}&limit=20`,
    { token },
  );
  return {
    revisiones: res.data.map((r) => ({ ...r, createdAt: new Date(r.createdAt as string) })),
    total: res.meta.total,
  };
}

export async function obtenerRevision(token: string, id: string, rid: string) {
  return apiFetch<Revision & { snapshot: Record<string, unknown> }>(
    `/admin/articles/${id}/revisions/${rid}`,
    { token },
  );
}

export async function restaurarRevision(token: string, id: string, rid: string) {
  const a = await apiFetch<Parameters<typeof conFechasDetalle>[0]>(
    `/admin/articles/${id}/revisions/${rid}/restore`,
    { method: "POST", token },
  );
  return conFechasDetalle(a);
}

export async function crearTokenVistaPrevia(token: string, id: string) {
  return apiFetch<{ token: string; expiresIn: string }>(
    `/admin/articles/${id}/preview-token`,
    { method: "POST", token },
  );
}

/* ── Usuarios ────────────────────────────────────────────────────────── */

/** id + nombre de los usuarios activos (para firmas). Cualquier rol. */
export async function directorioUsuarios(token: string) {
  return apiFetch<Persona[]>("/admin/users/directory", { token });
}

export async function listarUsuarios(token: string): Promise<UsuarioAdmin[]> {
  const rows = await apiFetch<Wire<UsuarioAdmin, "createdAt">[]>("/admin/users", { token });
  return rows.map((u) => ({ ...u, createdAt: new Date(u.createdAt as string) }));
}

export async function crearUsuario(
  token: string,
  data: { email: string; name: string; password: string; role: Rol },
) {
  return apiFetch<UsuarioAdmin>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function actualizarUsuario(
  token: string,
  id: string,
  data: { name?: string; role?: Rol; isActive?: boolean },
) {
  return apiFetch<UsuarioAdmin>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function blanquearPassword(token: string, id: string, password: string) {
  return apiFetch<void>(`/admin/users/${id}/password`, {
    method: "POST",
    body: JSON.stringify({ password }),
    token,
  });
}

export async function cambiarPassword(
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  return apiFetch<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
    token,
  });
}

/**
 * Revoca los tokens del usuario en el backend. Borrar la cookie no alcanza:
 * un token robado seguiría valiendo hasta expirar; esto lo mata ya.
 */
export async function cerrarSesionBackend(token: string) {
  return apiFetch<void>("/auth/logout", { method: "POST", token });
}

/* ── Feeds y categorías ──────────────────────────────────────────────── */

export async function listarFeeds(token: string) {
  return apiFetch<Feed[]>("/admin/feeds", { token });
}

export async function crearFeed(
  token: string,
  data: { url: string; categoryId?: string | null; enabled?: boolean },
) {
  return apiFetch<Feed>("/admin/feeds", { method: "POST", body: JSON.stringify(data), token });
}

export async function actualizarFeed(
  token: string,
  id: string,
  data: { url?: string; categoryId?: string | null; enabled?: boolean },
) {
  return apiFetch<Feed>(`/admin/feeds/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function correrIngesta(token: string) {
  return apiFetch<{ feeds: number; nuevos: number; borradores: number; fallidos: number }>(
    "/admin/ingest/run",
    { method: "POST", token },
  );
}

export async function listarCategoriasAdmin(token: string) {
  return apiFetch<Categoria[]>("/admin/categories", { token });
}

export async function crearCategoria(
  token: string,
  data: { name: string; slug: string; color: string; order?: number; inNav?: boolean },
) {
  return apiFetch<Categoria>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function actualizarCategoria(
  token: string,
  id: string,
  data: { name?: string; color?: string; order?: number; inNav?: boolean },
) {
  return apiFetch<Categoria>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

/* ── Auditoría ───────────────────────────────────────────────────────── */

export async function listarAuditoria(
  token: string,
  f: { entity?: string; entityId?: string; userId?: string; page?: number } = {},
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) q.set(k, String(v));
  const res = await apiFetch<Paginado<Wire<EventoAuditoria, "createdAt">>>(
    `/admin/audit?${q.toString()}`,
    { token },
  );
  return {
    eventos: res.data.map((e) => ({ ...e, createdAt: new Date(e.createdAt as string) })),
    total: res.meta.total,
    totalPages: res.meta.totalPages,
    page: res.meta.page,
  };
}

/* ── Medios ──────────────────────────────────────────────────────────── */

export type Media = {
  id: string;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  focalX: number | null;
  focalY: number | null;
  uploadedBy: Persona | null;
  createdAt: Date;
};

const conFechaMedia = (m: Wire<Media, "createdAt">): Media => ({
  ...m,
  createdAt: new Date(m.createdAt as string),
});

export async function listarMedia(token: string, f: { q?: string; page?: number } = {}) {
  const q = new URLSearchParams();
  if (f.q) q.set("q", f.q);
  if (f.page) q.set("page", String(f.page));
  const res = await apiFetch<Paginado<Wire<Media, "createdAt">>>(`/admin/media?${q.toString()}`, { token });
  return {
    medios: res.data.map(conFechaMedia),
    total: res.meta.total,
    totalPages: res.meta.totalPages,
    page: res.meta.page,
  };
}

/**
 * Subida multipart. El FormData se reenvía tal cual al backend: sin fijar
 * Content-Type para que undici ponga el boundary correcto.
 */
export async function subirMedia(token: string, formData: FormData): Promise<Media> {
  const res = await fetch(`${API_URL}/admin/media`, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    let body: Record<string, unknown> | null = null;
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      /* sin cuerpo */
    }
    const raw = body?.message;
    const msg =
      (typeof raw === "string" && raw) || (Array.isArray(raw) && raw.join(". ")) || `API ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }
  return conFechaMedia((await res.json()) as Wire<Media, "createdAt">);
}

export async function actualizarMedia(
  token: string,
  id: string,
  data: { alt?: string; caption?: string; focalX?: number; focalY?: number },
): Promise<Media> {
  const m = await apiFetch<Wire<Media, "createdAt">>(`/admin/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
  return conFechaMedia(m);
}

/** Sólo EDITOR/ADMIN; el backend responde 409 si la imagen es destacada de alguna nota. */
export async function borrarMedia(token: string, id: string) {
  return apiFetch<void>(`/admin/media/${id}`, { method: "DELETE", token });
}

/* ── Portada ─────────────────────────────────────────────────────────── */

export type ZonaPortada = "PRINCIPAL" | "DESTACADAS" | "MAS_NOTICIAS";

export type SlotPortada = {
  position: number;
  pinned: boolean;
  article: {
    id: string;
    slug: string | null;
    kicker: string | null;
    title: string | null;
    summary: string | null;
    category: string | null;
    imageUrl: string | null;
    featuredMedia: { thumbUrl: string | null; url: string } | null;
    publishedAt: string | null;
    status: string;
    sourceName: string | null;
    authors: Persona[];
  };
};

export type BorradorPortada = {
  zonas: Record<ZonaPortada, SlotPortada[]>;
  cupos: Record<ZonaPortada, number>;
  ultimaVersion: { id: string; publishedAt: string; publishedBy: Persona | null } | null;
  cambiosSinPublicar: boolean;
};

export type VersionPortada = {
  id: string;
  publishedAt: string;
  publishedBy: Persona | null;
  snapshot: { zone: ZonaPortada; position: number; articleId: string }[];
};

export async function obtenerBorradorPortada(token: string) {
  return apiFetch<BorradorPortada>("/admin/home", { token });
}

export async function fijarZonaPortada(token: string, zone: ZonaPortada, articleIds: string[]) {
  return apiFetch<BorradorPortada>("/admin/home/slots", {
    method: "PUT",
    body: JSON.stringify({ zone, articleIds }),
    token,
  });
}

export async function publicarPortada(token: string) {
  return apiFetch<VersionPortada>("/admin/home/publish", { method: "POST", token });
}

export async function versionesPortada(token: string) {
  return apiFetch<VersionPortada[]>("/admin/home/versions", { token });
}

export async function republicarPortada(token: string, id: string) {
  return apiFetch<VersionPortada>(`/admin/home/versions/${id}/republish`, { method: "POST", token });
}
