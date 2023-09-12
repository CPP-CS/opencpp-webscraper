import { loadModels } from "../db/models";
import { updateGradeData } from "../gradeData/gradeData";

export const calcGradeData = async () => {
  loadModels();
  await updateGradeData();
};
calcGradeData();
