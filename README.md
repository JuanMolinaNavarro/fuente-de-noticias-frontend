# Fuente de Noticias

**Tu fuente. Tu Tucumán.** — Identidad visual según el Manual de Identidad v1.0
de Marketing Argentina (Playfair Display + Inter, paleta de azules
institucionales y colores por categoría editorial).

Sitio de curación de noticias: un worker lee feeds RSS, Claude genera una nota
propia (resumen con atribución a la fuente), un humano la revisa en el panel de
administración y recién ahí se publica en el sitio.

## Stack

- **Next.js** (App Router) — sitio público + panel de administración
- **PostgreSQL** (Docker) + **Prisma** — artículos con estados
- **rss-parser** + **Claude API** — ingesta y redacción de borradores

## Flujo editorial

```
RSS feed ──ingesta──▶ INGESTED ──IA──▶ DRAFT ──humano──▶ APPROVED (público)
                                          └──────────────▶ REJECTED
```

- `INGESTED`: llegó del feed, deduplicado por GUID, sin nota generada.
- `DRAFT`: nota lista para revisión en `/admin`. Con `ANTHROPIC_API_KEY`
  configurada la redacta Claude; **sin API key** se copia el material del feed
  tal cual, para que el editor lo redacte a mano antes de aprobar.
- `APPROVED`: aprobada por un humano; visible en la portada.
- `REJECTED`: descartada.

> `scripts/publicar-borradores.ts` aprueba en lote los últimos N borradores —
> es solo una utilidad de prueba; el flujo normal es aprobar desde `/admin`.

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Configuración — editar .env:
#    ANTHROPIC_API_KEY, ADMIN_PASSWORD, RSS_FEEDS

# 3. Base de datos
docker compose up -d
npm run db:push

# 4. Ingesta (RSS → IA → borradores). Programarla cada 15-30 min con cron
#    o el Programador de tareas de Windows.
npm run ingest

# 5. Sitio
npm run dev
```

- Sitio público: http://localhost:3000
- Panel de administración: http://localhost:3000/admin (clave = `ADMIN_PASSWORD`)

## Nota legal / editorial

El pipeline está diseñado como **curaduría con atribución**, no como
reescritura encubierta:

- La IA redacta una nota propia usando los hechos como información; el último
  párrafo y una caja al pie de cada artículo citan y enlazan la fuente.
- Las imágenes de los feeds **no se publican** (suelen ser de agencias con
  copyright). El campo `originalImageUrl` queda como referencia en el panel; el
  editor puede cargar una `imageUrl` propia, de stock con licencia o generada.
- Nada se publica sin aprobación humana.

## Pendientes / siguientes pasos

- Almacenamiento propio de imágenes (MinIO, compatible S3) con thumbnails.
- Autenticación real multi-usuario (el login actual es una clave única en
  `.env`, suficiente solo para el MVP).
- Paginación y páginas por categoría en el sitio público.
- Cron dentro de Docker (`worker` como servicio en docker-compose).
