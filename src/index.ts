import { PrismaClient } from "@prisma/client";
import { scrapeClassHistory } from "./classHistory";
import { createInstructions } from "./instructions";
import { scrapePublicSchedule } from "./scraper";

export const prismaClient = new PrismaClient();

async function main() {
  // await scrapePublicSchedule();

  await scrapeClassHistory();

  await createInstructions();
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
