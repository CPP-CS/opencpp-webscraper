import { Instruction, Prisma, Section } from "@prisma/client";
import { prismaClient } from ".";
import { aggregateGPA } from "./utils";

export async function createInstructions() {
  let instructions = await prismaClient.section.findMany({
    distinct: ["Subject", "CourseNumber", "InstructorFirst", "InstructorLast"],
    select: {
      Subject: true,
      CourseNumber: true,
      InstructorFirst: true,
      InstructorLast: true,
    },
  });
  for (let instruction of instructions) {
    const { Subject, CourseNumber, InstructorFirst, InstructorLast } = instruction;

    // get matching sections
    let sections = await prismaClient.section.findMany({
      where: {
        Subject,
        CourseNumber,
        InstructorFirst,
        InstructorLast,
      },
    });

    let aggregate = aggregateGPA(sections);
    let newInstruction: Prisma.InstructionCreateInput = {
      Subject,
      CourseNumber,
      InstructorFirst: InstructorFirst || "Staff",
      InstructorLast: InstructorLast || "",
      TotalEnrollment: aggregate.TotalEnrollment,
      AvgGPA: aggregate.AvgGPA,
    };

    // create instruction
    let createdInstruction = await prismaClient.instruction.upsert({
      where: {
        instructionConstraint: {
          InstructorFirst: InstructorFirst || "Staff",
          InstructorLast: InstructorLast || "",
          Subject,
          CourseNumber,
        },
      },
      create: newInstruction,
      update: newInstruction,
    });

    await connectSections(createdInstruction, sections);
  }
}

async function connectSections(instruction: Instruction, sections: Section[]) {
  console.log(
    "Connecting Instruction Sections: ",
    instruction.Subject,
    instruction.CourseNumber,
    instruction.InstructorFirst,
    instruction.InstructorLast
  );
  for (let section of sections) {
    await prismaClient.instruction.update({
      where: {
        id: instruction.id,
      },
      data: {
        sections: {
          connect: {
            id: section.id,
          },
        },
      },
    });
  }
}
