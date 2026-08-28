/** Sección plegable de la barra lateral del editor (details/summary nativo:
 *  sin estado, sin JS, accesible). */
export function Acordeon({
  titulo,
  abierto = false,
  children,
}: {
  titulo: string;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={abierto}
      className="group border border-hielo bg-white open:border-azul-medio/40"
    >
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">
        {titulo}
        <span className="text-gris transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 border-t border-hielo px-4 py-4">{children}</div>
    </details>
  );
}
