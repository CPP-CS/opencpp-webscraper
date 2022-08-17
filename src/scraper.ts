import puppeteer, { Page } from "puppeteer";
import moment from "moment";
import { removeInitials, removeJr } from "./utils";
import { Prisma, Section } from "@prisma/client";
import { prismaClient } from ".";
import { courseComponents, terms } from "./constants";

let failedSections: Section[] = [];
async function upsertSection(section: Prisma.SectionCreateInput) {
  console.log("sending to database", section.ClassNumber, section.Subject, section.CourseNumber, section.Section);
  await prismaClient.section.upsert({
    where: {
      sectionConstraint: {
        Term: section.Term,
        Subject: section.Subject,
        CourseNumber: section.CourseNumber,
        Section: section.Section,
      },
    },
    create: section,
    update: section,
  });
}
function parseTime(time: string): string {
  return moment(time, "hh:mm A").format("HH:mm");
}
function parseDate(date: string): string {
  return moment(date, "YYYY-MM-DD").format("YYYY-MM-DD");
}

async function scrapePage(page: Page, term: string, courseComponent: string) {
  let data: Prisma.SectionCreateInput[] = [];

  let sections = await page.$$("#class_list>ol>li");
  for (let section of sections) {
    let Term: string = term;
    let Component: string = courseComponent;
    let courseTitleCell = await section.$(".ClassTitle");
    let courseTitle: string = await page.evaluate((el) => el.textContent, courseTitleCell);

    //subject and course number
    let Subject: string = courseTitle.split(" ")[0];
    let CourseNumber: string = courseTitle.split(" ")[1];
    let Section: string = (await page.evaluate((el) => el.innerText, section))
      .split(" ")[3]
      .split("Class")[0]
      .replace("\n", "");

    console.log("scraping data", Subject, CourseNumber, Section);

    //class number
    let classNumberCell = await section.$("[id$='TableCell13']");
    let ClassNumber: number = await page.evaluate((el) => parseInt(el.textContent), classNumberCell);

    //class capacity
    let classCapacityCell = await section.$("[id$='TableCell14']");
    let ClassCapacity: number = await page.evaluate((el) => parseInt(el.textContent), classCapacityCell);

    //class title
    let classTitleCell = await section.$("[id$='TableCell8']");
    let ClassTitle: string = await page.evaluate((el) => el.textContent, classTitleCell);

    // units
    let unitsCell = await section.$("[id$='TableCell9']");
    let Units: number = eval(await page.evaluate((el) => el.textContent, unitsCell));

    // time and days
    let timeCell = await section.$("[id$='TableCell1']");
    let time = await page.evaluate((el) => el.textContent, timeCell);

    let days = time.split(/\s\s\s/)[1];
    let Sunday: boolean = false;
    let Monday: boolean = false;
    let Tuesday: boolean = false;
    let Wednesday: boolean = false;
    let Thursday: boolean = false;
    let Friday: boolean = false;
    let Saturday: boolean = false;

    if (days.includes("Su")) Sunday = true;
    if (days.includes("M")) Monday = true;
    if (days.includes("Tu")) Tuesday = true;
    if (days.includes("W")) Wednesday = true;
    if (days.includes("Th")) Thursday = true;
    if (days.includes("F")) Friday = true;
    if (days.includes("Sa")) Saturday = true;

    time = time.split(/(\s\s\s)/)[0];
    let StartTime: string | undefined = undefined;
    let EndTime: string | undefined = undefined;
    if (time == "No time set.") {
    } else {
      StartTime = parseTime(time.split("–")[0]);
      EndTime = parseTime(time.split("–")[1]);
    }

    //location
    let locationCell = await section.$("[id$='TableCell2']");
    let Location: string | undefined = await page.evaluate((el) => el.textContent, locationCell);
    if (Location == "") Location = undefined;

    //dates
    let dateCell = await section.$("[id$='TableCell12']");
    let date = await page.evaluate((el) => el.textContent, dateCell);
    let StartDate = parseDate(date.split(/\sto\s/)[0]);
    let EndDate = parseDate(date.split(/\sto\s/)[1]);

    //instructor
    let instructorCell = await section.$("[id$='TableCell4']");
    let instructor = await page.evaluate((el) => el.textContent, instructorCell);
    instructor = instructor.replace(/^\s+|\s+$/g, "");
    let InstructorFirst: string = "Staff";
    let InstructorLast: string = "";
    if (!(instructor.includes("Staff") || instructor == "")) {
      InstructorLast = removeJr(instructor.split(/\n/)[0].split(/,\s/)[0]);
      InstructorFirst = removeInitials(instructor.split(/\n/)[0].split(/,\s/)[1]);
    }

    //component and mode
    let componentAndModeCell = await section.$("[id$='TableCell10']");
    let componentAndMode = await page.evaluate((el) => el.textContent, componentAndModeCell);
    let InstructionMode: string = componentAndMode.split(/,\s/)[1];

    console.log("loading", ClassNumber, Subject, CourseNumber, Section);
    data.push({
      Term: Term,
      Component: Component,
      Subject: Subject,
      CourseNumber: CourseNumber,
      Section: Section,
      ClassNumber: ClassNumber,
      ClassCapacity: ClassCapacity,
      Units: Units,
      Sunday: Sunday,
      Monday: Monday,
      Tuesday: Tuesday,
      Wednesday: Wednesday,
      Thursday: Thursday,
      Friday: Friday,
      Saturday: Saturday,
      StartTime: StartTime,
      EndTime: EndTime,
      Location: Location,
      StartDate: StartDate,
      EndDate: EndDate,
      InstructorFirst: InstructorFirst,
      InstructorLast: InstructorLast,
      InstructionMode: InstructionMode,
      instruction: {
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
                  CourseTitle: ClassTitle,
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
      },
    });
  }

  console.log("inserting data");
  await prismaClient.$transaction(
    data.map((curr) =>
      prismaClient.section.upsert({
        where: {
          sectionConstraint: {
            Term: curr.Term,
            Subject: curr.Subject,
            CourseNumber: curr.CourseNumber,
            Section: curr.Section,
          },
        },
        update: curr,
        create: curr,
      })
    )
  );
}

export async function scrapePublicSchedule(current?: boolean) {
  // open launcher and go to page
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto("https://schedule.cpp.edu/");

  // gets terms to be parsed
  let currIndex = Object.entries(terms).findIndex((term) => {
    return term[0] == process.env.CURRENT_TERM;
  });
  let parsingTerms = Object.entries(terms).slice(currIndex);
  if (!current) parsingTerms = Object.entries(terms);
  console.log(parsingTerms);

  // scrape through each term
  for (let [term, termKey] of parsingTerms) {
    for (let courseComponentKey in courseComponents) {
      // input
      const courseComponent = courseComponents[courseComponentKey];
      console.log("Parsing ", term, courseComponent);
      await page.select("select#ctl00_ContentPlaceHolder1_TermDDL", termKey.toString());
      await page.select("select#ctl00_ContentPlaceHolder1_CourseComponentDDL", courseComponentKey);

      // search
      let searchButton = await page.$("#ctl00_ContentPlaceHolder1_SearchButton");
      await Promise.all([
        page.waitForNavigation({
          timeout: 300000,
          waitUntil: "load",
        }),
        searchButton!.evaluate((b) => b.click()),
      ]);

      // search results
      await scrapePage(page, term, courseComponent);
    }
  }
  await browser.close();
  console.log(JSON.stringify(failedSections));
}
exports.scrapePublicSchedule = scrapePublicSchedule;
