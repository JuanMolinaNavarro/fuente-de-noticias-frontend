import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { Isotipo } from "@/components/Masthead";
import { logoutAction, reviewAction, unpublishAction } from "./actions";

export const dynamic = "force-dynamic";

function Contador({ label, value, alerta }: { label: string; value: number; alerta?: boolean }) {
  return (
    <div className="border border-borde bg-panel px-5 py-4">
      <p className={`text-3xl font-bold ${alerta && value > 0 ? "text-urgente" : "text-tiza"}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-tiza/50">
        {label}
      </p>
    </div>
  );
}

export default async function Admin() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [drafts, ingested, approved, rejected] = await Promise.all([
    prisma.article.findMany({ where: { status: "DRAFT" }, orderBy: { fetchedAt: "desc" } }),
    prisma.article.count({ where: { status: "INGESTED" } }),
    prisma.article.findMany({
      where: { status: "APPROVED" },
      orderBy: { publishedAt: "desc" },
      take: 15,
    }),
    prisma.article.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="min-h-screen bg-carbon text-tiza">
      <header className="border-b border-borde">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Isotipo size={38} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-azul-claro">
                Sala de redacción
              </p>
              <h1 className="font-display text-2xl font-bold">
                Fuente de Noticias
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-widest text-tiza/60 hover:text-azul-claro"
            >
              Ver sitio →
            </Link>
            <form action={logoutAction}>
              <button className="border border-borde px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-tiza/60 hover:border-azul-claro hover:text-azul-claro">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Contador label="Borradores por revisar" value={drafts.length} alerta />
          <Contador label="Ingresados sin procesar" value={ingested} />
          <Contador label="Publicadas" value={approved.length} />
          <Contador label="Rechazadas" value={rejected} />
        </div>

        {ingested > 0 && (
          <p className="mt-4 border border-borde bg-panel px-4 py-3 text-xs text-tiza/70">
            Hay {ingested} artículos ingresados sin procesar. Corré{" "}
            <span className="font-semibold text-azul-claro">npm run ingest</span>{" "}
            para pasarlos a borrador (con ANTHROPIC_API_KEY los redacta la IA).
          </p>
        )}

        <h2 className="mt-10 text-xs font-bold uppercase tracking-[0.25em] text-azul-claro">
          ▍Borradores pendientes de aprobación
        </h2>

        {drafts.length === 0 && (
          <p className="mt-4 text-base text-tiza/50">
            No hay borradores pendientes. Corré la ingesta para traer noticias
            nuevas.
          </p>
        )}

        <div className="mt-4 space-y-6">
          {drafts.map((d) => (
            <details
              key={d.id}
              className="group border border-borde bg-panel open:border-azul-medio"
            >
              <summary className="flex cursor-pointer items-baseline justify-between gap-4 px-5 py-4">
                <span className="font-display text-lg font-bold leading-snug">
                  {d.title ?? d.originalTitle}
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-tiza/40">
                  {d.sourceName}
                </span>
              </summary>

              <div className="grid gap-6 border-t border-borde px-5 py-5 lg:grid-cols-2">
                {/* Original */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-tiza/40">
                    Original — {d.sourceName}
                  </p>
                  <p className="mt-3 text-base font-semibold">
                    {d.originalTitle}
                  </p>
                  <p className="mt-2 max-h-56 overflow-y-auto pr-2 text-sm font-light leading-relaxed text-tiza/70">
                    {d.originalContent || "(el feed no trajo cuerpo de texto)"}
                  </p>
                  <p className="mt-3 space-x-4 text-xs">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-azul-claro underline underline-offset-2"
                    >
                      Ver nota original
                    </a>
                    {d.originalImageUrl && (
                      <a
                        href={d.originalImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tiza/50 underline underline-offset-2"
                      >
                        Imagen del feed (no publicar sin licencia)
                      </a>
                    )}
                  </p>
                </div>

                {/* Versión editable */}
                <form action={reviewAction} className="space-y-3">
                  <input type="hidden" name="id" value={d.id} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-azul-claro">
                    Nota curada (editable)
                  </p>
                  <input
                    name="title"
                    defaultValue={d.title ?? ""}
                    placeholder="Título"
                    className="w-full border border-borde bg-carbon px-3 py-2 text-base text-tiza outline-none focus:border-azul-claro"
                  />
                  <textarea
                    name="summary"
                    defaultValue={d.summary ?? ""}
                    placeholder="Bajada"
                    rows={2}
                    className="w-full border border-borde bg-carbon px-3 py-2 text-sm text-tiza outline-none focus:border-azul-claro"
                  />
                  <textarea
                    name="content"
                    defaultValue={d.content ?? ""}
                    placeholder="Cuerpo de la nota"
                    rows={9}
                    className="w-full border border-borde bg-carbon px-3 py-2 text-sm font-light leading-relaxed text-tiza outline-none focus:border-azul-claro"
                  />
                  <div className="flex gap-3">
                    <input
                      name="category"
                      defaultValue={d.category ?? ""}
                      placeholder="Categoría (Tucumán, Política, Policial, Economía, Deportes, Cultura, Urgente)"
                      className="w-1/2 border border-borde bg-carbon px-3 py-2 text-xs text-tiza outline-none focus:border-azul-claro"
                    />
                    <input
                      name="imageUrl"
                      defaultValue={d.imageUrl ?? ""}
                      placeholder="URL de imagen propia o con licencia (opcional)"
                      className="flex-1 border border-borde bg-carbon px-3 py-2 text-xs text-tiza outline-none focus:border-azul-claro"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      name="intent"
                      value="approve"
                      className="bg-azul-medio px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-azul-claro"
                    >
                      ✓ Aprobar y publicar
                    </button>
                    <button
                      name="intent"
                      value="save"
                      className="border border-borde px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-tiza hover:border-tiza"
                    >
                      Guardar cambios
                    </button>
                    <button
                      name="intent"
                      value="reject"
                      className="border border-borde px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-tiza/50 hover:border-urgente hover:text-urgente"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </form>
              </div>
            </details>
          ))}
        </div>

        {approved.length > 0 && (
          <>
            <h2 className="mt-12 text-xs font-bold uppercase tracking-[0.25em] text-azul-claro">
              ▍Últimas publicadas
            </h2>
            <ul className="mt-4 divide-y divide-borde border border-borde bg-panel">
              {approved.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/noticia/${a.slug}`}
                      className="truncate font-display text-base font-bold hover:text-azul-claro"
                    >
                      {a.title}
                    </Link>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-tiza/40">
                      {a.category ?? "Sin categoría"} · {a.sourceName}
                    </p>
                  </div>
                  <form action={unpublishAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="shrink-0 border border-borde px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-tiza/50 hover:border-urgente hover:text-urgente">
                      Despublicar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
