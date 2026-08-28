"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

/**
 * Nodo `image` del cuerpo: referencia a la biblioteca (mediaId) + src + alt +
 * epígrafe. Espejo del ImageSchema del backend (src/domain/content.ts):
 * cualquier otra forma la rechaza el servidor. El attr `credit` se conserva
 * sólo por compatibilidad con documentos guardados; ya no se edita ni se muestra.
 *
 * Se edita con un node view de React: la imagen, y debajo el epígrafe como
 * input (puede ser distinto al de la biblioteca: la misma foto ilustra cosas
 * distintas). Es un bloque atómico: no tiene contenido interno editable, se
 * inserta y se borra entero.
 */
export interface ImagenAttrs {
  mediaId: string | null;
  src: string;
  alt: string | null;
  caption: string | null;
  /** legado: no se edita ni se muestra, sólo se preserva en docs viejos */
  credit: string | null;
  width: number | null;
  height: number | null;
}

function ImagenNodo({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const a = node.attrs as ImagenAttrs;
  const editable = editor.isEditable;
  return (
    <NodeViewWrapper as="figure" className={`my-6 ${selected ? "ring-2 ring-azul-medio ring-offset-2" : ""}`} data-drag-handle>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.src} alt={a.alt ?? ""} className="w-full rounded-xl" draggable={false} />
      <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        {editable ? (
          <>
            <input
              value={a.caption ?? ""}
              onChange={(e) => updateAttributes({ caption: e.target.value || null })}
              placeholder="Epígrafe (lo que se lee debajo de la foto)"
              className="min-w-[12rem] flex-1 border-0 border-b border-dashed border-azul/20 bg-transparent py-0.5 text-sm text-gris-oscuro outline-none focus:border-azul-medio"
            />
            <button
              type="button"
              onClick={deleteNode}
              className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gris hover:text-urgente"
              title="Quitar la imagen del cuerpo"
            >
              Quitar
            </button>
          </>
        ) : (
          <span className="text-sm text-gris-oscuro">{a.caption}</span>
        )}
      </figcaption>
    </NodeViewWrapper>
  );
}

export const ImagenExtension = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mediaId: { default: null },
      src: { default: "" },
      alt: { default: null },
      caption: { default: null },
      credit: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-image]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // Sólo para copiar/pegar dentro del editor; el sitio público renderiza
    // desde el JSON con CuerpoNota, nunca desde este HTML.
    return ["figure", mergeAttributes({ "data-image": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagenNodo);
  },
});
