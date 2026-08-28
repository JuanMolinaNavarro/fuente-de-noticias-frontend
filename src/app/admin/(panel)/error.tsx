"use client";

/**
 * Error boundary del panel. Es un componente cliente por convención de Next
 * (necesita `reset`). Muestra el mensaje y deja reintentar sin perder la
 * navegación: mucho mejor que la pantalla genérica de Next.
 */
export default function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-lg border border-urgente/30 bg-white p-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-urgente">
        Algo salió mal
      </p>
      <p className="mt-3 text-sm text-gris-oscuro">{error.message}</p>
      {error.digest && (
        <p className="mt-1 text-[10px] text-gris">ref. {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded bg-azul-medio px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-azul"
      >
        Reintentar
      </button>
    </div>
  );
}
