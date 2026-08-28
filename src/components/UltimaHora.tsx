import Link from "next/link";
import type { NotaResumen } from "@/components/TarjetaNota";

/* Con más urgentes que esto el bucle del ticker tarda minutos en volver a
   empezar; el resto sigue accesible desde la portada y las secciones. */
const MAX_NOTAS = 3;

/* Lento, de lectura: ~18 s por nota para recorrer un grupo completo. */
const SEGUNDOS_POR_NOTA = 18;

/**
 * Zócalo de última hora debajo de la navegación, como cinta continua: el
 * rótulo queda fijo a la izquierda y los titulares se desplazan en bucle
 * (CSS puro, ver .ticker en globals.css). Se pausa con el mouse encima y,
 * con `prefers-reduced-motion`, queda como fila estática desplazable.
 * Sólo aparece si hay notas publicadas marcadas como urgentes y vigentes
 * (breakingUntil en el futuro o sin vencimiento), a criterio del editor.
 */
export function UltimaHora({ notas }: { notas: NotaResumen[] }) {
  if (notas.length === 0) return null;
  const visibles = notas.slice(0, MAX_NOTAS);
  const duracion = `${visibles.length * SEGUNDOS_POR_NOTA}s`;

  /* La copia existe solo para que el bucle sea continuo: invisible para
     lectores de pantalla y fuera del orden de tabulación. */
  const Grupo = ({ copia = false }: { copia?: boolean }) => (
    <div
      className={`flex items-center gap-4 pr-4 ${copia ? "ticker-copia" : ""}`}
      aria-hidden={copia || undefined}
    >
      {visibles.map((n) => (
        <span key={n.id} className="flex shrink-0 items-center gap-4">
          <Link
            href={`/noticia/${n.slug}`}
            tabIndex={copia ? -1 : undefined}
            className="text-sm font-semibold underline-offset-4 hover:underline"
          >
            {n.title}
          </Link>
          <span aria-hidden className="text-gris">
            •
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="text-carbon">
      <div className="contenedor flex items-center gap-4 py-2">
        {/* El rótulo en rojo es el que llama la atención; el punto hereda el
            color urgente porque sobre fondo claro el blanco desaparece. */}
        <span className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-urgente">
          <span
            className="punto-urgente"
            style={{ background: "var(--color-urgente)" }}
          />{" "}
          Última hora
        </span>
        <div
          className="ticker min-w-0 flex-1"
          style={{ "--duracion-ticker": duracion } as React.CSSProperties}
        >
          <div className="ticker-pista">
            <Grupo />
            <Grupo copia />
          </div>
        </div>
      </div>
    </div>
  );
}
