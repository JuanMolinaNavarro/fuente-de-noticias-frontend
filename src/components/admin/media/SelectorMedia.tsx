"use client";

import { useEffect, useState } from "react";
import type { Media } from "@/lib/admin-api";
import { buscarMediaAction } from "@/app/admin/(panel)/media/actions";
import { IcoLupa } from "../Iconos";
import { Uploader } from "./Uploader";

/**
 * Modal de biblioteca: buscar una imagen existente o subir una nueva, y
 * devolverla al que la pidió (imagen destacada o imagen en el cuerpo).
 * Reutilizar es la regla: la foto de archivo se busca, no se vuelve a subir.
 */
export function SelectorMedia({
  abierto,
  onCerrar,
  onElegir,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onElegir: (m: Media) => void;
}) {
  const [tab, setTab] = useState<"biblioteca" | "subir">("biblioteca");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [medios, setMedios] = useState<Media[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto || tab !== "biblioteca") return;
    let vivo = true;
    // El setState va dentro del timeout (no sincrónico en el efecto): evita
    // renders en cascada y además funciona como debounce de la búsqueda.
    const t = setTimeout(async () => {
      setCargando(true);
      const r = await buscarMediaAction(q, page);
      if (!vivo) return;
      setCargando(false);
      if (r.ok) {
        setMedios(r.data.medios);
        setTotalPages(r.data.totalPages);
        setError(null);
      } else setError(r.error);
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [abierto, tab, q, page]);

  useEffect(() => {
    if (!abierto) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Biblioteca de medios"
      className="fixed inset-0 z-50 flex items-center justify-center bg-noche/60 p-4"
      onClick={onCerrar}
    >
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded border border-hielo bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-hielo px-5 py-3">
          {(["biblioteca", "subir"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${tab === t ? "bg-azul text-white" : "text-gris hover:text-azul"}`}
            >
              {t === "biblioteca" ? "Biblioteca" : "Subir"}
            </button>
          ))}
          {tab === "biblioteca" && (
            <label className="relative ml-2 flex-1">
              <IcoLupa className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gris" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por epígrafe o alt…"
                className="w-full rounded border border-azul/15 bg-white py-2 pl-8 pr-3 text-sm text-carbon outline-none focus:border-azul-medio"
              />
            </label>
          )}
          <button type="button" onClick={onCerrar} className="ml-auto rounded px-2 py-1 text-gris hover:text-carbon" aria-label="Cerrar">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "subir" ? (
            <Uploader compacto onSubida={(m) => onElegir(m)} />
          ) : error ? (
            <p role="alert" className="text-sm text-urgente">{error}</p>
          ) : medios.length === 0 && !cargando ? (
            <p className="py-10 text-center text-sm text-gris">
              {q ? "No hay imágenes que coincidan." : "La biblioteca está vacía. Subí la primera."}
            </p>
          ) : (
            <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 ${cargando ? "opacity-50" : ""}`}>
              {medios.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onElegir(m)}
                    className="group w-full overflow-hidden rounded border border-hielo text-left transition-colors hover:border-azul-medio"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbUrl ?? m.url} alt={m.alt ?? ""} className="aspect-[4/3] w-full object-cover" />
                    <span className="block truncate px-2 py-1.5 text-[11px] text-gris-oscuro">{m.caption || m.alt || "(sin epígrafe)"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {tab === "biblioteca" && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-hielo px-5 py-2 text-xs">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-semibold text-azul-medio disabled:opacity-40">← Anterior</button>
            <span className="text-gris">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="font-semibold text-azul-medio disabled:opacity-40">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}
