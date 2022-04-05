import puppeteer, { Page } from "puppeteer";
import moment from "moment";
import { removeInitials, removeJr } from "./utils";
import { Prisma, Section } from "@prisma/client";
import { prisma } from ".";
let terms: { [key: number]: string } = {
  2233: "SP 2023",
  2231: "W 2023",
  2227: "F 2022",
  2225: "SU 2022",
  2223: "SP 2022",
  2221: "W 2022",
  2217: "F 2021",
  2215: "SU 2021",
  2213: "SP 2021",
  2211: "W 2021",
  2207: "F 2020",
  2205: "SU 2020",
  2203: "SP 2020",
  2201: "W 2020",
  2197: "F 2019",
  2195: "SU 2019",
};
let courseComponents: { [key: string]: string } = {
  ACT: "Activity",
  CLN: "Clinical",
  IND: "Independent Study",
  LAB: "Laboratory",
  LEC: "Lecture",
  PRA: "Practicum",
  SEM: "Seminar",
  SUP: "Supervision",
  THE: "Thesis Research",
};

let failedSections: Section[] = [];
async function updateSection(section: Prisma.SectionCreateInput) {
  console.log("sending to database", section.ClassNumber, section.Subject, section.CourseNumber, section.Section);
  let existingSection = await prisma.section.upsert({
    where: {
      sectionConstraint: {
        Subject: section.Subject,
        CourseNumber: section.CourseNumber,
        Section: section.Section,
      },
    },
    create: section,
    update: section,
  });
}
function parseTime(time: string): Date {
  return moment(time, "hh:mm A").toDate();
}
function parseDate(date: string): Date {
  return moment(date, "YYYY-MM-DD").toDate();
}

async function scrapePage(page: Page, term: string, courseComponent: string) {
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
    let Sunday: boolean | undefined = undefined;
    let Monday: boolean | undefined = undefined;
    let Tuesday: boolean | undefined = undefined;
    let Wednesday: boolean | undefined = undefined;
    let Thursday: boolean | undefined = undefined;
    let Friday: boolean | undefined = undefined;
    let Saturday: boolean | undefined = undefined;
    if (days !== "TBA") {
      Sunday = false;
      Monday = false;
      Tuesday = false;
      Wednesday = false;
      Thursday = false;
      Friday = false;
      Saturday = false;

      if (days.includes("Su")) Sunday = true;
      if (days.includes("M")) Monday = true;
      if (days.includes("Tu")) Tuesday = true;
      if (days.includes("W")) Wednesday = true;
      if (days.includes("Th")) Thursday = true;
      if (days.includes("F")) Friday = true;
      if (days.includes("Sa")) Saturday = true;
    }

    time = time.split(/(\s\s\s)/)[0];
    let StartTime: Date | undefined = undefined;
    let EndTime: Date | undefined = undefined;
    if (time == "No time set.") {
    } else {
      StartTime = parseTime(time.split("–")[0]);
      EndTime = parseTime(time.split("–")[1]);
    }

    //location
    let locationCell = await section.$("[id$='TableCell2']");
    let Location = await page.evaluate((el) => el.textContent, locationCell);
    if (Location == "") Location = null;

    //dates
    let dateCell = await section.$("[id$='TableCell12']");
    let date = await page.evaluate((el) => el.textContent, dateCell);
    let StartDate = parseDate(date.split(/\sto\s/)[0]);
    let EndDate = parseDate(date.split(/\sto\s/)[1]);

    //instructor
    let instructorCell = await section.$("[id$='TableCell4']");
    let instructor = await page.evaluate((el) => el.textContent, instructorCell);
    instructor = instructor.replace(/^\s+|\s+$/g, "");
    let InstructorFirst: string | undefined = undefined;
    let InstructorLast: string | undefined = undefined;
    if (instructor.includes("Staff") || instructor == "") {
    } else {
      InstructorLast = removeJr(instructor.split(/\n/)[0].split(/,\s/)[0]);
      InstructorFirst = removeInitials(instructor.split(/\n/)[0].split(/,\s/)[1]);
    }

    //component and mode
    let componentAndModeCell = await section.$("[id$='TableCell10']");
    let componentAndMode = await page.evaluate((el) => el.textContent, componentAndModeCell);
    let InstructionMode: string = componentAndMode.split(/,\s/)[1];

    await updateSection({
      Term: Term || null,
      Component: Component || null,
      Subject: Subject,
      CourseNumber: CourseNumber,
      Section: Section,
      ClassNumber: ClassNumber || null,
      ClassCapacity: ClassCapacity || null,
      ClassTitle: ClassTitle || null,
      Units: Units || null,
      Sunday: Sunday || null,
      Monday: Monday || null,
      Tuesday: Tuesday || null,
      Wednesday: Wednesday || null,
      Thursday: Thursday || null,
      Friday: Friday || null,
      Saturday: Saturday || null,
      StartTime: StartTime || null,
      EndTime: EndTime || null,
      Location: Location || null,
      StartDate: StartDate || null,
      EndDate: EndDate || null,
      InstructorFirst: InstructorFirst || null,
      InstructorLast: InstructorLast || null,
      InstructionMode: InstructionMode || null,
    });
  }
}

export async function scrapePublicSchedule() {
  for (let termKey in terms) {
    const term = terms[termKey];
    for (let courseComponentKey in courseComponents) {
      const courseComponent = courseComponents[courseComponentKey];
      console.log("Parsing ", term, courseComponent);
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();
      await page.goto("https://schedule.cpp.edu/");
      await page.select("select#ctl00_ContentPlaceHolder1_TermDDL", termKey);
      await page.select("select#ctl00_ContentPlaceHolder1_CourseComponentDDL", courseComponentKey);
      await Promise.all([
        page.waitForNavigation({
          timeout: 300000,
          waitUntil: "load",
        }),
        page.click("#ctl00_ContentPlaceHolder1_SearchButton"),
      ]);

      await scrapePage(page, term, courseComponent);

      await browser.close();
    }
  }
  console.log(JSON.stringify(failedSections));
}
exports.scrapePublicSchedule = scrapePublicSchedule;
