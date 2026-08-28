import Link from "next/link";
import { requireSession, esEditor } from "@/lib/auth";
import { listarNotasAdmin, statsAdmin } from "@/lib/admin-api";
import { ESTADOS } from "@/components/admin/ChipEstado";
import { FilaNotaBandeja } from "@/components/admin/Bandeja";
import { IcoFlecha, IcoNueva } from "@/components/admin/Iconos";
import type { EstadoNota } from "@/lib/api";

export const dynamic = "force-dynamic";

function Contador({
  label,
  value,
  href,
  alerta,
}: {
  label: string;
  value: number;
  href: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group border border-hielo bg-white px-5 py-4 transition-colors hover:border-azul-medio"
    >
      <p
        className={`font-display text-3xl ${
          alerta && value > 0 ? "text-urgente" : "text-azul"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
        {label}
        <IcoFlecha className="opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </Link>
  );
}

export default async function Tablero({
  searchParams,
}: {
  searchParams: Promise<{ "sin-permiso"?: string }>;
}) {
  const { token, user } = await requireSession();
  const sp = await searchParams;
  const editor = esEditor(user.role);

  // Un redactor ve primero SUS notas; un editor, lo que espera revisión.
  const [stats, pendientes, recientes] = await Promise.all([
    statsAdmin(token),
    listarNotasAdmin(token, {
      status: editor ? "IN_REVIEW" : "DRAFT",
      ...(editor ? {} : { authorId: user.id }),
      limit: 8,
    }),
    listarNotasAdmin(token, { status: "PUBLISHED", limit: 6 }),
  ]);

  const tarjetas: { estado: EstadoNota; alerta?: boolean }[] = [
    { estado: "DRAFT" },
    { estado: "IN_REVIEW", alerta: editor },
    { estado: "SCHEDULED" },
    { estado: "PUBLISHED" },
    { estado: "INGESTED" },
    { estado: "SPIKED" },
  ];
  const clave: Record<EstadoNota, keyof typeof stats> = {
    DRAFT: "draft",
    IN_REVIEW: "inReview",
    SCHEDULED: "scheduled",
    PUBLISHED: "published",
    INGESTED: "ingested",
    SPIKED: "spiked",
  };

  return (
    <div className="mx-auto max-w-6xl">
      {sp["sin-permiso"] && (
        <p role="alert" className="mb-4 rounded border border-urgente/40 bg-urgente/5 px-4 py-3 text-sm font-semibold text-urgente">
          No tenés permiso para entrar a esa sección.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">
            Tablero
          </p>
          <h1 className="font-display text-3xl tracking-tight text-carbon">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <div className="regla-marca mt-3 w-20" />
        </div>
        <Link
          href="/admin/notas/nueva"
          className="inline-flex items-center gap-2 rounded bg-azul-medio px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-azul"
        >
          <IcoNueva /> Nueva nota
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tarjetas.map((t) => (
          <Contador
            key={t.estado}
            label={ESTADOS[t.estado].plural}
            value={stats[clave[t.estado]]}
            href={`/admin/notas?status=${t.estado}`}
            alerta={t.alerta}
          />
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.34em] text-azul-medio">
            {editor ? "01 — Esperan revisión" : "01 — Mis borradores"}
          </h2>
          <Link
            href={editor ? "/admin/notas?status=IN_REVIEW" : `/admin/notas?status=DRAFT&authorId=${user.id}`}
            className="text-xs font-semibold text-azul-medio hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {pendientes.notas.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-azul/15 bg-white px-5 py-8 text-center text-sm text-gris">
            {editor ? "Nada esperando revisión. Buen momento para mirar los borradores de la ingesta." : "No tenés borradores. Empezá una nota nueva."}
          </p>
        ) : (
          <ul className="mt-4 overflow-hidden border border-hielo bg-white">
            {pendientes.notas.map((n) => (
              <FilaNotaBandeja key={n.id} nota={n} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.34em] text-azul-medio">
            02 — Últimas publicadas
          </h2>
          <Link href="/admin/notas?status=PUBLISHED" className="text-xs font-semibold text-azul-medio hover:underline">
            Ver todas →
          </Link>
        </div>
        <ul className="mt-4 overflow-hidden border border-hielo bg-white">
          {recientes.notas.map((n) => (
            <FilaNotaBandeja key={n.id} nota={n} />
          ))}
        </ul>
      </section>
    </div>
  );
}
