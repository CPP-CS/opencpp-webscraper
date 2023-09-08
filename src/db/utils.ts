import { CreationAttributes, Model } from "sequelize";
import { Term, Section, Subject, Course, Professor, Event, Location, GradeData, Instruction } from "./models";
import { GPA } from "../constants";

export type SectionData = Omit<
  CreationAttributes<Section> & {
    term: CreationAttributes<Term>;
    course: CreationAttributes<Course> & {
      subject: CreationAttributes<Subject>;
    };
    professor: CreationAttributes<Professor>;
    gradeData?: CreationAttributes<GradeData>;
    event?: CreationAttributes<Event> & {
      location?: CreationAttributes<Location>;
    };
  },
  "Course"
>;

// Populates tables based on an individual section. Note that certain fields are optional.
export const upsertSection = async (sectionData: SectionData) => {
  let section = (
    await Section.upsert({
      SectionNumber: sectionData.SectionNumber,
      TotalEnrollment: sectionData.TotalEnrollment,
      TotalCapacity: sectionData.TotalCapacity,
      InstructionMode: sectionData.InstructionMode,
      ClassNumber: sectionData.ClassNumber,
      Course: sectionData.course.subject.Subject + sectionData.course.CourseNumber,
      TermId: (await Term.upsert(sectionData.term))[0].id,
      InstructionId: (
        await Instruction.upsert({
          ProfessorId: (await Professor.upsert(sectionData.professor))[0].id,
          CourseId: (
            await Course.upsert({
              CourseNumber: sectionData.course.CourseNumber,
              CourseType: sectionData.course.CourseType,
              CourseTitle: sectionData.course.CourseTitle,
              CreditOnly: sectionData.course.CreditOnly,
              Units: sectionData.course.Units,
              SubjectId: (await Subject.upsert(sectionData.course.subject))[0].id,
            })
          )[0].id,
        })
      )[0].id,
    })
  )[0];

  if (sectionData.gradeData) {
    await GradeData.upsert({
      ...sectionData.gradeData,
      SectionId: section.id,
    });
  }

  if (sectionData.event) {
    let location: Location | undefined;
    if (sectionData.event.location) {
      location = (
        await Location.upsert({
          Building: sectionData.event.location.Building,
          Room: sectionData.event.location.Room,
        })
      )[0];
    }
    await Event.upsert({
      ...sectionData.event,
      SectionId: section.id,
      LocationId: location ? location.id : undefined,
    });
  }
};

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

export async function removeGPAData(
  avgGpa: number,
  gradePoints: number,
  model: Section | Instruction | Course | Professor
) {
  await addGPAData(avgGpa, -gradePoints, model);
}

// Makes sure GradePoints is 0 when avgGpa is null, otherwise some logic error occurred
export function validateGradePoints(model: Section | Instruction | Course | Professor) {
  if (model.AvgGPA === null && model.GradePoints !== 0)
    throw new Error(`AvgGpa is null and Gradepoints is ${model.GradePoints} on ${JSON.stringify(model)}`);
}
