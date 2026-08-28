import Link from "next/link";

/** Bloque de la columna lateral: cabecera con título y contenido enmarcado. */
export function Modulo({
  titulo,
  accion,
  children,
  className = "",
}: {
  titulo: string;
  accion?: { texto: string; href: string; externo?: boolean };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-hielo bg-white ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-hielo bg-gris-claro/70 px-4 py-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-azul">
          {titulo}
        </h2>
        {accion &&
          (accion.externo ? (
            <a
              href={accion.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-azul-medio hover:underline"
            >
              {accion.texto}
            </a>
          ) : (
            <Link
              href={accion.href}
              className="text-[11px] font-semibold text-azul-medio hover:underline"
            >
              {accion.texto}
            </Link>
          ))}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
