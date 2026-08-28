"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Media } from "@/lib/admin-api";
import { SelectorMedia } from "../media/SelectorMedia";
import { ImagenExtension } from "./ImagenExtension";

/**
 * Editor del cuerpo de la nota: Tiptap (ProseMirror) configurado con
 * EXACTAMENTE los nodos y marcas que el backend acepta (DocSchema en
 * src/domain/content.ts): párrafo, H2/H3, cita, listas, salto de línea,
 * negrita, cursiva, link http(s). Lo demás del StarterKit está apagado para
 * que el editor no pueda producir un documento que el backend rechace.
 *
 * Emite el JSON de ProseMirror en cada cambio; el guardado (autosave) lo
 * decide el padre.
 */
type BotonBarraProps = {
  on?: boolean;
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  editable: boolean;
};

/** Botón de la barra de herramientas (a nivel de módulo: no se recrea en cada render). */
function BotonBarra({ on, label, title, onClick, disabled, editable }: BotonBarraProps) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={on}
      disabled={disabled || !editable}
      onMouseDown={(e) => e.preventDefault()} // no robar el foco al editor
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-bold transition-colors disabled:opacity-40 ${
        on ? "bg-azul text-white" : "text-carbon hover:bg-hielo"
      }`}
    >
      {label}
    </button>
  );
}

export function CuerpoTiptap({
  contenido,
  onChange,
  editable = true,
}: {
  contenido: unknown;
  onChange: (doc: unknown, texto: string) => void;
  editable?: boolean;
}) {
  const editor = useEditor({
    // Next renderiza en el servidor: el editor sólo se instancia en el cliente
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({
        placeholder: "Escribí el cuerpo de la nota. Enter = nuevo párrafo; Shift+Enter = salto de línea.",
      }),
      ImagenExtension,
    ],
    content: (contenido as object) ?? { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class:
          "prose-fdn min-h-[24rem] px-1 py-2 text-[17px] leading-[1.8] text-carbon outline-none",
      },
    },
    // JSON.parse(JSON.stringify(...)) no es redundante: ProseMirror crea los
    // `attrs` de cada nodo con Object.create(null), y React Flight (la
    // serialización de las server actions) sólo manda objetos planos con
    // prototipo Object — a los demás los reemplaza por una referencia temporal
    // ("$T") y el servidor recibe los attrs vacíos. El round-trip por JSON los
    // convierte en objetos planos.
    onUpdate: ({ editor }) =>
      onChange(JSON.parse(JSON.stringify(editor.getJSON())) as unknown, editor.getText()),
  });

  const [eligiendoImagen, setEligiendoImagen] = useState(false);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Estado reactivo de la barra (isActive) sin re-renderizar en cada tecla
  const activo = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            quote: e.isActive("blockquote"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return <div className="min-h-[24rem] animate-pulse rounded bg-hielo/60" />;
  }

  const insertarImagen = (m: Media) => {
    setEligiendoImagen(false);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          mediaId: m.id,
          src: m.url,
          alt: m.alt,
          caption: m.caption,
          width: m.width,
          height: m.height,
        },
      })
      .run();
  };

  const setLink = () => {
    const previa = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("URL del enlace (http/https):", previa);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };


  return (
    <div className="rounded border border-azul/15 bg-white focus-within:border-azul-medio">
      <div className="flex flex-wrap items-center gap-1 border-b border-hielo px-2 py-1.5">
        <BotonBarra editable={editable} on={activo?.bold} label="N" title="Negrita (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} />
        <BotonBarra editable={editable} on={activo?.italic} label="K" title="Cursiva (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} />
        <span className="mx-1 h-4 w-px bg-azul/15" />
        <BotonBarra editable={editable} on={activo?.h2} label="H2" title="Subtítulo" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <BotonBarra editable={editable} on={activo?.h3} label="H3" title="Subtítulo menor" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <BotonBarra editable={editable} on={activo?.quote} label="“ ”" title="Cita" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <span className="mx-1 h-4 w-px bg-azul/15" />
        <BotonBarra editable={editable} on={activo?.bullet} label="• Lista" title="Lista con viñetas" onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <BotonBarra editable={editable} on={activo?.ordered} label="1. Lista" title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <span className="mx-1 h-4 w-px bg-azul/15" />
        <BotonBarra editable={editable} on={activo?.link} label="Enlace" title="Insertar / quitar enlace" onClick={setLink} />
        <BotonBarra editable={editable} label="Imagen" title="Insertar una imagen de la biblioteca" onClick={() => setEligiendoImagen(true)} />
        <span className="ml-auto flex gap-1">
          <BotonBarra editable={editable} label="↶" title="Deshacer" disabled={!activo?.canUndo} onClick={() => editor.chain().focus().undo().run()} />
          <BotonBarra editable={editable} label="↷" title="Rehacer" disabled={!activo?.canRedo} onClick={() => editor.chain().focus().redo().run()} />
        </span>
      </div>
      <EditorContent editor={editor} className="px-4 py-2" />
      <SelectorMedia abierto={eligiendoImagen} onCerrar={() => setEligiendoImagen(false)} onElegir={insertarImagen} />
    </div>
  );
}
