import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listarNotas, notasRelacionadas, obtenerNota } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { PiePagina } from "@/components/PiePagina";
import { MuroInstagram } from "@/components/Social";
import { FilaNota, TarjetaNota } from "@/components/TarjetaNota";
import { ArticuloNota } from "@/components/nota/ArticuloNota";
import { SITE_URL } from "@/lib/env";
import { SITIO } from "@/lib/sitio";

/**
 * Array vacío = ISR bajo demanda: ninguna nota se genera en build (el build
 * no depende del backend); cada nota se renderiza en su primera visita y el
 * HTML queda cacheado hasta que venza su revalidate o el panel la actualice
 * vía updateTag. Sin este export, Next trataría la ruta como 100% dinámica.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nota = await obtenerNota(slug);
  // absolute: sin el template del layout, que agregaría "— Fuente de
  // Noticias" a un título que ya es el nombre del sitio.
  if (!nota) return { title: { absolute: SITIO.nombre } };
  // Los campos SEO/social del editor mandan; si están vacíos, título y bajada
  const title = nota.seoTitle || nota.title || SITIO.nombre;
  const description = nota.seoDescription || nota.summary || undefined;
  return {
    // Título crudo: el template del layout ya le suma "— Fuente de Noticias".
    title,
    description,
    // URL canónica: si la nota llega con parámetros de tracking o desde /ads,
    // los buscadores saben cuál es la versión "oficial" a indexar.
    alternates: { canonical: `/noticia/${slug}` },
    openGraph: {
      title: nota.socialTitle || nota.title || title,
      description,
      type: "article",
      url: `/noticia/${slug}`,
      ...(nota.publishedAt && {
        publishedTime: new Date(nota.publishedAt).toISOString(),
      }),
      // Las notas sin imagen se comparten con la placa de la marca: un link
      // sin miniatura en WhatsApp/Facebook pierde la mitad de los clics.
      images: [nota.imageUrl || "/og-default.png"],
    },
  };
}

/**
 * Datos estructurados schema.org (NewsArticle) para Google News/Discover:
 * le dicen al buscador qué es cada cosa (titular, fecha, autor, medio) sin
 * que tenga que adivinarlo del HTML. Se emiten como JSON-LD en un <script>.
 */
function jsonLdNota(nota: {
  slug: string | null;
  title: string | null;
  summary: string | null;
  imageUrl: string | null;
  featuredMedia: { url: string } | null;
  publishedAt: Date | null;
  category: string | null;
  authors: { name: string }[];
}) {
  const url = `${SITE_URL}/noticia/${nota.slug}`;
  // La media propia llega relativa (/uploads/...); schema.org exige absoluta.
  const cruda = nota.featuredMedia?.url ?? nota.imageUrl;
  const imagen = cruda?.startsWith("/") ? `${SITE_URL}${cruda}` : cruda;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: nota.title,
    ...(nota.summary && { description: nota.summary }),
    ...(imagen && { image: [imagen] }),
    ...(nota.publishedAt && {
      datePublished: nota.publishedAt.toISOString(),
    }),
    ...(nota.category && { articleSection: nota.category }),
    author:
      nota.authors.length > 0
        ? nota.authors.map((a) => ({ "@type": "Person", name: a.name }))
        : [{ "@type": "Organization", name: SITIO.nombre }],
    publisher: {
      "@type": "Organization",
      name: SITIO.nombre,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export default async function Noticia({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nota = await obtenerNota(slug);
  if (!nota) notFound();

  // Los espacios publicitarios viven en /ads/noticia/[slug]; acá ese lugar lo
  // ocupan más publicaciones: lo último publicado que no sea la propia nota
  // ni una relacionada.
  // Con fallback: si el backend tose, la nota sale igual — solo sin los
  // módulos laterales. Sin el catch, un 500 acá tumba la página entera.
  const [relacionadas, listado] = await Promise.all([
    notasRelacionadas(slug).catch(() => []),
    listarNotas({ limit: 20 }).catch(() => ({ notas: [], total: 0 })),
  ]);
  const yaVistas = new Set([nota.id, ...relacionadas.map((r) => r.id)]);
  const extra = listado.notas.filter((n) => !yaVistas.has(n.id));

  const enFoco = extra.slice(0, 3);
  const ultimas = extra.slice(3, 11);

  return (
    <div>
      {/* El replace escapa "<" para que un título malicioso no pueda cerrar
          el script e inyectar HTML (la serialización estándar de JSON-LD). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdNota(nota)).replace(/</g, "\\u003c"),
        }}
      />
      <Masthead seccionActiva={nota.category ?? undefined} />

      <main className="contenedor pt-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <div className="min-w-0">
            <article className="mx-auto max-w-3xl">
              <ArticuloNota nota={nota} />

              {enFoco.length > 0 && (
                <section className="mt-10 grid gap-6 sm:grid-cols-3">
                  {enFoco.map((n) => (
                    <TarjetaNota key={n.id} nota={n} variante="media" />
                  ))}
                </section>
              )}

              {relacionadas.length > 0 && (
                <section className="mt-12">
                  <div className="regla-marca" />
                  <h2 className="mt-6 text-[11px] font-bold uppercase tracking-[0.34em] text-azul-claro">
                    Seguí leyendo
                  </h2>
                  <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {relacionadas.map((r) => (
                      <FilaNota key={r.id} nota={r} />
                    ))}
                  </div>
                </section>
              )}

              <p className="mt-10">
                <Link
                  href="/"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-gris hover:text-azul-medio"
                >
                  ← Volver a la portada
                </Link>
              </p>
            </article>
          </div>

          {/* ── Columna lateral: últimas noticias y redes ─────────────── */}
          <aside className="space-y-8 lg:border-l lg:border-hielo lg:pl-8">
            {ultimas.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.34em] text-azul-claro">
                  Últimas noticias
                </h2>
                <div className="mt-4 space-y-5">
                  {ultimas.map((n) => (
                    <FilaNota key={n.id} nota={n} />
                  ))}
                </div>
              </section>
            )}
            <MuroInstagram />
          </aside>
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
