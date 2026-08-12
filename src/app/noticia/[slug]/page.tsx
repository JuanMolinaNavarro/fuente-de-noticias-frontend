import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/Badge";
import { Masthead, PiePagina } from "@/components/Masthead";

export const dynamic = "force-dynamic";

export default async function Noticia({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nota = await prisma.article.findUnique({ where: { slug } });
  if (!nota || nota.status !== "APPROVED") notFound();

  const fecha = nota.publishedAt
    ? new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(nota.publishedAt)
    : "";

  const parrafos = (nota.content ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div>
      <Masthead />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Badge category={nota.category} />
        <h1 className="mt-5 font-display text-4xl font-black leading-[1.08] tracking-tight text-azul sm:text-5xl">
          {nota.title}
        </h1>
        <p className="mt-5 text-xl font-light leading-relaxed text-gris-oscuro">
          {nota.summary}
        </p>
        <p className="mt-5 border-y border-hielo py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris">
          {fecha}
        </p>

        {nota.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nota.imageUrl}
            alt={nota.title ?? ""}
            className="mt-8 w-full rounded-xl object-cover"
          />
        )}

        <div className="capitular mt-9 space-y-6 text-[17px] leading-[1.8] text-carbon">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <aside className="mt-12 rounded-xl border border-azul-medio/25 bg-hielo p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
            Fuente original
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-gris-oscuro">
            Esta nota fue elaborada por nuestra redacción a partir de
            información publicada por <strong>{nota.sourceName}</strong>.{" "}
            <a
              href={nota.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-azul-medio underline underline-offset-2"
            >
              Leer la cobertura original →
            </a>
          </p>
        </aside>

        <p className="mt-10">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-gris hover:text-azul-medio"
          >
            ← Volver a la portada
          </Link>
        </p>
      </main>
      <PiePagina />
    </div>
  );
}
