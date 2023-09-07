import { loadModels } from "../db/models";
import { scrapePublicSchedule } from "../scraper/scrapeSchedule";

(async () => {
  await loadModels();
  await scrapePublicSchedule(true);
})();
