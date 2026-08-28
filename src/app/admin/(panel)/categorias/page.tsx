import { requireSession } from "@/lib/auth";
import { listarCategoriasAdmin } from "@/lib/admin-api";
import { FormAccion } from "@/components/admin/FormAccion";
import { actualizarCategoriaAction, crearCategoriaAction } from "../gestion-actions";

export const dynamic = "force-dynamic";

const input =
  "rounded border border-azul/15 bg-white px-3 py-2 text-sm text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

export default async function Categorias() {
  const { token, user } = await requireSession("ADMIN", "EDITOR");
  const esAdmin = user.role === "ADMIN";
  const categorias = await listarCategoriasAdmin(token);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Gestión</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Secciones</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">
        El slug es la URL (/seccion/slug) y no se puede cambiar después. “En la barra” la muestra en la navegación del sitio.
      </p>

      <section className="mt-6 border border-hielo bg-white p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Nueva sección</h2>
        <FormAccion action={crearCategoriaAction} textoBoton="Crear" pendiente="Creando…" limpiarAlOk className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-5">
            <label className={label}>Nombre<input name="name" required className={`${input} mt-1 w-full`} /></label>
            <label className={label}>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="minusculas-y-guiones" className={`${input} mt-1 w-full`} /></label>
            <label className={label}>Color<input name="color" type="color" defaultValue="#1c3a6b" className={`${input} mt-1 h-10 w-full p-1`} /></label>
            <label className={label}>Orden<input name="order" type="number" defaultValue={categorias.length + 1} className={`${input} mt-1 w-full`} /></label>
            <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-carbon"><input type="checkbox" name="inNav" /> En la barra</label>
          </div>
        </FormAccion>
      </section>

      <ul className="mt-6 space-y-2">
        {categorias.map((c) => (
          <li key={c.id} className="border border-hielo bg-white p-4">
            {esAdmin ? (
              <FormAccion action={actualizarCategoriaAction} textoBoton="Guardar" variante="secundario" compacto className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={c.id} />
                <span className="mb-2 h-8 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <label className={label}>Nombre<input name="name" defaultValue={c.name} className={`${input} mt-1 w-44`} /></label>
                <span className="pb-2 text-xs text-gris">/seccion/{c.slug}</span>
                <label className={label}>Color<input name="color" type="color" defaultValue={c.color} className={`${input} mt-1 h-10 w-16 p-1`} /></label>
                <label className={label}>Orden<input name="order" type="number" defaultValue={c.order} className={`${input} mt-1 w-20`} /></label>
                <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-carbon"><input type="checkbox" name="inNav" defaultChecked={c.inNav} /> En la barra</label>
              </FormAccion>
            ) : (
              // Editor: puede crear secciones nuevas, pero la edición de las
              // existentes (nombre, color, orden, barra) es de ADMIN
              <div className="flex flex-wrap items-center gap-3">
                <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm font-semibold text-carbon">{c.name}</span>
                <span className="text-xs text-gris">/seccion/{c.slug}</span>
                <span className="text-xs text-gris">· orden {c.order}</span>
                {c.inNav && <span className="rounded-full bg-hielo px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-azul">En la barra</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
