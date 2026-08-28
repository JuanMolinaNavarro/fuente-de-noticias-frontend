"use client";

import { useEffect } from "react";
import type { Categoria } from "@/lib/api";
import type { MediaRef, NotaDetalle, Persona } from "@/lib/admin-api";
import {
  FilaNota,
  TarjetaNota,
  TarjetaPrincipal,
  type NotaResumen,
} from "@/components/TarjetaNota";

/** Campos del editor que afectan cómo se ve la nota en la portada. */
export type FormPortada = {
  kicker: string;
  title: string;
  summary: string;
  categoryId: string;
  imageUrl: string;
  isBreaking: boolean;
  authorIds: string[];
};

/** Arma una NotaResumen (el contrato de las tarjetas del home) desde el
 *  estado vivo del editor, para que la preview refleje lo que hay en pantalla
 *  aunque todavía no esté guardado. */
function aResumen(
  nota: NotaDetalle,
  form: FormPortada,
  destacada: MediaRef | null,
  categorias: Categoria[],
  usuarios: Persona[],
): NotaResumen {
  const cat = categorias.find((c) => c.id === form.categoryId) ?? null;
  return {
    id: nota.id,
    slug: nota.slug,
    kicker: form.kicker || null,
    title: form.title || null,
    summary: form.summary || null,
    category: cat?.name ?? null,
    categorySlug: cat?.slug ?? null,
    sourceName: nota.source?.sourceName ?? null,
    imageUrl: form.imageUrl || null,
    featuredMedia: destacada,
    // Simula "recién publicada" para que la firma muestre una fecha
    publishedAt: nota.publishedAt ?? new Date(),
    origin: nota.origin,
    isBreaking: form.isBreaking,
    authors: usuarios.filter((u) => form.authorIds.includes(u.id)),
  };
}

const tituloSeccion =
  "text-[11px] font-bold uppercase tracking-[0.34em] text-azul-claro";

/** Modal "así se vería la nota en la portada", en sus tres ubicaciones. */
export function PreviewHome({
  abierto,
  onCerrar,
  nota,
  form,
  destacada,
  categorias,
  usuarios,
}: {
  abierto: boolean;
  onCerrar: () => void;
  nota: NotaDetalle;
  form: FormPortada;
  destacada: MediaRef | null;
  categorias: Categoria[];
  usuarios: Persona[];
}) {
  useEffect(() => {
    if (!abierto) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const resumen = aResumen(nota, form, destacada, categorias, usuarios);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa en la portada"
      className="fixed inset-0 z-50 flex items-center justify-center bg-noche/60 p-4"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded border border-hielo bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hielo px-6 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
            Así se vería en la portada
          </p>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gris hover:text-azul"
          >
            Cerrar
          </button>
        </div>
        {/* Las tarjetas son las mismas del home; sin clics para no navegar a
            slugs que quizá todavía no existen. */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="pointer-events-none space-y-10">
          <section>
            <h2 className={tituloSeccion}>Como principal</h2>
            <div className="mt-5">
              <TarjetaPrincipal nota={resumen} />
            </div>
          </section>
          <section>
            <h2 className={tituloSeccion}>Como destacada (Lo último)</h2>
            <div className="mt-5 max-w-sm">
              <TarjetaNota nota={resumen} />
            </div>
          </section>
          <section>
            <h2 className={tituloSeccion}>En Más noticias</h2>
            <div className="mt-5 max-w-xl">
              <FilaNota nota={resumen} />
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
