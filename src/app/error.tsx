"use client";

import Link from "next/link";

/* Error boundary del sitio público: si una página lanza en el server (p. ej.
   el backend caído en una ruta sin fallback), el lector ve esto y no la
   pantalla cruda de Next. Client component por contrato de Next (recibe
   reset() para reintentar el render). No muestra error.message: puede traer
   detalles internos del backend. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="contenedor py-28 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-gris">
        Fuente de Noticias
      </p>
      <h1 className="mt-4 font-display text-3xl text-azul">
        No pudimos cargar esta página.
      </h1>
      <p className="mt-3 text-sm text-gris">
        Es un problema momentáneo de nuestro lado. Probá de nuevo en unos
        segundos.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded bg-azul-medio px-5 py-2.5 text-sm font-medium text-white"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded border border-azul-medio px-5 py-2.5 text-sm font-medium text-azul-medio"
        >
          Ir a la portada
        </Link>
      </div>
    </main>
  );
}
