import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { notasRelacionadas, obtenerNota } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { PiePagina } from "@/components/PiePagina";
import { Publicidad } from "@/components/Publicidad";
import { MuroInstagram } from "@/components/Social";
import { FilaNota } from "@/components/TarjetaNota";
import { ArticuloNota } from "@/components/nota/ArticuloNota";
import { SITIO } from "@/lib/sitio";

// ISR bajo demanda: ver el comentario en noticia/[slug]/page.tsx.
export async function generateStaticParams() {
  return [];
}

// Versión con inventario publicitario de la nota. La canónica (sin avisos)
// vive en /noticia/[slug]; esta ruta no se indexa para no duplicar contenido.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nota = await obtenerNota(slug);
  if (!nota)
    return {
      title: { absolute: SITIO.nombre },
      robots: { index: false, follow: false },
    };
  return {
    // Título crudo: el template del layout ya le suma "— Fuente de Noticias".
    title: nota.seoTitle || nota.title || SITIO.nombre,
    robots: { index: false, follow: false },
  };
}

export default async function NoticiaConAvisos({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nota = await obtenerNota(slug);
  if (!nota) notFound();

  const relacionadas = await notasRelacionadas(slug);

  return (
    <div>
      <Masthead seccionActiva={nota.category ?? undefined} />

      <div className="contenedor pt-6">
        <Publicidad id="nota-cabecera" formato="megabanner" />
      </div>

      <main className="contenedor pt-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <div className="min-w-0">
            <article className="mx-auto max-w-3xl">
              <ArticuloNota nota={nota} />

              {/* Publicidad al pie de la nota */}
              <Publicidad id="nota-pie" formato="banner" className="mt-10" />

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
                  href="/ads"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-gris hover:text-azul-medio"
                >
                  ← Volver a la portada
                </Link>
              </p>
            </article>
          </div>

          <aside className="space-y-8 lg:border-l lg:border-hielo lg:pl-8">
            <Publicidad id="nota-lateral-1" formato="caja" />
            <Publicidad id="nota-lateral-2" formato="caja" />
            <MuroInstagram />
            <Publicidad id="nota-lateral-3" formato="rascacielos" />
          </aside>
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
