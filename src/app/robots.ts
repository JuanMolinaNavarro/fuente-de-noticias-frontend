import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/**
 * Genera /robots.txt: qué puede rastrear un buscador y dónde está el sitemap.
 *
 * Se excluye lo que no aporta al índice: el panel (/admin), las vistas espejo
 * con publicidad (/ads, que además llevan noindex) y las vistas previas por
 * token. robots.txt no es seguridad — el admin ya está protegido por auth —
 * es una indicación de cortesía para los crawlers.
 *
 * dynamic: mismo motivo que en sitemap.ts — sin esto, SITE_URL quedaría
 * congelado con el valor del momento del build o del primer request.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/ads", "/vista-previa"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
