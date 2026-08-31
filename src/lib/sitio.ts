/**
 * Datos institucionales, navegación y redes del sitio.
 *
 * Es el único archivo que hay que tocar para actualizar el pie de página, la
 * barra de secciones y los módulos sociales. Los valores marcados con TODO son
 * provisorios: reemplazalos por los reales antes de publicar.
 */

export const SITIO = {
  nombre: "Fuente de Noticias",
  lema: "Tu fuente. Tu Tucumán.",
  descripcion:
    "Medio digital de San Miguel de Tucumán. Noticias locales, nacionales e internacionales con redacción propia y fuentes citadas en cada nota.",
  ciudad: "San Miguel de Tucumán",
  provincia: "Tucumán, Argentina",

  // TODO: correos y teléfono reales del medio
  emailRedaccion: "redaccion@fuentedenoticias.com.ar",
  emailComercial: "publicidad@fuentedenoticias.com.ar",
  whatsapp: "", // formato internacional sin signos, ej: "5493811234567"

  // Datos legales del pie. Se muestran solo si están completos.
  // TODO: completar con los datos registrales del medio
  editorResponsable: "",
  domicilio: "",
  registroPropiedadIntelectual: "",
};

/**
 * Secciones de la barra de navegación: las seis categorías editoriales del
 * Manual de Identidad, cada una con su color en `CATEGORIAS`. "Urgente" no va
 * acá: es un estado de la nota, no una sección.
 */
export const SECCIONES_NAV = [
  "Tucumán",
  "Política",
  "Policial",
  "Economía",
  "Deportes",
  "Cultura",
];

export type Red = {
  nombre: string;
  icono: "instagram" | "x" | "facebook" | "whatsapp" | "youtube";
  url: string;
  usuario?: string;
};

/**
 * Redes del medio. Hoy sólo existe Instagram: la barra de navegación y el pie
 * recorren esta lista, así que sumar una red es agregarla acá (los íconos de
 * X, Facebook, YouTube y WhatsApp ya están dibujados en IconoRed).
 */
// TODO: confirmar el usuario real (ver INSTAGRAM.usuario más abajo).
export const REDES: Red[] = [
  {
    nombre: "Instagram",
    icono: "instagram",
    url: "https://www.instagram.com/fuentedenoticias",
    usuario: "fuentedenoticias",
  },
];

/**
 * Módulo de Instagram de la columna lateral.
 *
 * Pegá en `posts` los permalinks de las publicaciones a destacar
 * (https://www.instagram.com/p/XXXXXXXXX/) y el widget oficial las incrusta.
 * Con la lista vacía se muestra la tarjeta de "seguinos", sin embeds rotos.
 */
export const INSTAGRAM = {
  usuario: "fuentedenoticias.ar", // TODO: usuario real
  posts: [] as string[],
};

