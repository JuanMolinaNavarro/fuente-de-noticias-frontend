import type { EstadoNota } from "@/lib/api";

/** Nombre, color y tono de cada estado editorial (uno solo, compartido). */
export const ESTADOS: Record<
  EstadoNota,
  { label: string; plural: string; clase: string; descripcion: string }
> = {
  INGESTED: {
    label: "Ingresada",
    plural: "Ingresadas",
    clase: "bg-gris/15 text-gris-oscuro",
    descripcion: "Llegó del feed; pendiente de pasar a borrador",
  },
  DRAFT: {
    label: "Borrador",
    plural: "Borradores",
    clase: "bg-azul-claro/15 text-azul",
    descripcion: "Editable por su redactor o por un editor",
  },
  IN_REVIEW: {
    label: "En revisión",
    plural: "En revisión",
    clase: "bg-amber-100 text-amber-800",
    descripcion: "Enviada por el redactor; espera a un editor",
  },
  SCHEDULED: {
    label: "Programada",
    plural: "Programadas",
    clase: "bg-violet-100 text-violet-800",
    descripcion: "Sale sola a la hora programada",
  },
  PUBLISHED: {
    label: "Publicada",
    plural: "Publicadas",
    clase: "bg-emerald-100 text-emerald-800",
    descripcion: "Visible en el sitio",
  },
  SPIKED: {
    label: "Descartada",
    plural: "Descartadas",
    clase: "bg-urgente/10 text-urgente",
    descripcion: "En la papelera; se puede restaurar",
  },
};

export function ChipEstado({
  estado,
  className = "",
}: {
  estado: EstadoNota;
  className?: string;
}) {
  const e = ESTADOS[estado];
  return (
    <span
      title={e.descripcion}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${e.clase} ${className}`}
    >
      {e.label}
    </span>
  );
}
