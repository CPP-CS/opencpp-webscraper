import { PrismaClient } from "@prisma/client";
import { calcGPA } from "./calcGPA";
import { scrapeClassHistory } from "./classHistory";
import { scrapePublicSchedule } from "./scraper";
import { truncateDatabase } from "./utils";

export const prismaClient = new PrismaClient();

async function main() {
  console.time("timer");
  console.time("truncate");
  await truncateDatabase();
  console.timeEnd("truncate");
  console.time("scrape public schedule");
  await scrapePublicSchedule();
  console.timeEnd("scrape public schedule");
  // console.time("scrape history");
  // await scrapeClassHistory();
  // console.timeEnd("scrape history");
  // console.time("calcgpa");
  // await calcGPA();
  // console.timeEnd("calcgpa");
  console.timeEnd("timer");
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
