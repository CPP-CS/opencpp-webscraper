import { Course, Instruction, Prisma } from "@prisma/client";
import { prismaClient } from ".";
import { aggregateGPA } from "./utils";
export async function createCourses() {
  let courses = await prismaClient.instruction.findMany({
    distinct: ["Subject", "CourseNumber"],
    select: {
      Subject: true,
      CourseNumber: true,
    },
  });

  for (let course of courses) {
    const { Subject, CourseNumber } = course;

    // find instructions
    let instructions = await prismaClient.instruction.findMany({
      where: {
        Subject,
        CourseNumber,
      },
    });

    let aggregate = aggregateGPA(instructions);
    let newCourse: Prisma.CourseCreateInput = {
      Subject,
      CourseNumber,
      Label: Subject + " " + CourseNumber,
      TotalEnrollment: aggregate.TotalEnrollment,
      AvgGPA: aggregate.AvgGPA,
    };

    let createdCourse = await prismaClient.course.upsert({
      where: {
        courseConstraint: {
          Subject,
          CourseNumber,
        },
      },
      create: newCourse,
      update: newCourse,
    });

    await connectInstructions(createdCourse, instructions);
  }
}

async function connectInstructions(course: Course, instructions: Instruction[]) {
  console.log("Connecting Courses Instructions: ", course.Subject, course.CourseNumber);
  for (let instruction of instructions) {
    await prismaClient.course.update({
      where: {
        id: course.id,
      },
      data: {
        instructions: {
          connect: {
            id: instruction.id,
          },
        },
      },
    });
  }
}
