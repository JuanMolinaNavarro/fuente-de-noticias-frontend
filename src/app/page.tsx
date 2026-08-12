import Link from "next/link";
import { prisma } from "@/lib/db";
import { colorCategoria } from "@/lib/categorias";
import { Masthead, PiePagina } from "@/components/Masthead";

export const dynamic = "force-dynamic";

function fechaCorta(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function Badge({ category }: { category: string | null }) {
  return (
    <span
      className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
      style={{ backgroundColor: colorCategoria(category) }}
    >
      {category ?? "Tucumán"}
    </span>
  );
}

function Placa({ category, tall }: { category: string | null; tall?: boolean }) {
  return (
    <div
      className={`placa flex ${tall ? "h-64" : "h-36"} items-center justify-center border border-hielo`}
    >
      <span className="font-display text-6xl font-black text-azul-claro/30">
        {(category ?? "F").slice(0, 1)}
      </span>
    </div>
  );
}

export default async function Portada() {
  const notas = await prisma.article.findMany({
    where: { status: "APPROVED" },
    orderBy: { publishedAt: "desc" },
    take: 13,
  });

  const [principal, ...resto] = notas;

  return (
    <div>
      <Masthead />
      <main className="mx-auto max-w-6xl px-5">
        {!principal && (
          <div className="py-28 text-center">
            <p className="font-display text-3xl font-bold text-azul">
              La redacción está trabajando.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-gris">
              Todavía no hay notas aprobadas — pasá por el panel de
              administración
            </p>
          </div>
        )}

        {principal && (
          <article className="grid gap-8 py-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Badge category={principal.category} />
              <h2 className="mt-4 font-display text-4xl font-black leading-[1.08] tracking-tight text-azul sm:text-5xl">
                <Link
                  href={`/noticia/${principal.slug}`}
                  className="hover:underline decoration-azul-claro decoration-3 underline-offset-6"
                >
                  {principal.title}
                </Link>
              </h2>
              <p className="mt-5 max-w-2xl text-lg font-light leading-relaxed text-gris-oscuro">
                {principal.summary}
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris">
                Fuente: {principal.sourceName} ·{" "}
                {fechaCorta(principal.publishedAt)}
              </p>
            </div>
            <div className="lg:col-span-2">
              {principal.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={principal.imageUrl}
                  alt={principal.title ?? ""}
                  className="h-64 w-full border border-hielo object-cover"
                />
              ) : (
                <Placa category={principal.category} tall />
              )}
            </div>
          </article>
        )}

        {resto.length > 0 && (
          <>
            <div className="border-t-2 border-azul" />
            <section className="grid gap-x-8 gap-y-10 py-10 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((nota, i) => (
                <article
                  key={nota.id}
                  className={`${i % 3 !== 0 ? "lg:border-l lg:border-hielo lg:pl-8" : ""}`}
                >
                  <Badge category={nota.category} />
                  <h3 className="mt-3 font-display text-[22px] font-bold leading-snug text-azul">
                    <Link
                      href={`/noticia/${nota.slug}`}
                      className="hover:underline decoration-azul-claro decoration-2 underline-offset-4"
                    >
                      {nota.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-gris-oscuro">
                    {nota.summary}
                  </p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gris">
                    {nota.sourceName} · {fechaCorta(nota.publishedAt)}
                  </p>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
      <PiePagina />
    </div>
  );
}
