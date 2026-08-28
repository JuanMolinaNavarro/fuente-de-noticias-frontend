import { colorCategoria } from "@/lib/categorias";

/**
 * Volanta de categoría. En el rediseño editorial va como texto plano en el
 * color de la sección (estilo tapa curada); la placa llena con punto
 * parpadeante queda reservada para las notas urgentes (`isBreaking`), que
 * necesitan el alto impacto. La urgencia es un estado de la nota, no una
 * categoría: el vencimiento ya viene resuelto por la API (isBreaking llega
 * false si la urgencia venció).
 */
export function Badge({
  category,
  urgente = false,
}: {
  category: string | null;
  urgente?: boolean;
}) {
  if (urgente) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
        style={{ backgroundColor: "var(--color-urgente)" }}
      >
        <span className="punto-urgente" />
        Urgente
      </span>
    );
  }
  const nombre = category ?? "Tucumán";
  return (
    <span
      className="text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: colorCategoria(nombre) }}
    >
      {nombre}
    </span>
  );
}
