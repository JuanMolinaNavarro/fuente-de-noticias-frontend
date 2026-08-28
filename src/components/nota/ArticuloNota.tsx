import { Badge } from "@/components/Badge";
import type { NotaDetalle } from "@/lib/api";
import { fechaLarga } from "@/lib/fechas";
import { CuerpoNota } from "./CuerpoNota";

/**
 * El cuerpo de una nota tal como la ve el lector: sección, volanta, título,
 * bajada, fecha, imagen y cuerpo. El medio de origen no se muestra en el sitio
 * público (queda sólo en el panel de administración). Lo comparten
 * la página pública (/noticia/[slug]) y la vista previa del panel, así lo que
 * el editor previsualiza es exactamente lo que se publica.
 */
export function ArticuloNota({ nota, vistaPrevia = false }: { nota: NotaDetalle; vistaPrevia?: boolean }) {
  return (
    <>
      <Badge category={nota.category} urgente={nota.isBreaking} />
      {nota.kicker && (
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-azul-medio">
          {nota.kicker}
        </p>
      )}
      <h1 className="mt-5 font-display text-4xl leading-[1.08] tracking-tight text-carbon sm:text-5xl">
        {nota.title}
      </h1>
      {nota.summary && (
        <p className="mt-5 text-xl font-light leading-relaxed text-gris-oscuro">
          {nota.summary}
        </p>
      )}
      <p className="mt-5 border-y border-hielo py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris">
        {vistaPrevia && !nota.publishedAt ? "sin publicar" : fechaLarga(nota.publishedAt)}
      </p>

      {nota.featuredMedia ? (
        <figure className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nota.featuredMedia.url}
            alt={nota.featuredMedia.alt ?? nota.title ?? ""}
            width={nota.featuredMedia.width ?? undefined}
            height={nota.featuredMedia.height ?? undefined}
            className="w-full rounded-xl"
          />
          {nota.featuredMedia.caption && (
            <figcaption className="mt-2 text-sm text-gris-oscuro">
              {nota.featuredMedia.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        nota.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nota.imageUrl}
            alt={nota.title ?? ""}
            className="mt-8 w-full rounded-xl object-cover"
          />
        )
      )}

      <CuerpoNota
        contentJson={nota.contentJson}
        content={nota.content}
        className="capitular mt-9 text-[17px] leading-[1.8] text-carbon"
      />
    </>
  );
}
