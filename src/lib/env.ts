/**
 * Variables de entorno del servidor, leídas en un solo lugar.
 *
 * Regla: en producción una variable ausente debe frenar el arranque con un
 * error claro ("fail-fast"), nunca caer en silencio a un valor de desarrollo.
 * Un fallback a localhost:4000 en un VPS no falla: apunta a un backend que
 * no existe y el sitio "anda" mostrando errores raros, mucho más difícil de
 * diagnosticar que un mensaje explícito al arrancar.
 *
 * Excepción: durante `next build` (NEXT_PHASE=phase-production-build) todavía
 * no existen las variables del contenedor final, y el build no debe depender
 * del backend; ahí se tolera el fallback.
 */
function requerida(nombre: string, fallbackDev: string): string {
  const valor = process.env[nombre];
  if (valor) return valor;
  const esBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !esBuild) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. ` +
        `Definila en el entorno del proceso (docker-compose / .env).`,
    );
  }
  return fallbackDev;
}

/** URL base del backend NestJS. Privada (sin NEXT_PUBLIC): patrón BFF. */
export const API_URL = requerida("API_URL", "http://localhost:4000/api/v1");

/** URL pública del sitio (canónicas, sitemap, OG, RSS). */
export const SITE_URL = requerida("SITE_URL", "http://localhost:3000");
