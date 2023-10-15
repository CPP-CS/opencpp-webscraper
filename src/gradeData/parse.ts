import moment from "moment";
import classHistory from "./data.json";
import { SectionData, upsertSection } from "../db/utils";
import { parseName } from "../utils";

export interface SectionFormat {
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
  CLASS_START_DATE: string;
  CLASS_END_DATE: string;
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
  return moment(time, "hh:mm A").format("HH:mm:ss");
}
function parseDate(date: string): Date {
  return moment(date, "YYYY-MM-DD").toDate();
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

function parseSection(section: SectionFormat): SectionData {
  console.log("Loading", section.Term, section["Class Number"]);

  let StartTime = section["Class Start Time"] ? parseTime(section["Class Start Time"]) : undefined;
  let EndTime = section["Class End Time"] ? parseTime(section["Class End Time"]) : undefined;

  let newData: SectionData = {
    SectionNumber: section["Class Section"],
    TotalCapacity: parseInt(section["Enroll Capacity"]),
    ClassNumber: parseInt(section["Class Number"]),
    InstructionMode: section["Instruction Mode"],
    TotalEnrollment: section["Enroll Total"] ? parseInt(section["Enroll Total"]) : undefined,

    term: {
      TermName: section["Term"] || "TermLess",
      StartDate: parseDate(section["CLASS_START_DATE"]),
      EndDate: parseDate(section["CLASS_END_DATE"]),
    },
    course: {
      CourseNumber: section["Catalog Number"],
      subject: {
        Name: fixSubject(section["Subject"]),
      },
    },
    event:
      StartTime && EndTime
        ? {
            Sunday: section["CLASS_SUNDAY_MTG1"] == "Y",
            Monday: section["CLASS_MONDAY_MTG1"] == "Y",
            Tuesday: section["CLASS_TUESDAY_MTG1"] == "Y",
            Wednesday: section["CLASS_WEDNESDAY_MTG1"] == "Y",
            Thursday: section["CLASS_THURSDAY_MTG1"] == "Y",
            Friday: section["CLASS_FRIDAY_MTG1"] == "Y",
            Saturday: section["CLASS_SATURDAY_MTG1"] == "Y",

            StartTime,
            EndTime,
          }
        : undefined,
    professor: parseName(section["Instructor Name"] || ""),

    gradeData: {
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
    },
  };

  return newData;
}

export async function scrapeClassHistory() {
  let sections = classHistory as unknown as SectionFormat[];
  let failed: SectionData[] = [];

  for (let i = 0; i < sections.length; i += 1000) {
    console.log(`Loading sections ${i} through ${Math.min(i + 1000, sections.length - 1)}`);
    const data = sections.slice(i, Math.min(i + 1000, sections.length - 1)).map((section) => parseSection(section));
    for (const [ind, section] of Object.entries(data)) {
      try {
        await upsertSection(section);
        console.log(
          `Updating [${parseInt(ind) + 1} / ${data.length}]`,
          section.term.TermName,
          section.course.subject.Name,
          section.course.CourseNumber,
          section.SectionNumber
        );
      } catch (e) {
        console.log(
          `Failed [${parseInt(ind) + 1} / ${data.length}]`,
          section.term.TermName,
          section.course.subject.Name,
          section.course.CourseNumber,
          section.SectionNumber,
          e
        );
        failed.push(section);
      }
    }
  }

  console.log("failed updates:", failed);
}
