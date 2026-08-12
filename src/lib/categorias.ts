// Sistema de colores por categoría editorial (Manual de Identidad, sección 01)
export const CATEGORIAS: Record<string, string> = {
  tucuman: "#1C3A6B",
  politica: "#C0392B",
  policial: "#2C3E50",
  economia: "#1A7A4A",
  deportes: "#E67E22",
  cultura: "#7B2FBE",
  urgente: "#E53E3E",
};

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

export function esUrgente(cat?: string | null) {
  return cat != null && normalizar(cat) === "urgente";
}
