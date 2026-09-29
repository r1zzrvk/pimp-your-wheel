import { PrismaClient } from "@prisma/client";
import { ANIMATIONS, BACKGROUNDS, COSMETICS, POINTERS } from "../lib/economy";

const prisma = new PrismaClient();

async function main() {
  for (const item of [...COSMETICS, ...BACKGROUNDS, ...POINTERS, ...ANIMATIONS]) {
    const data = {
      name: item.name,
      priceCoins: item.priceCoins,
      primary: item.primary,
      secondary: item.secondary,
      accent: item.accent,
    };
    await prisma.cosmetic.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
