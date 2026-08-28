import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listarNotasAdmin, listarUsuarios, type FiltrosBandeja } from "@/lib/admin-api";
import { obtenerCategorias, type EstadoNota } from "@/lib/api";
import { ESTADOS } from "@/components/admin/ChipEstado";
import { FilaNotaBandeja, Paginacion } from "@/components/admin/Bandeja";
import { IcoLupa, IcoNueva } from "@/components/admin/Iconos";

export const dynamic = "force-dynamic";

const ESTADOS_ORDEN: EstadoNota[] = [
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "INGESTED",
  "SPIKED",
];

type SP = {
  status?: string;
  origin?: string;
  categoryId?: string;
  authorId?: string;
  q?: string;
  sort?: string;
  page?: string;
};

/**
 * Bandeja de notas. Los filtros son un <form method="get">: la URL es el
 * estado (se puede compartir, volver atrás, recargar) y no hace falta JS.
 */
export default async function Notas({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { token, user } = await requireSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const filtros: FiltrosBandeja = {
    status: ESTADOS_ORDEN.includes(sp.status as EstadoNota) ? (sp.status as EstadoNota) : undefined,
    origin: sp.origin === "FEED" || sp.origin === "ORIGINAL" ? sp.origin : undefined,
    categoryId: sp.categoryId || undefined,
    authorId: sp.authorId || undefined,
    q: sp.q || undefined,
    sort: (["updatedAt", "publishedAt", "fetchedAt", "title"] as const).find((s) => s === sp.sort),
    page,
    limit: 25,
  };

  const [{ notas, total, totalPages }, categorias, usuarios] = await Promise.all([
    listarNotasAdmin(token, filtros),
    obtenerCategorias(),
    // Sólo ADMIN puede listar usuarios (403 para el resto): el filtro por
    // autor aparece únicamente para ese rol.
    user.role === "ADMIN" ? listarUsuarios(token) : Promise.resolve(null),
  ]);

  const hrefDe = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") q.set(k, v);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return `/admin/notas${s ? `?${s}` : ""}`;
  };

  const inputCls =
    "rounded border border-azul/15 bg-white px-3 py-2 text-xs text-carbon outline-none focus:border-azul-medio";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">
            Redacción
          </p>
          <h1 className="font-display text-3xl tracking-tight text-carbon">Notas</h1>
          <div className="regla-marca mt-3 w-20" />
        </div>
        <Link
          href="/admin/notas/nueva"
          className="inline-flex items-center gap-2 rounded bg-azul-medio px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-azul"
        >
          <IcoNueva /> Nueva nota
        </Link>
      </div>

      {/* Pestañas por estado */}
      <nav className="mt-6 flex flex-wrap gap-1 border-b border-hielo" aria-label="Estado">
        {[undefined, ...ESTADOS_ORDEN].map((e) => {
          const activo = (filtros.status ?? undefined) === e;
          const q = new URLSearchParams();
          for (const [k, v] of Object.entries(sp)) if (v && k !== "page" && k !== "status") q.set(k, v);
          if (e) q.set("status", e);
          const s = q.toString();
          return (
            <Link
              key={e ?? "todas"}
              href={`/admin/notas${s ? `?${s}` : ""}`}
              className={`-mb-px border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] ${
                activo
                  ? "border-azul-medio text-azul"
                  : "border-transparent text-gris hover:text-azul-medio"
              }`}
            >
              {e ? ESTADOS[e].plural : "Todas"}
            </Link>
          );
        })}
      </nav>

      {/* Filtros */}
      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        {filtros.status && <input type="hidden" name="status" value={filtros.status} />}
        <label className="relative">
          <IcoLupa className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gris" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar en título, volanta, bajada…"
            className={`${inputCls} w-72 pl-8`}
          />
        </label>
        <select name="categoryId" defaultValue={sp.categoryId ?? ""} className={inputCls}>
          <option value="">Todas las secciones</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="origin" defaultValue={sp.origin ?? ""} className={inputCls}>
          <option value="">Feed y originales</option>
          <option value="ORIGINAL">Sólo originales</option>
          <option value="FEED">Sólo de feed</option>
        </select>
        {usuarios && (
          <select name="authorId" defaultValue={sp.authorId ?? ""} className={inputCls}>
            <option value="">Cualquier autor</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        <select name="sort" defaultValue={sp.sort ?? ""} className={inputCls}>
          <option value="">Orden por defecto</option>
          <option value="updatedAt">Última modificación</option>
          <option value="publishedAt">Fecha de publicación</option>
          <option value="fetchedAt">Fecha de ingreso</option>
          <option value="title">Título</option>
        </select>
        <button className="rounded border border-azul/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-azul hover:border-azul-medio">
          Filtrar
        </button>
        {(sp.q || sp.categoryId || sp.origin || sp.authorId || sp.sort) && (
          <Link
            href={filtros.status ? `/admin/notas?status=${filtros.status}` : "/admin/notas"}
            className="text-xs font-semibold text-gris hover:text-urgente"
          >
            Limpiar
          </Link>
        )}
        <span className="ml-auto text-xs text-gris">{total} nota{total === 1 ? "" : "s"}</span>
      </form>

      {notas.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-azul/15 bg-white px-5 py-10 text-center text-sm text-gris">
          No hay notas con estos filtros.
        </p>
      ) : (
        <ul className="mt-4 overflow-hidden border border-hielo bg-white">
          {notas.map((n) => (
            <FilaNotaBandeja key={n.id} nota={n} />
          ))}
        </ul>
      )}
      <Paginacion actual={page} totalPaginas={totalPages} hrefDe={hrefDe} />
    </div>
  );
}
