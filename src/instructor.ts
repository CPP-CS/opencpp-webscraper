import { Instruction, Instructor, Prisma } from "@prisma/client";
import { prismaClient } from ".";
import { aggregateGPA } from "./utils";
export async function createInstructors() {
  let instructors = await prismaClient.instruction.findMany({
    distinct: ["InstructorFirst", "InstructorLast"],
    select: {
      InstructorFirst: true,
      InstructorLast: true,
    },
  });

  for (let instructor of instructors) {
    const { InstructorFirst, InstructorLast } = instructor;

    // find instructions
    let instructions = await prismaClient.instruction.findMany({
      where: {
        InstructorFirst,
        InstructorLast,
      },
    });

    let aggregate = aggregateGPA(instructions);
    let newInstructor: Prisma.InstructorCreateInput = {
      InstructorFirst,
      InstructorLast,
      Label: InstructorFirst + " " + InstructorLast,
      TotalEnrollment: aggregate.TotalEnrollment,
      AvgGPA: aggregate.AvgGPA,
    };

    let createdInstructor = await prismaClient.instructor.upsert({
      where: {
        instructorConstraint: {
          InstructorFirst: InstructorFirst || "Staff",
          InstructorLast: InstructorLast || "",
        },
      },
      create: newInstructor,
      update: newInstructor,
    });

    await connectInstructions(createdInstructor, instructions);
  }
}

async function connectInstructions(instructor: Instructor, instructions: Instruction[]) {
  console.log("Connecting Instructor Instructions: ", instructor.InstructorFirst, instructor.InstructorLast);
  for (let instruction of instructions) {
    await prismaClient.instructor.update({
      where: {
        id: instructor.id,
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
