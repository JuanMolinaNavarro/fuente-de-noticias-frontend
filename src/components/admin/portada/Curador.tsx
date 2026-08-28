"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BorradorPortada, NotaFila, SlotPortada, VersionPortada, ZonaPortada } from "@/lib/admin-api";
import { fechaCorta } from "@/lib/fechas";
import {
  buscarPublicadasAction,
  fijarZonaAction,
  publicarPortadaAction,
  republicarPortadaAction,
} from "@/app/admin/(panel)/portada/actions";
import { IcoLupa } from "../Iconos";
import { Fecha } from "../Fecha";

/**
 * Curador de portada (patrón "Fronts"): tres zonas con cupo, arrastrar desde
 * la lista de publicadas o entre zonas, reordenar, quitar; cada cambio se
 * guarda en el BORRADOR; "Publicar portada" congela una versión que es la que
 * ve el lector. Las zonas que queden cortas se rellenan solas con lo último.
 */

type Item = { id: string; nota: SlotPortada["article"] };
type Zonas = Record<ZonaPortada, Item[]>;

const ZONAS: { key: ZonaPortada; label: string; ayuda: string }[] = [
  { key: "PRINCIPAL", label: "Principal", ayuda: "La nota grande de arriba" },
  { key: "DESTACADAS", label: "Lo último", ayuda: "Grilla de 6 con foto" },
  { key: "MAS_NOTICIAS", label: "Más noticias", ayuda: "Listado compacto de 12" },
];

function desdeBorrador(b: BorradorPortada): Zonas {
  return {
    PRINCIPAL: b.zonas.PRINCIPAL.map((s) => ({ id: s.article.id, nota: s.article })),
    DESTACADAS: b.zonas.DESTACADAS.map((s) => ({ id: s.article.id, nota: s.article })),
    MAS_NOTICIAS: b.zonas.MAS_NOTICIAS.map((s) => ({ id: s.article.id, nota: s.article })),
  };
}

function filaANota(n: NotaFila): SlotPortada["article"] {
  return {
    id: n.id,
    slug: n.slug,
    kicker: n.kicker,
    title: n.title,
    summary: n.summary,
    category: n.categoryRef?.name ?? null,
    imageUrl: n.imageUrl,
    featuredMedia: n.featuredMedia ? { thumbUrl: n.featuredMedia.thumbUrl, url: n.featuredMedia.url } : null,
    publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
    status: n.status,
    sourceName: n.source?.sourceName ?? null,
    authors: [],
  };
}

/* ── Tarjeta arrastrable ─────────────────────────────────────────────── */

function TarjetaCurada({
  item,
  zona,
  onQuitar,
  arrastrando = false,
}: {
  item: Item;
  zona?: ZonaPortada;
  onQuitar?: () => void;
  arrastrando?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { zona },
  });
  const n = item.nota;
  const img = n.featuredMedia?.thumbUrl ?? n.featuredMedia?.url ?? n.imageUrl;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded border bg-white p-2 text-xs ${
        isDragging || arrastrando ? "opacity-60 ring-2 ring-azul-medio" : "border-hielo"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded px-1 text-gris hover:text-azul active:cursor-grabbing"
        title="Arrastrar"
        aria-label="Arrastrar"
      >
        ⋮⋮
      </button>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="h-9 w-12 shrink-0 rounded object-cover" />
      ) : (
        <span className="h-9 w-12 shrink-0 rounded bg-hielo" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-carbon">{n.title ?? "(sin título)"}</span>
        <span className="block truncate text-[10px] text-gris">
          {n.category ?? "Sin sección"} · {n.publishedAt ? fechaCorta(new Date(n.publishedAt)) : "—"}
          {n.status !== "PUBLISHED" && <span className="ml-1 font-bold text-violet-700">{n.status}</span>}
        </span>
      </span>
      {onQuitar && (
        <button type="button" onClick={onQuitar} className="rounded px-1.5 text-gris hover:text-urgente" title="Quitar de la zona" aria-label="Quitar">
          ✕
        </button>
      )}
    </div>
  );
}

/* ── Zona (droppable + sortable) ─────────────────────────────────────── */

function Zona({
  zona,
  label,
  ayuda,
  items,
  cupo,
  onQuitar,
}: {
  zona: ZonaPortada;
  label: string;
  ayuda: string;
  items: Item[];
  cupo: number;
  onQuitar: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `zona:${zona}`, data: { zona } });
  return (
    <section className={`rounded border bg-hielo/30 p-3 ${isOver ? "border-azul-medio" : "border-hielo"}`}>
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">{label}</h3>
        <span className={`text-[10px] ${items.length > cupo ? "font-bold text-urgente" : "text-gris"}`}>
          {items.length}/{cupo} · {ayuda}
        </span>
      </header>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-[3.5rem] space-y-1.5">
          {items.map((it) => (
            <TarjetaCurada key={it.id} item={it} zona={zona} onQuitar={() => onQuitar(it.id)} />
          ))}
          {items.length === 0 && (
            <p className="rounded border border-dashed border-azul/15 px-3 py-3 text-center text-[11px] text-gris">
              Vacío: se rellena con lo último publicado. Arrastrá una nota acá para curarla.
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

/* ── Curador ─────────────────────────────────────────────────────────── */

export function Curador({ inicial, versiones: versionesIniciales }: { inicial: BorradorPortada; versiones: VersionPortada[] }) {
  const [zonas, setZonas] = useState<Zonas>(() => desdeBorrador(inicial));
  const [cupos] = useState(inicial.cupos);
  const [meta, setMeta] = useState({ ultima: inicial.ultimaVersion, sinPublicar: inicial.cambiosSinPublicar });
  const [versiones, setVersiones] = useState(versionesIniciales);
  const [q, setQ] = useState("");
  const [candidatas, setCandidatas] = useState<Item[]>([]);
  const [activo, setActivo] = useState<Item | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Mouse/touch + teclado (Espacio para tomar, flechas para mover, Espacio
  // para soltar): accesible y además la única forma fiable de automatizar.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Candidatas: publicadas, con búsqueda (debounce)
  useEffect(() => {
    let vivo = true;
    const t = setTimeout(async () => {
      const r = await buscarPublicadasAction(q);
      if (!vivo) return;
      if (r.ok) setCandidatas(r.data.map((n) => ({ id: n.id, nota: filaANota(n) })));
      else setMensaje({ tipo: "error", texto: r.error });
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [q]);

  const enZonas = new Set(Object.values(zonas).flat().map((i) => i.id));
  const disponibles = candidatas.filter((c) => !enZonas.has(c.id));

  /** Persiste una zona en el borrador del servidor. */
  const guardarZona = async (zona: ZonaPortada, items: Item[]) => {
    setOcupado(true);
    const r = await fijarZonaAction(zona, items.map((i) => i.id));
    setOcupado(false);
    if (r.ok) {
      setZonas(desdeBorrador(r.data));
      setMeta({ ultima: r.data.ultimaVersion, sinPublicar: r.data.cambiosSinPublicar });
      setMensaje(null);
    } else {
      setMensaje({ tipo: "error", texto: r.error });
    }
  };

  const zonaDe = (id: string): ZonaPortada | null =>
    (Object.keys(zonas) as ZonaPortada[]).find((z) => zonas[z].some((i) => i.id === id)) ?? null;

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const it = Object.values(zonas).flat().find((i) => i.id === id) ?? candidatas.find((c) => c.id === id) ?? null;
    setActivo(it);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActivo(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    const origen = zonaDe(id);
    const destino: ZonaPortada | null = overId.startsWith("zona:")
      ? (overId.slice(5) as ZonaPortada)
      : zonaDe(overId);
    if (!destino) return;

    const item = (origen ? zonas[origen].find((i) => i.id === id) : candidatas.find((c) => c.id === id)) ?? null;
    if (!item) return;

    const nuevo: Zonas = { ...zonas, [destino]: [...zonas[destino]] };
    if (origen) nuevo[origen] = nuevo[origen].filter((i) => i.id !== id);
    // posición: antes del elemento sobre el que se soltó, o al final
    const idx = overId.startsWith("zona:") ? nuevo[destino].length : nuevo[destino].findIndex((i) => i.id === overId);
    const sinElla = nuevo[destino].filter((i) => i.id !== id);
    sinElla.splice(idx < 0 ? sinElla.length : idx, 0, item);
    nuevo[destino] = sinElla;

    if (nuevo[destino].length > cupos[destino]) {
      setMensaje({ tipo: "error", texto: `La zona admite hasta ${cupos[destino]} notas. Quitá una antes.` });
      return;
    }
    setZonas(nuevo);
    // Guardar destino (y origen si cambió de zona): el backend quita de las otras zonas solo
    await guardarZona(destino, nuevo[destino]);
    if (origen && origen !== destino) await guardarZona(origen, nuevo[origen]);
  };

  const quitar = async (zona: ZonaPortada, id: string) => {
    const items = zonas[zona].filter((i) => i.id !== id);
    setZonas({ ...zonas, [zona]: items });
    await guardarZona(zona, items);
  };

  const publicar = async () => {
    setOcupado(true);
    const r = await publicarPortadaAction();
    setOcupado(false);
    if (r.ok) {
      setMeta({ ultima: { id: r.data.id, publishedAt: r.data.publishedAt, publishedBy: r.data.publishedBy }, sinPublicar: false });
      setVersiones((v) => [r.data, ...v]);
      setMensaje({ tipo: "ok", texto: "Portada publicada. Ya está visible en el sitio." });
    } else setMensaje({ tipo: "error", texto: r.error });
  };

  const republicar = async (v: VersionPortada) => {
    if (!window.confirm(`¿Volver a la portada del ${fechaCorta(new Date(v.publishedAt))}? Se publica como versión nueva.`)) return;
    setOcupado(true);
    const r = await republicarPortadaAction(v.id);
    setOcupado(false);
    if (r.ok) {
      window.location.reload();
    } else setMensaje({ tipo: "error", texto: r.error });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="mb-4 flex flex-wrap items-center gap-3 border border-hielo bg-white px-4 py-3">
        <span className="text-xs text-gris">
          {meta.ultima ? (
            <>
              Última portada publicada: <Fecha d={new Date(meta.ultima.publishedAt)} /> por {meta.ultima.publishedBy?.name ?? "—"}.
            </>
          ) : (
            "Todavía no se publicó ninguna portada curada: el sitio muestra lo último publicado."
          )}
        </span>
        {meta.sinPublicar && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-800">
            Cambios sin publicar
          </span>
        )}
        <button
          type="button"
          onClick={publicar}
          disabled={ocupado}
          className="ml-auto rounded bg-azul-medio px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-azul disabled:opacity-50"
        >
          Publicar portada
        </button>
      </div>
      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`mb-4 rounded border px-4 py-3 text-sm font-semibold ${
            mensaje.tipo === "error" ? "border-urgente/40 bg-urgente/5 text-urgente" : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {ZONAS.map((z) => (
            <Zona key={z.key} zona={z.key} label={z.label} ayuda={z.ayuda} items={zonas[z.key]} cupo={cupos[z.key]} onQuitar={(id) => quitar(z.key, id)} />
          ))}

          {versiones.length > 0 && (
            <details className="border border-hielo bg-white p-3 text-xs">
              <summary className="cursor-pointer font-bold uppercase tracking-[0.2em] text-gris">Versiones publicadas ({versiones.length})</summary>
              <ul className="mt-2 space-y-1">
                {versiones.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between gap-3">
                    <span>
                      <Fecha d={new Date(v.publishedAt)} /> · {v.publishedBy?.name ?? "—"} · {v.snapshot.length} notas{i === 0 && " · actual"}
                    </span>
                    {i > 0 && (
                      <button type="button" onClick={() => republicar(v)} className="font-semibold text-azul-medio hover:underline">
                        Volver a esta
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="border border-hielo bg-white p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Publicadas</h3>
          <label className="relative mt-2 block">
            <IcoLupa className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gris" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-full rounded border border-azul/15 py-2 pl-8 pr-3 text-xs outline-none focus:border-azul-medio" />
          </label>
          <p className="mt-1 text-[10px] text-gris">Arrastrá a una zona. Las que ya están en la portada no aparecen.</p>
          <SortableContext items={disponibles.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-2 max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
              {disponibles.map((it) => (
                <TarjetaCurada key={it.id} item={it} />
              ))}
              {disponibles.length === 0 && <p className="py-4 text-center text-[11px] text-gris">Nada para mostrar.</p>}
            </div>
          </SortableContext>
        </aside>
      </div>

      <DragOverlay>{activo ? <TarjetaCurada item={activo} arrastrando /> : null}</DragOverlay>
    </DndContext>
  );
}
