import { loadModels } from "../db/models";
import { scrapeClassHistory } from "../gradeData/parse";

export const parseGradeData = async () => {
  loadModels();
  await scrapeClassHistory();
};
parseGradeData();
