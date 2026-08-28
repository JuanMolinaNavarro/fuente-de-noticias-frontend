import Link from "next/link";
import type { NotaFila } from "@/lib/admin-api";
import { fechaCorta } from "@/lib/fechas";
import { colorCategoria } from "@/lib/categorias";
import { ChipEstado } from "./ChipEstado";
import { IcoAlerta, IcoReloj } from "./Iconos";

/** Quién firma / de dónde vino, en una línea. */
export function origenNota(n: NotaFila): string {
  if (n.origin === "FEED") return n.source?.sourceName ?? "Feed";
  return n.createdBy?.name ?? "Redacción";
}

/** Fila de la bandeja: una nota, con estado, sección, origen y fecha relevante. */
export function FilaNotaBandeja({ nota: n }: { nota: NotaFila }) {
  const fecha =
    n.status === "PUBLISHED"
      ? n.publishedAt
      : n.status === "SCHEDULED"
        ? n.scheduledAt
        : n.updatedAt;
  const similitudAlta = n.origin === "FEED" && (n.sourceSimilarity ?? 0) > 0.25;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hielo px-4 py-3 last:border-b-0 hover:bg-hielo/40">
      <span
        className="h-9 w-1 shrink-0 rounded-full"
        style={{
          backgroundColor:
            n.categoryRef?.color ?? colorCategoria(n.categoryRef?.name),
        }}
        title={n.categoryRef?.name ?? "Sin sección"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {n.kicker && (
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-azul-medio">
              {n.kicker}
            </span>
          )}
        </div>
        <Link
          href={`/admin/notas/${n.id}`}
          className="block truncate font-display text-base leading-snug text-carbon hover:text-azul-medio"
        >
          {n.title ?? n.source?.originalTitle ?? "(sin título)"}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gris">
          <span>{n.categoryRef?.name ?? "Sin sección"}</span>
          <span>·</span>
          <span>{origenNota(n)}</span>
          {similitudAlta && (
            <span className="inline-flex items-center gap-1 font-semibold text-urgente" title="Demasiado parecida a la fuente">
              <IcoAlerta className="h-3 w-3" />
              {Math.round((n.sourceSimilarity ?? 0) * 100)} % fuente
            </span>
          )}
          {n.reviewNote && n.status === "DRAFT" && (
            <span className="font-semibold text-amber-700">Devuelta</span>
          )}
          {n.isBreaking && (!n.breakingUntil || n.breakingUntil > new Date()) && (
            <span className="font-bold text-urgente">URGENTE</span>
          )}
        </p>
      </div>
      {/* En mobile la fila envuelve y esta columna baja entera bajo el título
          (pl-5 = barra de color + gap), para no robarle ancho al titular */}
      <div className="flex shrink-0 flex-col items-end gap-1 text-right max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:gap-2 max-sm:pl-5 max-sm:text-left">
        <ChipEstado estado={n.status} />
        <span className="inline-flex items-center gap-1 text-[10px] text-gris">
          {n.status === "SCHEDULED" && <IcoReloj className="h-3 w-3" />}
          {fechaCorta(fecha)}
        </span>
      </div>
    </li>
  );
}

/** Paginación con links que preservan los filtros. */
export function Paginacion({
  actual,
  totalPaginas,
  hrefDe,
}: {
  actual: number;
  totalPaginas: number;
  hrefDe: (n: number) => string;
}) {
  if (totalPaginas <= 1) return null;
  // Ventana de 7 páginas alrededor de la actual (con 83 páginas no sirve listar todas)
  const desde = Math.max(1, Math.min(actual - 3, totalPaginas - 6));
  const hasta = Math.min(totalPaginas, desde + 6);
  const paginas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  const cls = (activa: boolean, deshab = false) =>
    `rounded px-3 py-1.5 text-xs font-semibold ${
      activa
        ? "bg-azul text-white"
        : deshab
          ? "pointer-events-none border border-azul/10 text-gris/40"
          : "border border-azul/15 text-azul hover:border-azul-medio hover:text-azul-medio"
    }`;
  return (
    <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Paginación">
      <Link href={hrefDe(Math.max(1, actual - 1))} className={cls(false, actual === 1)}>
        ← Anterior
      </Link>
      {desde > 1 && <span className="text-xs text-gris">…</span>}
      {paginas.map((n) => (
        <Link key={n} href={hrefDe(n)} aria-current={n === actual ? "page" : undefined} className={cls(n === actual)}>
          {n}
        </Link>
      ))}
      {hasta < totalPaginas && <span className="text-xs text-gris">…</span>}
      <Link href={hrefDe(Math.min(totalPaginas, actual + 1))} className={cls(false, actual === totalPaginas)}>
        Siguiente →
      </Link>
      <span className="ml-1 text-xs text-gris">
        Página {actual} de {totalPaginas}
      </span>
    </nav>
  );
}
