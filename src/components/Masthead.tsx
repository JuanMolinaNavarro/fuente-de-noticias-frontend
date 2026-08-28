import Link from "next/link";
import { API_URL } from "@/lib/env";
import { Isotipo, Wordmark } from "@/components/Marca";
import { Nav } from "@/components/Nav";

// Se reexportan para no romper los imports existentes (panel de administración).
export { Isotipo, Wordmark };

/* Clima actual en Tucumán vía la API propia (que a su vez cachea Open-Meteo).
   Se cachea 30 minutos; si falla, cae al texto institucional. */
async function textoClima() {
  try {
    const r = await fetch(`${API_URL}/weather`, {
      next: { revalidate: 1800 },
    });
    const j: { temperature: number; weatherCode: number } = await r.json();
    const temp = Math.round(j.temperature);
    const code = j.weatherCode;
    const icono =
      code === 0
        ? "☀️"
        : code <= 2
          ? "🌤️"
          : code === 3
            ? "☁️"
            : code <= 48
              ? "🌫️"
              : code <= 67 || (code >= 80 && code <= 82)
                ? "🌧️"
                : code <= 86
                  ? "🌨️"
                  : "⛈️";
    return `Tucumán ${icono} ${temp}°C`;
  } catch {
    return "Tucumán · Argentina";
  }
}

async function ClimaTucuman() {
  return <span className="shrink-0 whitespace-nowrap">{await textoClima()}</span>;
}

/**
 * `titular` marca la firma como <h1> de la página. Solo la portada la usa:
 * en notas y secciones el <h1> es el titular o el nombre de la sección.
 */
export function Masthead({
  seccionActiva,
  titular = false,
}: {
  seccionActiva?: string;
  titular?: boolean;
}) {
  const Firma = titular ? "h1" : "p";
  const ahora = new Date();
  const hoy = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(ahora);
  // En mobile la fecha completa + el clima no entran en una línea: versión corta.
  const hoyCorto = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(ahora);

  return (
    <header>
      <div className="contenedor">
        <div className="flex items-baseline justify-between gap-3 border-b border-hielo py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris">
          <span className="hidden sm:inline">{hoy}</span>
          <span className="sm:hidden">{hoyCorto}</span>
          <ClimaTucuman />
        </div>
        {/* Cabecera centrada del rediseño: el plumín sin placa arriba y el
            wordmark debajo, ambos en el eje de la página. El PNG del isotipo
            trae margen transparente propio, así que el gap visual entre logo
            y texto es menor de lo que sugiere el `gap`. */}
        <div className="flex flex-col items-center py-3 sm:py-4">
          <Isotipo size={60} />
          <Firma className="text-center text-3xl sm:text-4xl">
            <Link href="/">
              <Wordmark />
            </Link>
          </Firma>
        </div>
      </div>
      <div className="regla-marca" />
      <Nav activa={seccionActiva} />
    </header>
  );
}
