import puppeteer, { Page } from "puppeteer";
import { parseTime, parseDate } from "../utils";
import { courseComponents, terms } from "../constants";
import { Section } from "../db/models";
import { SectionData, upsertSection } from "../db/utils";
import envVars from "../envVars";

let failedSections: Section[] = [];

async function scrapePage(page: Page, term: string, courseComponent: string): Promise<SectionData[]> {
  let sections = await page.$$("#class_list>ol>li");
  let sectionData: SectionData[] = [];
  await Promise.all(
    sections.map(async (section): Promise<void> => {
      let courseTitleCell = await section.$(".ClassTitle");
      let courseTitle: string = await page.evaluate((el) => el.textContent, courseTitleCell);

      //subject and course number
      let Subject: string = courseTitle.split(" ")[0];
      let CourseNumber: string = courseTitle.split(" ")[1];
      let SectionNumber: string = (await page.evaluate((el) => el.innerText, section))
        .split(" ")[3]
        .split("Class")[0]
        .replace("\n", "");

      //class number
      let classNumberCell = await section.$("[id$='TableCell13']");
      let ClassNumber: number = await page.evaluate((el) => parseInt(el.textContent), classNumberCell);

      //class capacity
      let classCapacityCell = await section.$("[id$='TableCell14']");
      let TotalCapacity: number = await page.evaluate((el) => parseInt(el.textContent), classCapacityCell);

      //class title
      let classTitleCell = await section.$("[id$='TableCell8']");
      let ClassTitle: string = await page.evaluate((el) => el.textContent, classTitleCell);

      // units
      let unitsCell = await section.$("[id$='TableCell9']");
      let Units: number = parseFloat(eval(await page.evaluate((el) => el.textContent, unitsCell)));

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
      let Location: string = await page.evaluate((el) => el.textContent, locationCell);
      let Building: string | undefined;
      let Room: string | undefined;
      if (Location !== "") {
        let match = Location.match(/Bldg ([\w-]+) Rm ([\w-]+)/);
        if (match !== null) {
          Building = match[0];
          Room = match[1];
        } else {
          console.log(`Couldn't parse Location '${Location}'`);
        }
      }

      //dates
      let dateCell = await section.$("[id$='TableCell12']");
      let date = await page.evaluate((el) => el.textContent, dateCell);
      let StartDate = parseDate(date.split(/\sto\s/)[0]);
      let EndDate = parseDate(date.split(/\sto\s/)[1]);

      //instructor
      let instructorCell = await section.$("[id$='TableCell4']");
      let instructor: string = await page.evaluate((el) => el.textContent, instructorCell);
      // TODO: Handle Multiple Professors
      instructor = instructor.replace(/^\s+|\s+$/g, "").split("\n")[0];

      //component and mode
      let componentAndModeCell = await section.$("[id$='TableCell10']");
      let componentAndMode = await page.evaluate((el) => el.textContent, componentAndModeCell);
      let InstructionMode: string = componentAndMode.split(/,\s/)[1];

      sectionData.push({
        SectionNumber,
        TotalCapacity,
        InstructionMode,
        ClassNumber,
        term: {
          TermName: term,
          StartDate: StartDate,
          EndDate: EndDate,
        },
        course: {
          CourseNumber: CourseNumber,
          CourseTitle: ClassTitle,
          CourseType: courseComponent,
          Units,
          subject: {
            Subject: Subject,
          },
        },
        professor: {
          Name: instructor ?? "Staff",
        },
        event:
          StartTime && EndTime
            ? {
                Sunday,
                Monday,
                Tuesday,
                Wednesday,
                Thursday,
                Friday,
                Saturday,
                StartTime,
                EndTime,
                location:
                  Building && Room
                    ? {
                        Building,
                        Room,
                      }
                    : undefined,
              }
            : undefined,
      });
    })
  );
  return sectionData;
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
    return term[0] == envVars.currentTerm;
  });
  let parsingTerms = Object.entries(terms).slice(currIndex);
  if (!current) parsingTerms = Object.entries(terms);

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
      try {
        let sectionData = await scrapePage(page, term, courseComponent);
        console.log(`Successfully parsed ${sectionData.length} sections, starting data upsert`);
        await Promise.all(
          sectionData.map(async (section, ind) => {
            await upsertSection(section);
            console.log(
              `Updated [${ind + 1} / ${sectionData.length}]`,
              section.ClassNumber,
              section.course.subject.Subject,
              section.course.CourseNumber
            );
          })
        );
      } catch (e) {
        console.log(`Failed to process ${term} ${courseComponent}: ${e}`);
      }
    }
  }
  await browser.close();

  console.log(JSON.stringify(failedSections));
}
