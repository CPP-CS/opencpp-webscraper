import { loadModels } from "../db/models";
import { scrapeClassHistory } from "../gradeData/parse";

(async () => {
  await loadModels();
  await scrapeClassHistory();
})();
