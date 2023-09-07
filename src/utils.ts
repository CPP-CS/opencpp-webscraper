import moment from "moment";
import { GPA } from "./constants";
import { Course, GradeData, Instruction, Professor, Section } from "./db/models";

export function removeInitials(s: string) {
  let res = s;
  res = res.split(" ")[0];
  return res;
}

export function removeJr(s: string) {
  let res = s;
  res = res.split(" Jr")[0];
  return res;
}

export function parseTime(time: string): string {
  return moment(time, "hh:mm A").format("HH:mm:ss");
}
export function parseDate(date: string): Date {
  return moment(date, "YYYY-MM-DD").toDate();
}

// calc average gpa and count data points for GradeData
export function calcGPAData(gradeData: GradeData): [number, number] {
  let tEnrollment = 0;
  let tPoints = 0;
  for (let gradeKey in GPA) {
    tEnrollment += (gradeData as any)[gradeKey];
    tPoints += GPA[gradeKey] * (gradeData as any)[gradeKey];
  }
  return [tPoints / tEnrollment, tEnrollment];
}

// Adds gpa/data point count to an object. If gradePoints is negative, remove
export async function addGPAData(
  avgGpa: number,
  gradePoints: number,
  model: Section | Instruction | Course | Professor
) {
  let { AvgGPA, GradePoints } = model;
  let tPoints: number = AvgGPA ? AvgGPA * GradePoints : 0;

  model.GradePoints += gradePoints;

  if (model.GradePoints === 0) {
    model.AvgGPA = null;
  } else {
    model.AvgGPA = (tPoints + avgGpa * gradePoints) / model.GradePoints;
  }

  await model.save();
}

// Makes sure GradePoints is 0 when avgGpa is null, otherwise some logic error occurred
export function validateGradePoints(model: Section | Instruction | Course | Professor) {
  if (model.AvgGPA === null && model.GradePoints !== 0)
    throw new Error(`AvgGpa is null and Gradepoints is ${model.GradePoints} on ${JSON.stringify(model)}`);
}

// This allows us to run async code without the node process ending prematurely
export function runAsync(f: () => Promise<void>) {
  class Waiter {
    private timeout: any;
    constructor() {
      this.waitLoop();
    }
    private waitLoop(): void {
      this.timeout = setTimeout(() => {
        this.waitLoop();
      }, 100 * 1000);
    }
    okToQuit(): void {
      if (this) {
        clearTimeout(this.timeout);
      }
    }
  }

  const w = new Waiter();
  const appPromise: Promise<any> = f().finally(w.okToQuit);
}

// This staggers promises so we don't overload sequelize.
export async function staggerPromises<T>(values: T[], f: (val: T, ind: number) => Promise<void>, increment: number) {
  for (let i = 0; i < values.length; i += increment) {
    await Promise.all(
      values.slice(i, Math.min(i + increment, values.length)).map(async (val, ind) => {
        await f(val, i + ind);
      })
    );
  }
}
