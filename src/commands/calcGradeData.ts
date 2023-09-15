import { updateGradeData } from "../gradeData/gradeData";

export const calcGradeData = async () => {
  await updateGradeData();
};
calcGradeData();
