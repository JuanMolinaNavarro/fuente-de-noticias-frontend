import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listarAuditoria } from "@/lib/admin-api";
import { Paginacion } from "@/components/admin/Bandeja";
import { fechaCorta } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const ACCIONES: Record<string, string> = {
  create: "creó",
  update: "editó",
  correct: "corrigió",
  submit: "envió a revisión",
  return: "devolvió",
  publish: "publicó",
  unschedule: "desprogramó",
  unpublish: "despublicó",
  spike: "descartó",
  restore: "restauró",
  restoreRevision: "restauró una versión de",
  setPassword: "blanqueó la contraseña de",
  changePassword: "cambió su contraseña",
};
const ENTIDADES: Record<string, string> = {
  article: "la nota",
  user: "el usuario",
  feed: "el feed",
  category: "la sección",
};

export default async function Actividad({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string; userId?: string }>;
}) {
  const { token } = await requireSession("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { eventos, totalPages, total } = await listarAuditoria(token, {
    page,
    entity: sp.entity,
    userId: sp.userId,
  });

  const hrefDe = (n: number) => {
    const q = new URLSearchParams();
    if (sp.entity) q.set("entity", sp.entity);
    if (sp.userId) q.set("userId", sp.userId);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return `/admin/actividad${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Gestión</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Actividad</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">Bitácora de todo lo que hizo la redacción. {total} eventos.</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {[undefined, "article", "user", "feed", "category"].map((e) => (
          <Link
            key={e ?? "todo"}
            href={e ? `/admin/actividad?entity=${e}` : "/admin/actividad"}
            className={`rounded-full border px-3 py-1 font-bold uppercase tracking-widest ${
              (sp.entity ?? undefined) === e ? "border-azul bg-azul text-white" : "border-azul/15 text-gris hover:text-azul"
            }`}
          >
            {e ? ENTIDADES[e] : "Todo"}
          </Link>
        ))}
      </div>

      <ul className="mt-4 overflow-hidden border border-hielo bg-white">
        {eventos.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-hielo px-4 py-2.5 text-sm last:border-b-0">
            <span className="w-32 shrink-0 text-[11px] text-gris">{fechaCorta(ev.createdAt)}</span>
            <span className="font-semibold text-carbon">{ev.user?.name ?? "Sistema"}</span>
            <span className="text-gris-oscuro">{ACCIONES[ev.action] ?? ev.action}</span>
            {ev.action !== "changePassword" && (
              <span className="text-gris-oscuro">
                {ENTIDADES[ev.entity] ?? ev.entity}{" "}
                {ev.entity === "article" ? (
                  <Link href={`/admin/notas/${ev.entityId}`} className="font-mono text-xs text-azul-medio hover:underline">
                    {ev.entityId.slice(-6)}
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-gris">{ev.entityId.slice(-6)}</span>
                )}
              </span>
            )}
            {ev.diff != null && (
              <details className="ml-auto text-[10px] text-gris">
                <summary className="cursor-pointer">detalle</summary>
                <pre className="mt-1 max-w-md overflow-x-auto rounded bg-hielo/60 p-2 text-[10px]">{JSON.stringify(ev.diff, null, 1)}</pre>
              </details>
            )}
          </li>
        ))}
      </ul>
      <Paginacion actual={page} totalPaginas={totalPages} hrefDe={hrefDe} />
    </div>
  );
}
