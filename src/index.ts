import { PrismaClient } from "@prisma/client";
import { scrapeClassHistory } from "./classHistory";
import { createCourses } from "./courses";
import { createInstructions } from "./instructions";
import { createInstructors } from "./instructor";
import { scrapePublicSchedule } from "./scraper";

export const prismaClient = new PrismaClient();

async function main() {
  // await scrapePublicSchedule();
  // await scrapeClassHistory();
  // await createInstructions();
  // await createCourses();
  // await createInstructors();
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
