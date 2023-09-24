import { scrapePublicSchedule } from "../scraper/scrapeSchedule";

export const scrapeCurrentSchedule = async () => {
  await scrapePublicSchedule(true);
};
scrapeCurrentSchedule();
