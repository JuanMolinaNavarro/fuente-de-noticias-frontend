# Multi-stage en tres etapas:
#   deps   — instala node_modules (se cachea mientras no cambie package.json)
#   build  — compila con next build (output: "standalone" en next.config.ts)
#   runner — solo lo mínimo para servir; es lo único que llega al VPS

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A propósito NO se pasa API_URL ni SITE_URL: el build no depende del backend
# (las rutas dinámicas son ISR bajo demanda y la portada tiene fallback).
# Ambas variables se leen en runtime del entorno del contenedor, así la misma
# imagen sirve para cualquier entorno.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Obligatorio: el server standalone bindea localhost por defecto y el
# contenedor sería inalcanzable desde afuera sin esto.
ENV HOSTNAME=0.0.0.0

# standalone trae server.js + node_modules podados, pero NO los estáticos ni
# public/ (en Vercel los sirve su CDN): hay que copiarlos a mano.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
