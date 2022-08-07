import { PrismaClient } from "@prisma/client";
import { scrapeClassHistory } from "./classHistory";
import { createCourses } from "./courses";
import { createInstructions } from "./instructions";
import { createInstructors } from "./instructor";
import { scrapePublicSchedule } from "./scraper";
import { truncateDatabase } from "./utils";

export const prismaClient = new PrismaClient();

async function main() {
  console.time("timer");
  await truncateDatabase();
  await scrapePublicSchedule();
  await scrapeClassHistory();
  await createInstructions();
  await createCourses();
  await createInstructors();
  console.timeEnd("timer");
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
