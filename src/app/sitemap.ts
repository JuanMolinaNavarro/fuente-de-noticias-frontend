import type { MetadataRoute } from "next";
import { apiFetch, obtenerCategorias, TAGS } from "@/lib/api";
import { SITE_URL } from "@/lib/env";

/**
 * Genera /sitemap.xml: el inventario de URLs que le entregamos a Google para
 * que descubra las notas sin tener que rastrear el sitio link por link.
 *
 * Los datos salen de la proyección liviana GET /articles/slugs (solo slug y
 * fechas, cap 1000 en el backend). Si el archivo histórico supera las 1000
 * notas, el paso siguiente es generateSitemaps() (sitemaps múltiples, soporte
 * nativo de Next) más paginación en el endpoint.
 *
 * Se cachea 1 hora y comparte el tag "notas": al publicar una nota, el
 * updateTag del panel también refresca el sitemap.
 *
 * sitemap.ts es una ruta que Next cachea "para siempre" por defecto (no usa
 * cookies/headers, así que no hay señal de que deba variar por request): sin
 * esto, el SITE_URL quedaría congelado con el valor que tenía en el momento
 * del build (o del primer request), ignorando cualquier cambio posterior de
 * la variable de entorno en runtime (por ejemplo, al probar con ngrok). Se
 * fuerza dinámico en vez de darle un `revalidate`: un sitemap lo piden
 * crawlers, no visitantes — el tráfico es bajísimo y no vale la pena
 * arriesgar una URL incorrecta por ahorrarse ese costo.
 */
export const dynamic = "force-dynamic";

type SlugWire = {
  slug: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [notas, categorias] = await Promise.all([
    apiFetch<SlugWire[]>("/articles/slugs", {
      next: { revalidate: 3600, tags: [TAGS.notas] },
    }).catch(() => [] as SlugWire[]),
    obtenerCategorias().catch(() => []),
  ]);

  const secciones: MetadataRoute.Sitemap = categorias.map((c) => ({
    url: `${SITE_URL}/seccion/${c.slug}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const articulos: MetadataRoute.Sitemap = notas
    .filter((n): n is SlugWire & { slug: string } => n.slug !== null)
    .map((n) => ({
      url: `${SITE_URL}/noticia/${n.slug}`,
      lastModified: new Date(n.updatedAt),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...secciones,
    ...articulos,
  ];
}
