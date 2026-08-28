import Link from "next/link";
import { Badge } from "@/components/Badge";
import { colorCategoria } from "@/lib/categorias";
import { fechaCorta } from "@/lib/fechas";

export type NotaResumen = {
  id: string;
  slug: string | null;
  kicker: string | null;
  title: string | null;
  summary: string | null;
  category: string | null;
  categorySlug: string | null;
  /** medio de origen; null en notas originales de la redacción */
  sourceName: string | null;
  /** destacada (Media propia o externa legada) */
  imageUrl: string | null;
  featuredMedia: {
    url: string;
    thumbUrl: string | null;
    alt: string | null;
    caption: string | null;
    width: number | null;
    height: number | null;
    focalX: number | null;
    focalY: number | null;
  } | null;
  publishedAt: Date | null;
  origin: "FEED" | "ORIGINAL";
  isBreaking: boolean;
  authors: { id: string; name: string }[];
};

/** Placa tipográfica para las notas sin imagen propia. */
export function Placa({
  category,
  className = "",
}: {
  category: string | null;
  className?: string;
}) {
  return (
    <div className={`placa flex items-center justify-center ${className}`}>
      <span className="font-display text-azul-claro/35">
        {(category ?? "F").slice(0, 1)}
      </span>
    </div>
  );
}

/**
 * Imagen para tarjetas: la miniatura de la biblioteca si existe (más liviana
 * que la principal) y el punto focal elegido por el editor como centro del
 * recorte, para que object-cover no deje caras afuera.
 */
export function imagenTarjeta(nota: NotaResumen) {
  const m = nota.featuredMedia;
  if (m) {
    return {
      src: m.thumbUrl ?? m.url,
      alt: m.alt ?? "",
      style: { objectPosition: `${(m.focalX ?? 0.5) * 100}% ${(m.focalY ?? 0.5) * 100}%` },
    };
  }
  if (nota.imageUrl) return { src: nota.imageUrl, alt: "", style: undefined };
  return null;
}

/**
 * Peso de la tarjeta dentro del mosaico de portada. Lo decide la POSICIÓN en
 * el curador (ver `Mosaico`), no el editor: mover una nota hacia arriba la
 * agranda. DM Serif Text trae un solo peso, así que la jerarquía la pone el
 * tamaño, no la negrita.
 */
export type VarianteTarjeta = "principal" | "media" | "ancha";

const ESTILOS: Record<
  Exclude<VarianteTarjeta, "ancha">,
  { alto: string; placa: string; titular: string; bajada: string | null }
> = {
  principal: {
    alto: "h-64 sm:h-80",
    placa: "text-6xl sm:text-7xl",
    titular: "text-3xl leading-[1.1] sm:text-[2.5rem]",
    bajada: "mt-4 text-base",
  },
  media: {
    alto: "h-40",
    placa: "text-5xl",
    titular: "text-xl leading-snug",
    bajada: null,
  },
};

/** Foto de la tarjeta, o la placa tipográfica si la nota no tiene imagen. */
function Ilustracion({
  nota,
  alto,
  placa,
  ancho = "w-full",
}: {
  nota: NotaResumen;
  alto: string;
  placa: string;
  ancho?: string;
}) {
  const img = imagenTarjeta(nota);
  if (!img) {
    return <Placa category={nota.category} className={`${alto} ${ancho} ${placa}`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      alt={img.alt}
      style={img.style}
      className={`${alto} ${ancho} object-cover`}
    />
  );
}

function Volanta({ nota }: { nota: NotaResumen }) {
  return <Badge category={nota.category} urgente={nota.isBreaking} />;
}

function Fecha({ nota, className = "" }: { nota: NotaResumen; className?: string }) {
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-gris ${className}`}
    >
      {fechaCorta(nota.publishedAt)}
    </p>
  );
}

/**
 * Tarjeta de nota, plana al estilo de tapa curada: sin caja gris ni esquinas
 * redondeadas, separada de la siguiente por un filete.
 *
 * `variante` da el peso; el default "media" mantiene el contrato viejo para
 * las páginas de sección y la vista previa del panel.
 */
export function TarjetaNota({
  nota,
  variante = "media",
  className = "",
}: {
  nota: NotaResumen;
  variante?: VarianteTarjeta;
  className?: string;
}) {
  // La variante ancha es horizontal (miniatura al costado): estructura propia.
  if (variante === "ancha") {
    return (
      <article
        className={`flex h-full min-w-0 flex-col gap-4 border-b border-hielo pb-5 sm:flex-row sm:gap-6 ${className}`}
      >
        <Link
          href={`/noticia/${nota.slug}`}
          className="shrink-0 overflow-hidden"
          tabIndex={-1}
          aria-hidden
        >
          {/* Apilada en mobile: en horizontal el titular quedaba en ~150px */}
          <Ilustracion
            nota={nota}
            alto="h-44 sm:h-40"
            placa="text-4xl"
            ancho="w-full sm:w-56"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Volanta nota={nota} />
          <h3 className="mt-2 font-display text-2xl leading-snug text-balance text-carbon">
            <Link
              href={`/noticia/${nota.slug}`}
              className="decoration-azul-claro decoration-2 underline-offset-4 hover:underline"
            >
              {nota.title}
            </Link>
          </h3>
          {nota.summary && (
            <p className="mt-2 text-sm font-light leading-relaxed text-pretty text-gris-oscuro">
              {nota.summary}
            </p>
          )}
          <Fecha nota={nota} className="mt-3" />
        </div>
      </article>
    );
  }

  const e = ESTILOS[variante];
  return (
    <article
      className={`flex h-full min-w-0 flex-col border-b border-hielo pb-5 ${className}`}
    >
      <Link href={`/noticia/${nota.slug}`} tabIndex={-1} aria-hidden>
        <Ilustracion nota={nota} alto={e.alto} placa={e.placa} />
      </Link>
      <div className="pt-4">
        <Volanta nota={nota} />
        <h3
          className={`mt-3 font-display text-balance text-carbon ${e.titular}`}
        >
          <Link
            href={`/noticia/${nota.slug}`}
            className="decoration-azul-claro decoration-2 underline-offset-4 hover:underline"
          >
            {nota.title}
          </Link>
        </h3>
        {e.bajada && nota.summary && (
          <p
            className={`font-light leading-relaxed text-pretty text-gris-oscuro ${e.bajada}`}
          >
            {nota.summary}
          </p>
        )}
        <Fecha nota={nota} className="mt-4" />
      </div>
    </article>
  );
}

/**
 * Alias del peso "principal". Lo usa la vista previa del panel, que muestra
 * las tres ubicaciones de una nota en la portada.
 */
export function TarjetaPrincipal({ nota }: { nota: NotaResumen }) {
  return <TarjetaNota nota={nota} variante="principal" />;
}

/** Fila compacta con miniatura: listados secundarios y columna lateral. */
export function FilaNota({ nota }: { nota: NotaResumen }) {
  return (
    <article className="group flex gap-4 border-b border-hielo pb-4">
      <Link
        href={`/noticia/${nota.slug}`}
        className="shrink-0 overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        {imagenTarjeta(nota) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenTarjeta(nota)!.src}
            alt=""
            style={imagenTarjeta(nota)!.style}
            className="h-[68px] w-[92px] object-cover"
          />
        ) : (
          <Placa
            category={nota.category}
            className="h-[68px] w-[92px] text-2xl"
          />
        )}
      </Link>
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: colorCategoria(nota.category) }}
        >
          {nota.category ?? "Tucumán"}
        </p>
        <h3 className="mt-1 font-display text-[16px] leading-snug text-carbon">
          <Link
            href={`/noticia/${nota.slug}`}
            className="decoration-azul-claro decoration-2 underline-offset-4 group-hover:underline"
          >
            {nota.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gris">
          {fechaCorta(nota.publishedAt)}
        </p>
      </div>
    </article>
  );
}
