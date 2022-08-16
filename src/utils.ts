import { prisma, Prisma, Section } from "@prisma/client";
import { prismaClient } from ".";
import { GPA } from "./constants";

export async function truncateDatabase() {
  await prismaClient.course.deleteMany({ where: {} });
  await prismaClient.instructor.deleteMany({ where: {} });
}

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

// calc average gpa for individual sections
export function calcAvgGPA(section: Prisma.SectionCreateInput | Prisma.SectionUpdateInput) {
  if (!section.TotalEnrollment) return null;
  let tEnrollment = 0;
  let tPoints = 0;
  tEnrollment = parseInt(section.TotalEnrollment.toString());
  for (let gradeKey in GPA) {
    tPoints += GPA[gradeKey] * ((section as any)[gradeKey] || 0);
  }
  // console.log(tPoints / tEnrollment);
  return tPoints / tEnrollment;
}

// aggregate avg gpas from children
export function aggregateGPA(dataPoints: { TotalEnrollment: number | null; AvgGPA: number | null }[]) {
  let totalEnrollment = 0;
  let totalGPA = 0;
  for (let data of dataPoints) {
    // console.log(data);
    if (data.AvgGPA && data.TotalEnrollment) {
      totalEnrollment += data.TotalEnrollment;
      totalGPA += data.TotalEnrollment * data.AvgGPA;
    }
  }
  return { TotalEnrollment: totalEnrollment, AvgGPA: totalGPA / totalEnrollment };
}
