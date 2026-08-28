import { requireSession } from "@/lib/auth";
import { obtenerCategorias } from "@/lib/api";
import { FormNuevaNota } from "./FormNuevaNota";

export const dynamic = "force-dynamic";

export default async function NuevaNota() {
  await requireSession();
  const categorias = await obtenerCategorias();
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">
        Redacción
      </p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Nueva nota</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">
        Una nota original, escrita desde cero. Nace como borrador tuyo.
      </p>
      <div className="mt-6 border border-hielo bg-white p-6">
        <FormNuevaNota categorias={categorias} />
      </div>
    </div>
  );
}
