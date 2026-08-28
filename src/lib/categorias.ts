// Sistema de colores por categoría editorial (Manual de Identidad, sección 01)
export const CATEGORIAS: Record<string, string> = {
  tucuman: "#1C3A6B",
  politica: "#C0392B",
  policial: "#2C3E50",
  economia: "#1A7A4A",
  deportes: "#E67E22",
  cultura: "#7B2FBE",
  // Extensiones a la paleta del manual (propuestas propias)
  internacional: "#12707E",
  sociedad: "#B7791F",
  campo: "#8B5E3C",
  tecnologia: "#0E9CB8",
};

// Nombres visibles, para selects/datalists del panel
export const NOMBRES_CATEGORIAS = [
  "Tucumán",
  "Política",
  "Policial",
  "Economía",
  "Deportes",
  "Cultura",
  "Internacional",
  "Sociedad",
  "Campo",
  "Tecnología",
];

function normalizar(cat: string) {
  return cat
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function colorCategoria(cat?: string | null) {
  if (!cat) return CATEGORIAS.tucuman;
  return CATEGORIAS[normalizar(cat)] ?? CATEGORIAS.tucuman;
}

/** "Tucumán" -> "tucuman", para las URLs de sección. */
export function slugCategoria(cat: string) {
  return normalizar(cat).replace(/\s+/g, "-");
}

/** Devuelve el nombre visible de la categoría a partir del slug de la URL. */
export function categoriaDesdeSlug(slug: string) {
  return (
    NOMBRES_CATEGORIAS.find((n) => slugCategoria(n) === slug.toLowerCase()) ??
    null
  );
}
