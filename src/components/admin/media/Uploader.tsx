"use client";

import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/admin-api";
import { subirMediaAction } from "@/app/admin/(panel)/media/actions";

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Si algún día hay dos Uploaders montados a la vez (página + modal),
// sólo el último montado procesa el Ctrl+V para no duplicar la imagen.
const montados: symbol[] = [];

type Pendiente = {
  id: string;
  file: File;
  preview: string;
  alt: string;
  caption: string;
  estado: "edicion" | "subiendo" | "ok" | "error";
  error?: string;
};

const input =
  "mt-1 w-full rounded border border-azul/15 bg-white px-2.5 py-1.5 text-xs text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

/**
 * Subida con arrastrar y soltar o pegando desde el portapapeles (Ctrl+V).
 * Cada archivo queda "en edición" para
 * completar alt y epígrafe antes de confirmar. Se puede subir varias seguidas.
 */
export function Uploader({
  onSubida,
  compacto = false,
}: {
  onSubida?: (m: Media) => void;
  compacto?: boolean;
}) {
  const [items, setItems] = useState<Pendiente[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregar = (files: FileList | File[]) => {
    const nuevos: Pendiente[] = [...files]
      .filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        alt: "",
        caption: "",
        estado: "edicion",
      }));
    setItems((s) => [...s, ...nuevos]);
  };

  // Ctrl+V: el paste sólo llega a elementos con foco, así que escuchamos en
  // document mientras el componente está montado. Un paste de texto trae
  // clipboardData.files vacío y se ignora (no molesta a los inputs de alt/epígrafe).
  useEffect(() => {
    const id = Symbol("uploader");
    montados.push(id);
    const onPaste = (e: ClipboardEvent) => {
      if (montados[montados.length - 1] !== id) return;
      const imagenes = [...(e.clipboardData?.files ?? [])].filter((f) =>
        /^image\/(jpeg|png|webp)$/.test(f.type),
      );
      if (imagenes.length === 0) return;
      e.preventDefault();
      // El portapapeles entrega siempre "image.png": renombramos con fecha y hora
      const a = new Date();
      const p2 = (n: number) => String(n).padStart(2, "0");
      const sello = `${a.getFullYear()}-${p2(a.getMonth() + 1)}-${p2(a.getDate())}-${p2(a.getHours())}${p2(a.getMinutes())}${p2(a.getSeconds())}`;
      agregar(
        imagenes.map(
          (f, i) =>
            new File(
              [f],
              `pegada-${sello}${imagenes.length > 1 ? `-${i + 1}` : ""}.${EXTENSION[f.type] ?? "png"}`,
              { type: f.type },
            ),
        ),
      );
    };
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
      const i = montados.indexOf(id);
      if (i !== -1) montados.splice(i, 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (id: string, patch: Partial<Pendiente>) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const subir = async (it: Pendiente) => {
    set(it.id, { estado: "subiendo", error: undefined });
    const fd = new FormData();
    fd.append("file", it.file);
    if (it.alt.trim()) fd.append("alt", it.alt.trim());
    if (it.caption.trim()) fd.append("caption", it.caption.trim());
    const r = await subirMediaAction(fd);
    if (r.ok) {
      set(it.id, { estado: "ok" });
      onSubida?.(r.data);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== it.id)), 900);
    } else {
      set(it.id, { estado: "error", error: r.error });
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          agregar(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded border-2 border-dashed px-4 ${compacto ? "py-4" : "py-8"} text-center text-sm transition-colors ${
          arrastrando ? "border-azul-medio bg-hielo/60" : "border-azul/20 bg-white hover:border-azul-medio"
        }`}
      >
        <p className="font-semibold text-azul">Arrastrá imágenes acá, pegá con Ctrl+V o hacé clic para elegir</p>
        <p className="mt-1 text-xs text-gris">JPG, PNG o WebP · hasta 8 MB · se convierten a WebP optimizado</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && agregar(e.target.files)}
        />
      </div>

      {items.map((it) => (
        <div key={it.id} className="flex gap-3 border border-hielo bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.preview} alt="" className="h-24 w-32 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-gris">{it.file.name} · {(it.file.size / 1024).toFixed(0)} KB</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={label}>
                Alt (qué se ve)
                <input value={it.alt} onChange={(e) => set(it.id, { alt: e.target.value })} placeholder="Para accesibilidad y buscadores" className={input} disabled={it.estado === "subiendo"} />
              </label>
              <label className={label}>
                Epígrafe
                <input value={it.caption} onChange={(e) => set(it.id, { caption: e.target.value })} placeholder="Lo que se lee debajo de la foto" className={input} disabled={it.estado === "subiendo"} />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={it.estado === "subiendo" || it.estado === "ok"}
                onClick={() => subir(it)}
                className="rounded bg-azul-medio px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-azul disabled:opacity-50"
              >
                {it.estado === "subiendo" ? "Subiendo…" : it.estado === "ok" ? "✓ Lista" : "Subir a la biblioteca"}
              </button>
              <button type="button" onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))} className="text-xs text-gris hover:text-urgente">
                Quitar
              </button>
              {it.error && <span role="alert" className="text-xs font-semibold text-urgente">{it.error}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
