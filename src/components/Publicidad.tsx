import { AVISOS, FORMATOS, type Formato } from "@/lib/publicidad";
import { SITIO } from "@/lib/sitio";

/**
 * Espacio publicitario. Reserva siempre el alto del formato para que la carga
 * de un aviso no desplace el contenido (evita saltos de layout).
 *
 * Si el `id` tiene una campaña cargada en `AVISOS` muestra el aviso rotulado
 * como "Publicidad"; si no, muestra el espacio disponible.
 */
export function Publicidad({
  id,
  formato,
  className = "",
}: {
  id: string;
  formato: Formato;
  className?: string;
}) {
  const medida = FORMATOS[formato];
  const aviso = AVISOS[id];

  const marco = {
    maxWidth: medida.ancho,
    "--proporcion": `${medida.ancho} / ${medida.alto}`,
    "--proporcion-movil": `${medida.movil.ancho} / ${medida.movil.alto}`,
  } as React.CSSProperties;

  return (
    <aside
      aria-label="Publicidad"
      className={`mx-auto w-full ${className}`}
      style={marco}
    >
      <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-gris/70">
        Publicidad
      </p>

      {aviso ? (
        <div className="aviso overflow-hidden rounded-lg bg-gris-claro">
          {aviso.html ? (
            <div
              className="h-full w-full"
              // El markup viene del ad server configurado por la redacción.
              dangerouslySetInnerHTML={{ __html: aviso.html }}
            />
          ) : (
            <a
              href={aviso.destino ?? "#"}
              target="_blank"
              rel="noopener sponsored"
              className="block h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aviso.imagen}
                alt={`Publicidad de ${aviso.anunciante}`}
                className="h-full w-full object-cover"
              />
            </a>
          )}
        </div>
      ) : (
        <a
          href={`mailto:${SITIO.emailComercial}?subject=${encodeURIComponent(
            `Consulta por el espacio ${id} (${medida.ancho}x${medida.alto})`
          )}`}
          className="aviso group flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-azul-medio/30 bg-hielo/60 text-center transition-colors hover:border-azul-medio/60 hover:bg-hielo"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-azul/45 group-hover:text-azul">
            Espacio disponible
          </span>
          <span className="text-[10px] font-medium tracking-wide text-gris/70">
            {medida.ancho} × {medida.alto}
          </span>
        </a>
      )}
    </aside>
  );
}
