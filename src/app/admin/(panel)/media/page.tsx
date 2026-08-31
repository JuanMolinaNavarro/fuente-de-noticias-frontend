import { esEditor, requireSession } from "@/lib/auth";
import { listarMedia } from "@/lib/admin-api";
import { FormAccion } from "@/components/admin/FormAccion";
import { Paginacion } from "@/components/admin/Bandeja";
import { Uploader } from "@/components/admin/media/Uploader";
import { IcoLupa } from "@/components/admin/Iconos";
import { fechaCorta } from "@/lib/fechas";
import { borrarMediaFormAction, editarMediaFormAction } from "./actions";

export const dynamic = "force-dynamic";

const input =
  "mt-1 w-full rounded border border-azul/15 bg-white px-2.5 py-1.5 text-xs text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

export default async function Medios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { token, user } = await requireSession();
  const puedeBorrar = esEditor(user.role);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { medios, total, totalPages } = await listarMedia(token, { q: sp.q, page });

  const hrefDe = (n: number) => {
    const q = new URLSearchParams();
    if (sp.q) q.set("q", sp.q);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return `/admin/media${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Redacción</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Biblioteca de medios</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">
        Fotos propias o con licencia, con alt y epígrafe. Las imágenes de los feeds no se publican nunca.
        Un editor puede borrar una foto sólo si no es la destacada de ninguna nota.
      </p>

      <section className="mt-6">
        <Uploader />
      </section>

      <form method="get" className="mt-8 flex flex-wrap items-center gap-2">
        <label className="relative max-sm:w-full">
          <IcoLupa className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gris" />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por epígrafe o alt…" className="w-80 max-w-full rounded border border-azul/15 bg-white py-2 pl-8 pr-3 text-xs text-carbon outline-none focus:border-azul-medio" />
        </label>
        <button className="rounded border border-azul/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-azul hover:border-azul-medio">Buscar</button>
        <span className="ml-auto text-xs text-gris">{total} imagen{total === 1 ? "" : "es"}</span>
      </form>

      {medios.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-azul/15 bg-white px-5 py-10 text-center text-sm text-gris">
          {sp.q ? "No hay imágenes que coincidan." : "Todavía no hay imágenes. Subí la primera arriba."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medios.map((m) => (
            <li key={m.id} className="overflow-hidden border border-hielo bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbUrl ?? m.url} alt={m.alt ?? ""} className="aspect-[4/3] w-full object-cover" />
              <div className="p-3">
                <p className="text-[10px] text-gris">
                  {m.width}×{m.height} · {(m.bytes / 1024).toFixed(0)} KB · {m.uploadedBy?.name ?? "—"} · {fechaCorta(m.createdAt)}
                </p>
                <FormAccion action={editarMediaFormAction} textoBoton="Guardar" variante="secundario" compacto className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={m.id} />
                  <label className={label}>Alt<input name="alt" defaultValue={m.alt ?? ""} className={input} /></label>
                  <label className={label}>Epígrafe<input name="caption" defaultValue={m.caption ?? ""} className={input} /></label>
                </FormAccion>
                {puedeBorrar && (
                  <FormAccion action={borrarMediaFormAction} textoBoton="Borrar" variante="secundario" compacto className="mt-2">
                    <input type="hidden" name="id" value={m.id} />
                  </FormAccion>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Paginacion actual={page} totalPaginas={totalPages} hrefDe={hrefDe} />
    </div>
  );
}
