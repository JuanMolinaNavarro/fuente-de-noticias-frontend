import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerVistaPrevia } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { PiePagina } from "@/components/PiePagina";
import { ArticuloNota } from "@/components/nota/ArticuloNota";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vista previa — Fuente de Noticias",
  robots: { index: false, follow: false },
};

/**
 * Vista previa de una nota NO publicada. El token lo emite el panel
 * (POST /admin/articles/:id/preview-token), vence en una hora y el backend
 * responde 404 para todo lo demás: para el público la nota no existe.
 */
export default async function VistaPrevia({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const nota = await obtenerVistaPrevia(token);
  if (!nota) notFound();

  return (
    <div>
      <div className="sticky top-0 z-30 bg-amber-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-carbon">
        Vista previa — esta nota no está publicada · el enlace vence en una hora
      </div>
      <Masthead seccionActiva={nota.category ?? undefined} />
      <main className="contenedor pt-8">
        <article className="mx-auto max-w-3xl">
          <ArticuloNota nota={nota} vistaPrevia />
        </article>
      </main>
      <PiePagina />
    </div>
  );
}
