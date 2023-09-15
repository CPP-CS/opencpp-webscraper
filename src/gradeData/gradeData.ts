import { Op } from "sequelize";
import { Course, GradeData, Instruction, Professor, Section } from "../db/db";
import { addGPAData, calcGPAData, resetGPAData } from "./utils";

export const updateGradeData = async () => {
  let sections = await Section.findAll({
    include: [
      {
        model: GradeData,
        required: true,
        as: "gradeData",
      },
    ],
  });
  await Promise.all(
    sections.map(async (section, ind) => {
      if (!section.gradeData) throw new Error("GradeData is missing from section");

      await resetGPAData(section);

      let [AvgGPA, GradePoints] = calcGPAData(section.gradeData);
      (section.AvgGPA = AvgGPA), (section.GradePoints = GradePoints);
      await section.save();
      console.log(`Calculated GPA Data for Section [${ind + 1}/${sections.length}]`);
    })
  );

  let instructions = await Instruction.findAll({
    include: [
      {
        model: Section,
        required: true,
        where: {
          AvgGPA: {
            [Op.ne]: null,
          },
        },
        as: "sections",
      },
    ],
  });
  await Promise.all(
    instructions.map(async (instruction, ind) => {
      if (!instruction.sections) throw new Error(`Instruction ${instruction.id} is missing sections`);

      await resetGPAData(instruction);

      await Promise.all(
        instruction.sections.map(async (section) => {
          if (section.AvgGPA === null)
            throw new Error(`Section ${section.id} AvgGPA is null, it should not have been returned from the query`);
          addGPAData(section.AvgGPA, section.GradePoints, instruction);
        })
      );
      await instruction.save();
      console.log(`Calculated GPA data for instruction [${ind + 1}/${instructions.length}]`);
    })
  );

  let courses = await Course.findAll({
    include: [
      {
        model: Instruction,
        required: true,
        where: {
          AvgGPA: {
            [Op.ne]: null,
          },
        },
        as: "instructions",
      },
    ],
  });
  await Promise.all(
    courses.map(async (course, ind) => {
      if (!course.instructions) throw new Error(`Course ${course.id} is missing instructions`);

      await resetGPAData(course);

      await Promise.all(
        course.instructions.map(async (instruction) => {
          if (instruction.AvgGPA === null)
            throw new Error(
              `Instruction ${instruction.id} AvgGPA is null, it should not have been returned from the query`
            );
          addGPAData(instruction.AvgGPA, instruction.GradePoints, course);
        })
      );
      await course.save();
      console.log(`Calculated GPA data for course [${ind + 1}/${courses.length}]`);
    })
  );

  let professors = await Professor.findAll({
    include: [
      {
        model: Instruction,
        required: true,
        where: {
          AvgGPA: {
            [Op.ne]: null,
          },
        },
        as: "instructions",
      },
    ],
  });
  await Promise.all(
    professors.map(async (professor, ind) => {
      if (!professor.instructions) throw new Error(`Professor ${professor.id} is missing instructions`);

      await resetGPAData(professor);

      await Promise.all(
        professor.instructions.map(async (instruction) => {
          if (instruction.AvgGPA === null)
            throw new Error(
              `Instruction ${instruction.id} AvgGPA is null, it should not have been returned from the query`
            );
          addGPAData(instruction.AvgGPA, instruction.GradePoints, professor);
        })
      );
      await professor.save();
      console.log(`Calculated GPA data for professor [${ind + 1}/${professors.length}]`);
    })
  );
};
