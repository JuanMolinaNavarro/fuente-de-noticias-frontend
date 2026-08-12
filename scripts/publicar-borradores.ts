/**
 * Utilidad de prueba: aprueba y publica de una vez los últimos N borradores.
 * En la operación normal la aprobación se hace una por una desde /admin.
 *
 * Uso: npx tsx --env-file=.env scripts/publicar-borradores.ts [cantidad]
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();
const limite = Number(process.argv[2] ?? 9);

async function main() {
  const drafts = await prisma.article.findMany({
    where: { status: "DRAFT", title: { not: null } },
    orderBy: { fetchedAt: "desc" },
    take: limite,
  });

  let n = 0;
  for (const d of drafts) {
    await prisma.article.update({
      where: { id: d.id },
      data: {
        slug: `${slugify(d.title!)}-${d.id.slice(-6)}`,
        status: "APPROVED",
        publishedAt: new Date(Date.now() - n * 60_000),
        reviewedAt: new Date(),
      },
    });
    n++;
    console.log(`  ✓ Publicada: ${d.title!.slice(0, 70)}`);
  }
  console.log(`\n${n} notas publicadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
