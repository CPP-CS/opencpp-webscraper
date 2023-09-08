import { loadModels } from "../db/models";
import { scrapePublicSchedule } from "../scraper/scrapeSchedule";

export const scrapeCurrentSchedule = async () => {
  await loadModels();
  await scrapePublicSchedule(true);
};
scrapeCurrentSchedule();
