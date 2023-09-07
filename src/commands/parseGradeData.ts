import { loadModels } from "../db/models";
import { scrapeClassHistory } from "../gradeData/parse";

(async () => {
  loadModels();
  await scrapeClassHistory();
})();
