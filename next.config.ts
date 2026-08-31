import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy: la lista de orígenes en los que el browser puede
 * confiar. Es la red de contención contra XSS (si un día se cuela un script,
 * no puede cargar código de afuera) y contra clickjacking (frame-ancestors).
 *
 * - 'unsafe-inline' en script-src: Next inyecta scripts inline sin nonce; se
 *   compensa restringiendo los orígenes externos a Instagram (el único embed).
 * - 'unsafe-eval' y ws: sólo en desarrollo (HMR de Next los necesita).
 * - img-src https:: las notas legadas pueden traer imageUrl externa con
 *   licencia; blob: para las previsualizaciones locales de subidas.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://www.instagram.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "frame-src https://www.instagram.com",
  // Nadie puede meter el sitio (ni el panel /admin) en un iframe: sin esto,
  // una página trampa puede superponer botones invisibles del panel
  // (clickjacking sobre publicar / blanquear contraseña).
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** Los pone Next (no sólo Caddy) para que también existan en los modos que
 *  no pasan por Caddy (docker-compose.ngrok.yml, dev). HSTS queda en Caddy:
 *  es quien termina TLS. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Genera .next/standalone: un server.js autocontenido con solo los
  // node_modules necesarios para correr. Es lo que copia el Dockerfile;
  // la imagen final no arrastra las dependencias de desarrollo.
  output: "standalone",
  // La media propia viaja con URL relativa (/uploads/...). En producción la
  // resuelve Caddy (proxy /uploads/* → backend); en dev no hay proxy, así
  // que Next hace ese mismo papel solo acá. Paridad dev/prod.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const api = process.env.API_URL ?? "http://localhost:4000/api/v1";
    return [
      { source: "/uploads/:path*", destination: `${new URL(api).origin}/uploads/:path*` },
    ];
  },
  experimental: {
    serverActions: {
      // La subida de imágenes viaja por una server action (BFF) hacia el
      // backend; el backend corta en 8 MB, acá dejamos margen para el
      // overhead del multipart.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
