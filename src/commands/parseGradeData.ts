import { scrapeClassHistory } from "../gradeData/parse";

export const parseGradeData = async () => {
  await scrapeClassHistory();
};
parseGradeData();
