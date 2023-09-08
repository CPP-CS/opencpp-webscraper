import { before, describe } from "mocha";
import { syncModels } from "../src/commands/syncModels";
import { truncateAllTables } from "../src/commands/truncateAllTables";
import { SectionData, upsertSection } from "../src/db/utils";
import { Course, GradeData, Instruction, Section } from "../src/db/models";
import assert from "assert";

beforeEach("Reset DB", async function () {
  this.timeout(10000);
  await truncateAllTables();
  await syncModels();
});

describe("Updating gradeData", () => {
  let testSection: SectionData = {
    ClassNumber: 1,
    InstructionMode: "instructionMode",
    SectionNumber: "1",
    TotalCapacity: 1,
    gradeData: {
      A: 1,
    },
    term: {
      TermName: "termName",
      StartDate: new Date(),
      EndDate: new Date(),
    },
    course: {
      CourseNumber: "1",
      subject: {
        Subject: "subject",
      },
    },
    professor: {
      Name: "professorName",
    },
  };
  it("Should update GradePoints", async () => {
    await upsertSection(testSection);
    let course = await Course.findOne({
      where: {
        CourseNumber: "1",
      },
      include: [
        {
          model: Instruction,
          as: "instructions",
          include: [
            {
              model: Section,
              as: "sections",
              include: [
                {
                  model: GradeData,
                  as: "gradeData",
                },
              ],
            },
          ],
        },
      ],
    });
    assert.equal(course?.GradePoints, 1, JSON.stringify(course?.toJSON()));
  });
  it("Should overwrite GradePoints", async () => {
    await upsertSection(testSection);
    let course = await Course.findOne({
      where: {
        CourseNumber: "1",
      },
      include: [
        {
          model: Instruction,
          as: "instructions",
          include: [
            {
              model: Section,
              as: "sections",
              include: [
                {
                  model: GradeData,
                  as: "gradeData",
                },
              ],
            },
          ],
        },
      ],
    });

    assert.equal(course?.GradePoints, 1, JSON.stringify(course?.toJSON()));

    await upsertSection(testSection);
    await course?.reload();
    assert.equal(course?.GradePoints, 1, JSON.stringify(course?.toJSON()));
  });
});