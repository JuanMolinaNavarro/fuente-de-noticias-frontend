import { listarNotas } from "@/lib/api";
import { SITE_URL } from "@/lib/env";
import { SITIO } from "@/lib/sitio";

/**
 * Feed RSS propio en /rss.xml: la contracara de la ingesta — así como el
 * diario consume feeds de otros medios, publica el suyo para lectores y
 * agregadores.
 *
 * Vive en el frontend (y no como endpoint de Nest) a propósito:
 * - Necesita URLs públicas absolutas (SITE_URL) y presentación: es capa de
 *   presentación, no de dominio.
 * - Reutiliza listarNotas() con su Data Cache y tags: el feed se invalida
 *   con el mismo updateTag que la portada cuando el panel publica.
 * - No obliga a exponer otra ruta del backend a través del proxy; el API
 *   sigue siendo privado salvo /uploads.
 */

/** Escapes mínimos para meter texto libre dentro de XML sin romperlo. */
function xml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const { notas } = await listarNotas({ limit: 30 }).catch(() => ({
    notas: [],
    total: 0,
  }));

  const items = notas
    .filter((n) => n.slug && n.title)
    .map((n) => {
      const url = `${SITE_URL}/noticia/${n.slug}`;
      const partes = [
        `    <item>`,
        `      <title>${xml(n.title!)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
      ];
      if (n.summary) partes.push(`      <description>${xml(n.summary)}</description>`);
      if (n.publishedAt)
        partes.push(`      <pubDate>${n.publishedAt.toUTCString()}</pubDate>`);
      if (n.category) partes.push(`      <category>${xml(n.category)}</category>`);
      partes.push(`    </item>`);
      return partes.join("\n");
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(SITIO.nombre)}</title>
    <link>${SITE_URL}</link>
    <description>${xml(SITIO.descripcion)}</description>
    <language>es-AR</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Cache HTTP para agregadores que consultan seguido; los datos por
      // debajo ya salen de la Data Cache de listarNotas (60 s + tags).
      "Cache-Control": "public, max-age=300",
    },
  });
}
