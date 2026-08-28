import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
