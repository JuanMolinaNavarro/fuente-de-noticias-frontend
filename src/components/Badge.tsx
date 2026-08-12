import { colorCategoria, esUrgente } from "@/lib/categorias";

export function Badge({ category }: { category: string | null }) {
  const nombre = category ?? "Tucumán";
  const urgente = esUrgente(nombre);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
      style={{ backgroundColor: colorCategoria(nombre) }}
    >
      {urgente && <span className="punto-urgente" />}
      {nombre}
    </span>
  );
}
