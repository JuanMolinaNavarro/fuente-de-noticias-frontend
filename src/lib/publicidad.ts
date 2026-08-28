/**
 * Inventario publicitario del sitio.
 *
 * Cada espacio del layout tiene un `id` fijo. Mientras ese id no figure en
 * AVISOS, el espacio se dibuja como placeholder reservado (no se cae la grilla
 * ni se mueve el contenido). Para vender un espacio, agregá una entrada:
 *
 *   "portada-lateral-1": {
 *     anunciante: "Nombre del anunciante",
 *     imagen: "/avisos/anunciante-300x250.jpg",  // subida a /public/avisos
 *     destino: "https://...",
 *   }
 *
 * Para un tag de ad server (Google Ad Manager, AdSense, etc.) usá `html`.
 */

export type Formato = "megabanner" | "banner" | "caja" | "rascacielos";

/** Medidas IAB de cada formato. `movil` es la relación usada en pantallas chicas. */
export const FORMATOS: Record<
  Formato,
  { ancho: number; alto: number; movil: { ancho: number; alto: number } }
> = {
  megabanner: { ancho: 970, alto: 90, movil: { ancho: 320, alto: 100 } },
  banner: { ancho: 728, alto: 90, movil: { ancho: 320, alto: 100 } },
  caja: { ancho: 300, alto: 250, movil: { ancho: 300, alto: 250 } },
  rascacielos: { ancho: 300, alto: 600, movil: { ancho: 300, alto: 250 } },
};

export type Aviso = {
  anunciante: string;
  /** Imagen del aviso, servida desde /public. */
  imagen?: string;
  /** URL de destino del clic. */
  destino?: string;
  /** Alternativa a `imagen`: markup del ad server. Se inyecta tal cual. */
  html?: string;
};

/** Campañas activas, indexadas por id de espacio. */
export const AVISOS: Record<string, Aviso> = {
  // Vacío: todos los espacios se muestran como disponibles.
};
