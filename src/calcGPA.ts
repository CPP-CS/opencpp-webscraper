import { prismaClient } from ".";
import { aggregateGPA } from "./utils";

export async function calcGPA() {
  await calcInstructions();
  await calcCourses();
  await calcInstructors();
}

async function calcInstructions() {
  let instructions = await prismaClient.instruction.findMany({ include: { sections: {} } });
  for (let instruction of instructions) {
    // console.log("Calculating GPA for Instruction #", instruction.id);
    let { TotalEnrollment, AvgGPA } = aggregateGPA(
      instruction.sections.map((section) => {
        return { TotalEnrollment: section.TotalEnrollment, AvgGPA: section.AvgGPA };
      })
    );

    await prismaClient.instruction.update({
      where: {
        id: instruction.id,
      },
      data: { AvgGPA, TotalEnrollment },
    });
  }
}

async function calcCourses() {
  let courses = await prismaClient.course.findMany({ include: { instructions: {} } });
  for (let course of courses) {
    // console.log("Calculating GPA for Course #", course.id);
    let { TotalEnrollment, AvgGPA } = aggregateGPA(
      course.instructions.map((instruction) => {
        return { TotalEnrollment: instruction.TotalEnrollment, AvgGPA: instruction.AvgGPA };
      })
    );

    await prismaClient.course.update({
      where: {
        id: course.id,
      },
      data: { AvgGPA, TotalEnrollment },
    });
  }
}

async function calcInstructors() {
  let instructors = await prismaClient.instructor.findMany({ include: { instructions: {} } });
  for (let instructor of instructors) {
    // console.log("Calculating GPA for Instructor #", instructor.id);
    let { TotalEnrollment, AvgGPA } = aggregateGPA(
      instructor.instructions.map((instruction) => {
        return { TotalEnrollment: instruction.TotalEnrollment, AvgGPA: instruction.AvgGPA };
      })
    );

    await prismaClient.instructor.update({
      where: {
        id: instructor.id,
      },
      data: { AvgGPA, TotalEnrollment },
    });
  }
}
