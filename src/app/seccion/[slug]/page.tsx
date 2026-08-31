import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listarNotas, obtenerCategorias } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { PiePagina } from "@/components/PiePagina";
import { MuroInstagram } from "@/components/Social";
import { FilaNota, TarjetaNota } from "@/components/TarjetaNota";
import { categoriaDesdeSlug, colorCategoria } from "@/lib/categorias";
import { SITIO } from "@/lib/sitio";

// ISR bajo demanda: ver el comentario en noticia/[slug]/page.tsx.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = categoriaDesdeSlug(slug);
  const title = categoria
    ? `${categoria} — ${SITIO.nombre}`
    : `Sección — ${SITIO.nombre}`;
  const description = categoria
    ? `Últimas noticias de ${categoria} en ${SITIO.nombre}. ${SITIO.lema}`
    : SITIO.descripcion;
  return {
    title,
    description,
    alternates: { canonical: `/seccion/${slug}` },
    openGraph: { title, description, url: `/seccion/${slug}` },
  };
}

/* Resuelve el slug contra la tabla Category de la API; si la API no
   responde, cae al catálogo estático local. */
async function resolverCategoria(slug: string) {
  try {
    const cat = (await obtenerCategorias()).find((c) => c.slug === slug);
    if (cat) return { nombre: cat.name, color: cat.color };
  } catch {
    // fallback abajo
  }
  const nombre = categoriaDesdeSlug(slug);
  return nombre ? { nombre, color: colorCategoria(nombre) } : null;
}

export default async function Seccion({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await resolverCategoria(slug);
  if (!cat) notFound();
  const categoria = cat.nombre;

  const { notas } = await listarNotas({ category: categoria, limit: 24 });

  const grilla = notas.slice(0, 6);
  const listado = notas.slice(6);

  return (
    <div>
      <Masthead seccionActiva={categoria} />

      <main className="contenedor pt-8">
        <header className="pb-6">
          <h1
            className="font-display text-4xl tracking-tight"
            style={{ color: cat.color }}
          >
            {categoria}
          </h1>
          <div
            className="mt-3 h-[3px] w-20"
            style={{ backgroundColor: cat.color }}
          />
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <div className="min-w-0">
            {notas.length === 0 ? (
              <p className="py-20 text-center text-sm uppercase tracking-[0.2em] text-gris">
                Todavía no hay notas publicadas en {categoria}
              </p>
            ) : (
              <>
                <section className="grid gap-5 sm:grid-cols-2">
                  {grilla.map((nota) => (
                    <TarjetaNota key={nota.id} nota={nota} />
                  ))}
                </section>

                {listado.length > 0 && (
                  <section className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {listado.map((nota) => (
                      <FilaNota key={nota.id} nota={nota} />
                    ))}
                  </section>
                )}
              </>
            )}
          </div>

          <aside className="space-y-8 lg:border-l lg:border-hielo lg:pl-8">
            <MuroInstagram />
          </aside>
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
