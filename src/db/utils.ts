import { CreationAttributes } from "sequelize";
import { Term, Section, Subject, Course, Professor, Event, Location, GradeData, Instruction } from "./models";

export type SectionData = Omit<
  CreationAttributes<Section> & {
    term: CreationAttributes<Term>;
    course: CreationAttributes<Course> & {
      subject: CreationAttributes<Subject>;
    };
    professor?: CreationAttributes<Professor>;
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
          ProfessorId: sectionData.professor ? (await Professor.upsert(sectionData.professor))[0].id : undefined,
          CourseId: (
            await Course.upsert({
              CourseNumber: sectionData.course.CourseNumber,
              CourseType: sectionData.course.CourseType,
              CourseTitle: sectionData.course.CourseTitle,
              CreditOnly: sectionData.course.CreditOnly,
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
