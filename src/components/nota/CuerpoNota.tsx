/**
 * Render del cuerpo de una nota a partir del documento ProseMirror
 * (Article.contentJson) con componentes React — nunca dangerouslySetInnerHTML.
 *
 * El backend valida cada documento contra una lista blanca (DocSchema en
 * src/domain/content.ts): párrafo, H2/H3, cita, listas, salto, negrita,
 * cursiva y link http(s). Acá renderizamos exactamente eso; cualquier nodo
 * desconocido se ignora en silencio (defensa en profundidad).
 *
 * Fallback: si una nota vieja no tiene contentJson, se renderiza el texto
 * plano partido por doble salto de línea (el contrato anterior).
 */
import type { ReactNode } from "react";

type Mark = { type: string; attrs?: Record<string, unknown> };
type Nodo = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Nodo[];
  text?: string;
  marks?: Mark[];
};

function esDoc(x: unknown): x is Nodo {
  return !!x && typeof x === "object" && (x as Nodo).type === "doc";
}

function Inline({ nodos }: { nodos?: Nodo[] }) {
  if (!nodos) return null;
  return (
    <>
      {nodos.map((n, i) => {
        if (n.type === "hardBreak") return <br key={i} />;
        if (n.type !== "text") return null;
        let el: ReactNode = n.text;
        for (const m of n.marks ?? []) {
          if (m.type === "bold") el = <strong>{el}</strong>;
          else if (m.type === "italic") el = <em>{el}</em>;
          else if (m.type === "link") {
            const href = String(m.attrs?.href ?? "");
            if (/^https?:\/\//i.test(href)) {
              el = (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {el}
                </a>
              );
            }
          }
        }
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

function Bloque({ n }: { n: Nodo }) {
  switch (n.type) {
    case "paragraph":
      return (
        <p>
          <Inline nodos={n.content} />
        </p>
      );
    case "heading": {
      const nivel = n.attrs?.level === 3 ? "h3" : "h2";
      const H = nivel;
      return (
        <H>
          <Inline nodos={n.content} />
        </H>
      );
    }
    case "blockquote": {
      const quien = n.attrs?.attribution;
      return (
        <blockquote>
          {n.content?.map((p, i) => <Bloque key={i} n={p} />)}
          {typeof quien === "string" && quien && <footer>— {quien}</footer>}
        </blockquote>
      );
    }
    case "bulletList":
      return (
        <ul>
          {n.content?.map((li, i) => (
            <li key={i}>{li.content?.map((p, j) => <Bloque key={j} n={p} />)}</li>
          ))}
        </ul>
      );
    case "image": {
      const src = String(n.attrs?.src ?? "");
      if (!/^https?:\/\//i.test(src)) return null;
      const caption = typeof n.attrs?.caption === "string" ? n.attrs.caption : null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={typeof n.attrs?.alt === "string" ? n.attrs.alt : ""} loading="lazy" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    case "orderedList":
      return (
        <ol start={typeof n.attrs?.start === "number" ? n.attrs.start : undefined}>
          {n.content?.map((li, i) => (
            <li key={i}>{li.content?.map((p, j) => <Bloque key={j} n={p} />)}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export function CuerpoNota({
  contentJson,
  content,
  className = "",
}: {
  contentJson: unknown;
  content: string | null;
  className?: string;
}) {
  if (esDoc(contentJson) && contentJson.content?.length) {
    return (
      <div className={`prose-fdn ${className}`}>
        {contentJson.content.map((n, i) => (
          <Bloque key={i} n={n} />
        ))}
      </div>
    );
  }
  const parrafos = (content ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`prose-fdn ${className}`}>
      {parrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
