import { requireSession } from "@/lib/auth";
import { listarFeeds } from "@/lib/admin-api";
import { obtenerCategorias } from "@/lib/api";
import { FormAccion } from "@/components/admin/FormAccion";
import { actualizarFeedAction, correrIngestaAction, crearFeedAction } from "../gestion-actions";

export const dynamic = "force-dynamic";

const input =
  "rounded border border-azul/15 bg-white px-3 py-2 text-sm text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

export default async function Feeds() {
  const { token } = await requireSession("ADMIN");
  const [feeds, categorias] = await Promise.all([listarFeeds(token), obtenerCategorias()]);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Gestión</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Feeds RSS</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">
        La ingesta corre sola cada 30 minutos: trae hasta 6 notas nuevas por feed y crea un borrador
        con el material de la fuente. La sección fija se usa cuando el feed no trae categoría.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <section className="border border-hielo bg-white p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Nuevo feed</h2>
          <FormAccion action={crearFeedAction} textoBoton="Agregar" pendiente="Agregando…" limpiarAlOk className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
              <label className={label}>URL del feed<input name="url" type="url" required placeholder="https://…/rss" className={`${input} mt-1 w-full`} /></label>
              <label className={label}>Sección fija (opcional)
                <select name="categoryId" defaultValue="" className={`${input} mt-1 w-full`}>
                  <option value="">Según el feed</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
          </FormAccion>
        </section>
        <section className="border border-hielo bg-white p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Ingesta manual</h2>
          <p className="mt-2 text-xs text-gris">Puede tardar un rato si hay muchos ingresados sin redactar.</p>
          <FormAccion action={correrIngestaAction} textoBoton="Correr ingesta ahora" pendiente="Ingiriendo…" variante="secundario" className="mt-3" />
        </section>
      </div>

      <ul className="mt-6 space-y-3">
        {feeds.map((f) => (
          <li key={f.id} className={`border bg-white p-4 ${f.enabled ? "border-hielo" : "border-dashed border-gris/40 opacity-70"}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-carbon">{f.url}</p>
                <p className="text-xs text-gris">{f.category ? `Sección fija: ${f.category.name}` : "Sección según el feed"}{!f.enabled && " · DESHABILITADO"}</p>
              </div>
              <FormAccion action={actualizarFeedAction} textoBoton="Guardar" variante="secundario" compacto className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={f.id} />
                <label className={label}>Sección fija
                  <select name="categoryId" defaultValue={f.categoryId ?? ""} className={`${input} mt-1`}>
                    <option value="">Según el feed</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-carbon">
                  <input type="checkbox" name="enabled" defaultChecked={f.enabled} /> Habilitado
                </label>
              </FormAccion>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
