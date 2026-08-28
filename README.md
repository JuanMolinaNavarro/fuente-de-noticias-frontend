# Fuente de Noticias — frontend

**Tu fuente. Tu Tucumán.** — Identidad visual según el Manual de Identidad v1.0
(Playfair Display + Inter, paleta de azules institucionales y colores por
sección editorial).

Este paquete es el **sitio público** y el **panel de redacción**. No tiene base
de datos propia: habla con la API NestJS de `../fuente-de-noticias-backend`
siguiendo el patrón BFF (el browser nunca ve el token ni el backend).

## Stack

- **Next.js 16** (App Router, `proxy.ts`, Server Actions) + React 19
- **Tailwind v4** (CSS-first: tokens en `src/app/globals.css`)
- **Tiptap 3** (ProseMirror) para el editor de notas
- Sin shadcn, sin zod en el front, íconos SVG inline

## Correr en desarrollo

```bash
cp .env.example .env     # API_URL del backend
npm install
npm run dev              # http://localhost:3000
```

El backend tiene que estar corriendo en :4000 (ver su README). Usuarios de
prueba: `npx prisma db seed -- --demo` en el backend crea `editor@` y
`redactor@fuentedenoticias.com.ar` (clave `demo_2026`) además del admin.

## Mapa

```
src/proxy.ts                   sin cookie → /admin/login (primera puerta; el layout valida)
src/lib/api.ts                 cliente público (fetch con tags de caché: notas, nota:slug)
src/lib/admin-api.ts           cliente tipado de /admin/*
src/lib/auth.ts                cookie httpOnly fdn_token, getSession() (cache), requireSession(roles)
src/app/admin/login            login
src/app/admin/(panel)/         layout (Sidebar + Topbar), tablero, notas (bandeja, nueva, [id] editor),
                               usuarios, feeds, categorias, actividad, cuenta
src/components/admin/          Sidebar, Topbar, Bandeja, ChipEstado, FormAccion, editor/{EditorNota,CuerpoTiptap}
src/components/nota/           ArticuloNota + CuerpoNota (render del contentJson, sin dangerouslySetInnerHTML)
src/app/vista-previa/[token]   vista previa de notas no publicadas (token efímero del panel)
```

## Flujo editorial (el estado vive en el backend)

```
INGESTED ─▶ DRAFT ──submit──▶ IN_REVIEW ──publish──▶ PUBLISHED
              ▲ └─── return ────┘   │                   │ unpublish → DRAFT
              │                     └ publish(scheduledAt) → SCHEDULED ─cron─▶ PUBLISHED
              └─ spike → SPIKED ─restore─┘
```

Roles: `REDACTOR` (crea/edita sus borradores, envía a revisión), `EDITOR`
(edita todo, devuelve, publica/programa/despublica), `ADMIN` (además usuarios,
feeds, secciones, actividad).
