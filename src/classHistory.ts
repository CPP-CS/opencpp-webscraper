import { Prisma } from "@prisma/client";
import moment from "moment";
import { prismaClient } from ".";
import classHistory from "./data/classHistory.json";
import { calcAvgGPA, removeInitials, removeJr } from "./utils";

export interface cppSection {
  Term: string | undefined;
  "Academic Group": string | undefined;
  "Academic Org": string | undefined;
  "Class Session": string | undefined;
  Subject: string;
  "Catalog Number": string;
  "Class Number": string;
  "Academic Career": string;
  "Class Description": string;
  "Class Section": string;
  "Instructor ID": string | undefined;
  "Instructor Name": string | undefined;
  "Instruction Mode": string;
  "Meeting Pattern": string | undefined;
  "Enroll Total": string | undefined;
  "Enroll Capacity": string;
  CLASS_START_DATE: string | undefined;
  CLASS_END_DATE: string | undefined;
  "Class Start Time": string | undefined;
  "Class End Time": string | undefined;
  CLASS_MONDAY_MTG1: string | undefined;
  CLASS_TUESDAY_MTG1: string | undefined;
  CLASS_WEDNESDAY_MTG1: string | undefined;
  CLASS_THURSDAY_MTG1: string | undefined;
  CLASS_FRIDAY_MTG1: string | undefined;
  CLASS_SATURDAY_MTG1: string | undefined;
  CLASS_SUNDAY_MTG1: string | undefined;
  "Bronco ID_Count_A": string | undefined;
  "Bronco ID_Count_A-": string | undefined;
  "Bronco ID_Count_B+": string | undefined;
  "Bronco ID_Count_B": string | undefined;
  "Bronco ID_Count_B-": string | undefined;
  "Bronco ID_Count_C+": string | undefined;
  "Bronco ID_Count_C": string | undefined;
  "Bronco ID_Count_C-": string | undefined;
  "Bronco ID_Count_D+": string | undefined;
  "Bronco ID_Count_D": string | undefined;
  "Bronco ID_Count_D-": string | undefined;
  "Bronco ID_Count_F": string | undefined;
}

function parseTime(time: string): string {
  return moment(time, "hh:mm A").format("hh:mm");
}
function parseDate(date: string): string {
  return moment(date, "YYYY-MM-DD").format("YYYY-MM-DD");
}
// fix mistakes in cpp subject data
function fixSubject(subject: string): string {
  switch (subject) {
    case "Animal Hea":
      return "AHS";
    case "Educationa":
      return "EDD";
    case "Engineerin":
      return "EMT";
    case "Math Ed":
      return "MAE";
    default:
      return subject;
  }
}
async function parseSection(section: cppSection): Promise<Prisma.SectionCreateInput> {
  console.log("Loading", section.Term, section["Class Number"]);
  let newData: Prisma.SectionCreateInput = {
    ClassCapacity: parseInt(section["Enroll Capacity"]),
    ClassNumber: parseInt(section["Class Number"]),
    CourseNumber: section["Catalog Number"],
    EndDate: section["CLASS_END_DATE"] ? parseDate(section["CLASS_END_DATE"]) : undefined,
    EndTime: section["Class End Time"] ? parseTime(section["Class End Time"]) : undefined,
    Friday: section["CLASS_FRIDAY_MTG1"] == "Y",
    InstructionMode: section["Instruction Mode"],
    InstructorFirst: section["Instructor Name"] ? removeInitials(section["Instructor Name"].split(",")[1]) : "Staff",
    InstructorLast: section["Instructor Name"] ? removeJr(section["Instructor Name"].split(",")[0]) : "",
    Monday: section["CLASS_MONDAY_MTG1"] == "Y",
    Saturday: section["CLASS_SATURDAY_MTG1"] == "Y",
    Section: section["Class Section"],
    StartDate: section["CLASS_START_DATE"] ? parseDate(section["CLASS_START_DATE"]) : undefined,
    StartTime: section["Class Start Time"] ? parseTime(section["Class Start Time"]) : undefined,
    Subject: fixSubject(section["Subject"]),
    Sunday: section["CLASS_SUNDAY_MTG1"] == "Y",
    Term: section["Term"] || "TermLess",
    Thursday: section["CLASS_THURSDAY_MTG1"] == "Y",
    Tuesday: section["CLASS_TUESDAY_MTG1"] == "Y",
    TotalEnrollment: section["Enroll Total"] ? parseInt(section["Enroll Total"]) : undefined,
    Wednesday: section["CLASS_WEDNESDAY_MTG1"] == "Y",
    A: section["Bronco ID_Count_A"] ? parseInt(section["Bronco ID_Count_A"]) : undefined,
    Am: section["Bronco ID_Count_A-"] ? parseInt(section["Bronco ID_Count_A-"]) : undefined,
    Bp: section["Bronco ID_Count_B+"] ? parseInt(section["Bronco ID_Count_B+"]) : undefined,
    B: section["Bronco ID_Count_B"] ? parseInt(section["Bronco ID_Count_B"]) : undefined,
    Bm: section["Bronco ID_Count_B-"] ? parseInt(section["Bronco ID_Count_B-"]) : undefined,
    Cp: section["Bronco ID_Count_C+"] ? parseInt(section["Bronco ID_Count_C+"]) : undefined,
    C: section["Bronco ID_Count_C"] ? parseInt(section["Bronco ID_Count_C"]) : undefined,
    Cm: section["Bronco ID_Count_C-"] ? parseInt(section["Bronco ID_Count_C-"]) : undefined,
    Dp: section["Bronco ID_Count_D+"] ? parseInt(section["Bronco ID_Count_D+"]) : undefined,
    D: section["Bronco ID_Count_D"] ? parseInt(section["Bronco ID_Count_D"]) : undefined,
    Dm: section["Bronco ID_Count_D-"] ? parseInt(section["Bronco ID_Count_D-"]) : undefined,
    F: section["Bronco ID_Count_F"] ? parseInt(section["Bronco ID_Count_F"]) : undefined,
    instruction: {},
  };
  newData.AvgGPA = calcAvgGPA(newData);

  let { Subject, CourseNumber, InstructorFirst, InstructorLast } = newData;
  newData.instruction = {
    connectOrCreate: {
      where: {
        instructionConstraint: {
          Subject,
          CourseNumber,
          InstructorFirst,
          InstructorLast,
        },
      },
      create: {
        Subject,
        CourseNumber,
        InstructorFirst,
        InstructorLast,
        Course: {
          connectOrCreate: {
            where: {
              courseConstraint: {
                CourseNumber,
                Subject,
              },
            },
            create: {
              CourseNumber,
              Label: Subject + " " + CourseNumber,
              Subject,
            },
          },
        },
        Instructor: {
          connectOrCreate: {
            where: {
              instructorConstraint: {
                InstructorFirst,
                InstructorLast,
              },
            },
            create: {
              InstructorFirst,
              InstructorLast,
              Label: InstructorFirst + " " + InstructorLast,
            },
          },
        },
      },
    },
  };

  return newData;
}

export async function scrapeClassHistory() {
  let sections = classHistory as { [key: string]: cppSection[] };

  let data: Prisma.SectionCreateInput[] = [];

  for (let term in sections) {
    for (let section in sections[term]) {
      let parsed = await parseSection(sections[term][section]);
      data.push(parsed);
    }
  }

  let failed: Prisma.SectionCreateInput[] = [];

  for (let section of data) {
    if (section.Term && section.Subject && section.CourseNumber && section.Section) {
      console.log("Updating", section.Term, section.Subject, section.CourseNumber, section.Section);
      try {
        await prismaClient.section.upsert({
          where: {
            sectionConstraint: {
              Term: section.Term.toString(),
              Subject: section.Subject.toString(),
              CourseNumber: section.CourseNumber.toString(),
              Section: section.Section.toString(),
            },
          },
          update: section,
          create: section,
        });
      } catch (e) {
        failed.push(section);
      }
    }
  }

  console.log("failed updates:", failed);

  // await prismaClient.$transaction(
  //   data.reduce((arr, section) => {
  //     if (section.Term && section.Subject && section.CourseNumber && section.Section)
  //       arr.push(
  //         prismaClient.section.update({
  //           where: {
  //             sectionConstraint: {
  //               Term: section.Term.toString(),
  //               Subject: section.Subject.toString(),
  //               CourseNumber: section.CourseNumber.toString(),
  //               Section: section.Section.toString(),
  //             },
  //           },
  //           data: section,
  //         })
  //       );
  //     return arr;
  //   }, [] as any[])
  // );
}
