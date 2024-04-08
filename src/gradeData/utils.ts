import { GPA } from "../constants";
import { GradeData, Section, Instruction, Course, Professor } from "../db/db";

// calc average gpa and count data points for GradeData
export function calcGPAData(gradeData: GradeData): [number | null, number] {
  let tEnrollment = 0;
  let tPoints = 0;
  for (let gradeKey in GPA) {
    tEnrollment += (gradeData as any)[gradeKey];
    tPoints += GPA[gradeKey] * (gradeData as any)[gradeKey];
  }
  if (tEnrollment == 0) {
    return [null, 0];
  }
  return [tPoints / tEnrollment, tEnrollment];
}

export async function resetGPAData(model: Section | Instruction | Course | Professor) {
  model.AvgGPA = null;
  model.GradePoints = 0;
  await model.save();
}

// Adds gpa/data point count to an object. If gradePoints is negative, remove.
export function addGPAData(avgGpa: number, gradePoints: number, model: Section | Instruction | Course | Professor) {
  let { AvgGPA, GradePoints } = model;
  let tPoints: number = AvgGPA ? AvgGPA * GradePoints : 0;

  model.GradePoints += gradePoints;

  if (model.GradePoints === 0) {
    model.AvgGPA = null;
  } else {
    model.AvgGPA = (tPoints + avgGpa * gradePoints) / model.GradePoints;
  }
}
