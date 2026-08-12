/**
 * Worker de ingesta: lee los feeds RSS, deduplica por GUID y genera con IA
 * una nota curada (resumen propio + atribución) que queda como borrador
 * pendiente de aprobación humana.
 *
 * Uso:  npm run ingest
 * Cron: ejecutarlo cada 15-30 minutos (Task Scheduler / cron / systemd timer).
 */
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const parser = new Parser({ timeout: 30_000 });

// La IA es opcional: sin ANTHROPIC_API_KEY los artículos pasan a borrador
// con su contenido original, para redacción/edición manual en el panel.
const AI_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY);
const anthropic = AI_ENABLED ? new Anthropic() : null;

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";
const MAX_PER_FEED = 6; // límite por corrida para no gastar de más en el MVP

const SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Título propio de la nota curada, en español, informativo y sobrio",
    },
    summary: {
      type: "string",
      description: "Bajada de 1-2 oraciones que resume el hecho",
    },
    content: {
      type: "string",
      description:
        "Cuerpo de la nota: 2 a 4 párrafos separados por doble salto de línea. Redacción 100% propia. El último párrafo debe citar la fuente por su nombre.",
    },
    category: {
      type: "string",
      description:
        "Exactamente una de: Tucumán, Política, Policial, Economía, Deportes, Cultura. Usá 'Tucumán' para noticias locales o del NOA.",
    },
  },
  required: ["title", "summary", "content", "category"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Sos redactor de "Fuente de Noticias", un medio digital de Tucumán. Voz de marca: directa (la noticia primero), veloz, local, confiable y moderna; nunca sensacionalista ni partidaria.
A partir del material de una nota de otro medio, escribís una nota breve PROPIA:
- Usás los hechos como información, pero la redacción, estructura y ángulo son tuyos. No parafrasees oración por oración.
- No inventes datos que no estén en el material.
- Tono informativo y neutro, español rioplatense neutro.
- El último párrafo atribuye la fuente, por ejemplo: "La información fue publicada originalmente por {fuente}."
- 2 a 4 párrafos, separados por doble salto de línea.`;

async function rewriteWithAI(input: {
  sourceName: string;
  title: string;
  content: string;
  link: string;
}) {
  const response = await anthropic!.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Fuente: ${input.sourceName}\nURL original: ${input.link}\nTítulo original: ${input.title}\n\nMaterial:\n${input.content}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud (refusal)");
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Respuesta sin texto");
  return JSON.parse(text.text) as {
    title: string;
    summary: string;
    content: string;
    category: string;
  };
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const feeds = (process.env.RSS_FEEDS ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (feeds.length === 0) {
    console.error("No hay feeds configurados en RSS_FEEDS");
    process.exit(1);
  }

  let nuevos = 0;
  let reescritos = 0;
  let fallidos = 0;

  for (const feedUrl of feeds) {
    console.log(`\n→ Leyendo feed: ${feedUrl}`);
    let feed;
    try {
      feed = await parser.parseURL(feedUrl);
    } catch (err) {
      console.error(`  No se pudo leer el feed: ${err}`);
      continue;
    }
    const sourceName = feed.title ?? new URL(feedUrl).hostname;

    for (const item of (feed.items ?? []).slice(0, MAX_PER_FEED)) {
      const guid = item.guid || item.link;
      if (!guid || !item.title || !item.link) continue;

      const existing = await prisma.article.findUnique({ where: { guid } });
      if (existing) continue;

      const rawContent = stripHtml(
        item["content:encoded"] || item.content || item.contentSnippet || ""
      );
      const enclosureUrl =
        item.enclosure?.url ||
        (item as Record<string, any>)["media:content"]?.["$"]?.url ||
        null;

      const article = await prisma.article.create({
        data: {
          guid,
          feedUrl,
          sourceName,
          sourceUrl: item.link,
          originalTitle: stripHtml(item.title),
          originalContent: rawContent,
          originalImageUrl: enclosureUrl,
          status: "INGESTED",
        },
      });
      nuevos++;
      console.log(`  + ${article.originalTitle.slice(0, 70)}`);
    }
  }

  // Segunda pasada: reescribir con IA todo lo que quedó en INGESTED
  // (incluye artículos de corridas anteriores que fallaron)
  const pendientes = await prisma.article.findMany({
    where: { status: "INGESTED" },
    orderBy: { fetchedAt: "desc" },
  });

  console.log(
    AI_ENABLED
      ? `\n→ ${pendientes.length} artículos para reescribir con IA (${MODEL})`
      : `\n→ ${pendientes.length} artículos a borrador sin IA (ANTHROPIC_API_KEY no configurada)`
  );

  for (const art of pendientes) {
    try {
      const material = art.originalContent || art.originalTitle;
      if (AI_ENABLED) {
        const nota = await rewriteWithAI({
          sourceName: art.sourceName,
          title: art.originalTitle,
          content: material.slice(0, 8000),
          link: art.sourceUrl,
        });
        await prisma.article.update({
          where: { id: art.id },
          data: {
            title: nota.title,
            summary: nota.summary,
            content: nota.content,
            category: nota.category,
            status: "DRAFT",
          },
        });
        reescritos++;
        console.log(`  ✓ ${nota.title.slice(0, 70)}`);
      } else {
        // Sin IA: se copia el material del feed tal cual para que el
        // editor lo redacte/ajuste a mano antes de aprobar.
        const resumen =
          material.length > 220 ? `${material.slice(0, 217).trimEnd()}…` : material;
        await prisma.article.update({
          where: { id: art.id },
          data: {
            title: art.originalTitle,
            summary: resumen,
            content: material,
            status: "DRAFT",
          },
        });
        reescritos++;
        console.log(`  ✓ ${art.originalTitle.slice(0, 70)}`);
      }
    } catch (err) {
      fallidos++;
      console.error(`  ✗ ${art.originalTitle.slice(0, 50)}: ${err}`);
    }
  }

  console.log(
    `\nResumen: ${nuevos} nuevos ingresados, ${reescritos} pasados a borrador, ${fallidos} fallidos.`
  );
  if (AI_ENABLED && fallidos > 0 && reescritos === 0) {
    console.log(
      "Si todos fallaron, revisá que ANTHROPIC_API_KEY sea válida en .env"
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
