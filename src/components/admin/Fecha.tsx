import { fechaCorta } from "@/lib/fechas";

/**
 * Fecha formateada dentro de componentes CLIENTE. Intl.DateTimeFormat("es-AR")
 * produce un espacio no separable distinto en Node (SSR) y en Chromium, y eso
 * rompe la hidratación ("19 ago, 10:03 a. m." ≠ "19 ago, 10:03 a. m.").
 * suppressHydrationWarning le dice a React que acepte la versión del cliente
 * para este nodo de texto; el dateTime ISO es el mismo en ambos lados.
 */
export function Fecha({ d, className = "" }: { d: Date | null; className?: string }) {
  if (!d) return null;
  return (
    <time dateTime={d.toISOString()} suppressHydrationWarning className={className}>
      {fechaCorta(d)}
    </time>
  );
}
