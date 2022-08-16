import { PrismaClient } from "@prisma/client";
import { scrapePublicSchedule } from "./scraper";
import { truncateDatabase } from "./utils";
import "dotenv/config";
import { scrapeClassHistory } from "./classHistory";
import { calcGPA } from "./calcGPA";

export const prismaClient = new PrismaClient();

async function main() {
  if (process.env.mode == "clean") {
    console.time("timer");
    await truncateDatabase();
    await scrapePublicSchedule();
    await scrapeClassHistory();
    await calcGPA();
    console.timeEnd("timer");
    return;
  }
  if (process.env.mode == "recent") {
    await scrapePublicSchedule(true);
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
