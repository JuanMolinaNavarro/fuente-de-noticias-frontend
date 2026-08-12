/**
 * Datos de demostración para ver el flujo completo sin API key ni feeds.
 * Uso: npx tsx --env-file=.env scripts/seed-demo.ts
 * Borra los artículos de demo previos (guid demo-*) y crea nuevos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demo = [
  {
    guid: "demo-1",
    sourceName: "Diario Ejemplo",
    sourceUrl: "https://example.com/nota-1",
    originalTitle:
      "El Banco Central redujo la tasa de interés de referencia al 32%",
    originalContent:
      "El directorio del Banco Central resolvió este jueves una baja de la tasa de política monetaria del 35% al 32% anual, en línea con la desaceleración de la inflación de los últimos tres meses...",
    title: "El Central bajó la tasa al 32% y consolida el ciclo de recortes",
    summary:
      "Es la tercera reducción consecutiva de la tasa de referencia, apoyada en la desaceleración de la inflación del último trimestre.",
    content:
      "El Banco Central resolvió recortar la tasa de política monetaria del 35% al 32% anual, en lo que constituye la tercera baja consecutiva del año.\n\nLa decisión se apoya en la desaceleración que viene mostrando la inflación durante el último trimestre, y busca abaratar el crédito para empresas y familias sin comprometer el ancla monetaria.\n\nAnalistas del mercado esperaban un recorte de esta magnitud, aunque advierten que el margen para nuevas bajas dependerá de los próximos datos de precios.\n\nLa información fue publicada originalmente por Diario Ejemplo.",
    category: "Economía",
    slug: "el-central-bajo-la-tasa-al-32-demo",
    status: "APPROVED" as const,
    publishedAt: new Date(),
  },
  {
    guid: "demo-2",
    sourceName: "Agencia Demo",
    sourceUrl: "https://example.com/nota-2",
    originalTitle:
      "Científicos argentinos desarrollan un trigo resistente a la sequía",
    originalContent:
      "Un equipo del CONICET y una empresa de biotecnología presentaron una variedad de trigo modificado genéticamente que tolera períodos prolongados de estrés hídrico...",
    title: "Presentan un trigo argentino que tolera la sequía",
    summary:
      "El desarrollo del CONICET junto a una empresa biotecnológica promete rendimientos estables en campañas con déficit hídrico.",
    content:
      "Un equipo del CONICET, en conjunto con una empresa de biotecnología local, presentó una variedad de trigo capaz de mantener el rendimiento en períodos prolongados de sequía.\n\nEl desarrollo, que llevó más de una década de investigación, ya superó las instancias regulatorias locales y apunta a las campañas del próximo año.\n\nLa información fue publicada originalmente por Agencia Demo.",
    category: "Tecnología",
    slug: "trigo-argentino-tolerante-sequia-demo",
    status: "APPROVED" as const,
    publishedAt: new Date(Date.now() - 3600_000),
  },
  {
    guid: "demo-3",
    sourceName: "Portal Ficticio",
    sourceUrl: "https://example.com/nota-3",
    originalTitle: "La selección juvenil se clasificó al mundial de la categoría",
    originalContent:
      "Con un triunfo 2 a 0 en el estadio único, la selección juvenil aseguró su plaza en la copa del mundo de la categoría que se jugará el año próximo...",
    title: "La selección juvenil sacó pasaje al mundial",
    summary:
      "Con un 2-0 sólido, el equipo aseguró su lugar en la cita mundialista del año próximo.",
    content:
      "La selección juvenil venció 2 a 0 y aseguró su clasificación a la copa del mundo de la categoría, que se disputará el año próximo.\n\nEl equipo cerró la fase clasificatoria invicto como local y con la valla menos vencida del torneo.\n\nLa información fue publicada originalmente por Portal Ficticio.",
    category: "Deportes",
    status: "DRAFT" as const,
    publishedAt: null,
    slug: null,
  },
];

async function main() {
  await prisma.article.deleteMany({ where: { guid: { startsWith: "demo-" } } });
  for (const d of demo) {
    await prisma.article.create({
      data: { ...d, feedUrl: "demo", originalImageUrl: null },
    });
  }
  console.log(`Se cargaron ${demo.length} artículos de demostración.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
