import { loadModels } from "../db/models";
import { scrapeClassHistory } from "../gradeData/parse";
import { runAsync } from "../utils";

runAsync(async () => {
  loadModels();
  await scrapeClassHistory();
});
