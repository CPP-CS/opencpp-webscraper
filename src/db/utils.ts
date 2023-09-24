import { CreationAttributes, Op } from "sequelize";
import { Course, GradeData, Instruction, Location, Professor, Section, Subject, Term, Event } from "./db";

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

// Checks to see if there is an existing row that matches the professor. If there is, it tries updating
// the existing row. Otherwise it makes a new one. Prioritizes same middle/suffixes, but if there are
// multiple possibilities and no middle/suffix provided, it creates a whole new professor.
export const upsertProfessor = async (professorData: CreationAttributes<Professor>): Promise<number> => {
  let { FirstName, MiddleName, LastName, Suffix } = professorData;

  // Special Staff case
  if (!LastName) {
    if (FirstName !== "Staff") throw new Error(`No LastName but not Staff? ${JSON.stringify(professorData)}`);
    return (await Professor.upsert(professorData))[0].id;
  }

  const existing = await Professor.findAll({
    where: {
      FirstName,
      MiddleName: {
        [Op.or]: [MiddleName ?? null, null],
      },
      LastName,
      Suffix: {
        [Op.or]: [Suffix ?? null, null],
      },
    },
  });

  // If there's only one possibility
  if (existing.length === 1) {
    return (await existing[0].update(professorData)).id;
  }

  // Same Middle & Suffix
  const same = existing.find((prof) => prof.MiddleName == MiddleName && prof.Suffix == Suffix);
  if (same) return (await same.update(professorData)).id;

  // Same Middle initial or Suffix
  const similar = existing.find(
    (prof) =>
      prof.MiddleName &&
      MiddleName &&
      (prof.MiddleName.slice(0, 1) === MiddleName.slice(0, 1) || prof.Suffix === Suffix)
  );
  if (similar) {
    // Don't update middle name if adding initial to something that already has full middle name.
    if (similar.MiddleName && similar.MiddleName.length > 1 && (!MiddleName || MiddleName.length <= 1))
      professorData.MiddleName = similar.MiddleName;
    return (await similar.update(professorData)).id;
  }

  // Fallback to just upserting
  return (await Professor.upsert(professorData))[0].id;
};

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
          ProfessorId: await upsertProfessor(sectionData.professor),
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

// Makes sure GradePoints is 0 when avgGpa is null, otherwise some logic error occurred
export function validateGradePoints(model: Section | Instruction | Course | Professor) {
  if (model.AvgGPA === null && model.GradePoints !== 0)
    throw new Error(`AvgGpa is null and Gradepoints is ${model.GradePoints} on ${JSON.stringify(model)}`);
}
