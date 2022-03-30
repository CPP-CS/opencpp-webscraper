const puppeteer = require("puppeteer");
const moment = require("moment");
const { Section } = require("./index");
const { removeInitials, removeJr } = require("./utils");
let terms = {
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
let courseComponents = {
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

let failedSections = [];
async function updateSection(section) {
  let existingSection = await Section.findOne({ where: { Term: section.term, ClassNumber: section.classNumber } });
  let newData = {
    Term: section.term,
    ClassCapacity: section.classCapacity,
    ClassTitle: section.classTitle,
    ClassNumber: section.classNumber,
    CourseNumber: section.courseNumber,
    Section: section.section,
    Subject: section.subject,
    Component: section.courseComponent,
    Location: section.location,
    Units: section.units,
    Sunday: section.sunday,
    Monday: section.monday,
    Tuesday: section.tuesday,
    Wednesday: section.wednesday,
    Thursday: section.thursday,
    Friday: section.friday,
    Saturday: section.saturday,
    StartTime: section.startTime,
    EndTime: section.endTime,
    StartDate: section.startDate,
    EndDate: section.endDate,
    InstructorLast: section.instructorLast,
    InstructorFirst: section.instructorFirst,
    InstructionMode: section.instructionMode,
  };
  try {
    console.log("sending to database", section.classNumber, section.subject, section.courseNumber, section.section);
    if (!existingSection) {
      await Section.create(newData);
    } else {
      existingSection.set(newData);
      await existingSection.save();
    }
  } catch (e) {
    section.error = e;
    failedSections.push(section);
  }
}
function parseTime(time) {
  return moment(time, "hh:mm A").format("HH:mm:ss");
}

async function scrapeSite(page, termKey, courseComponentKey) {
  let sections = await page.$$("#class_list>ol>li");

  let term = terms[termKey];
  let courseComponent = courseComponents[courseComponentKey];
  for (let section of sections) {
    let sectionInstance = {
      term: term,
      courseComponent: courseComponent,
    };
    let courseTitleCell = await section.$(".ClassTitle");
    courseTitle = await page.evaluate((el) => el.textContent, courseTitleCell);

    //subject and course number
    sectionInstance.subject = courseTitle.split(" ")[0];
    sectionInstance.courseNumber = courseTitle.split(" ")[1];
    sectionInstance.section = (await page.evaluate((el) => el.innerText, section))
      .split(" ")[3]
      .split("Class")[0]
      .replace("\n", "");

    console.log("scraping data", sectionInstance.subject, sectionInstance.courseNumber, sectionInstance.section);

    //class number
    let classNumberCell = await section.$("[id$='TableCell13']");
    sectionInstance.classNumber = await page.evaluate((el) => el.textContent, classNumberCell);

    //class capacity
    let classCapacityCell = await section.$("[id$='TableCell14']");
    sectionInstance.classCapacity = await page.evaluate((el) => el.textContent, classCapacityCell);

    //class title
    let classTitleCell = await section.$("[id$='TableCell8']");
    sectionInstance.classTitle = await page.evaluate((el) => el.textContent, classTitleCell);

    // units
    let unitsCell = await section.$("[id$='TableCell9']");
    sectionInstance.units = eval(await page.evaluate((el) => el.textContent, unitsCell));

    // time and days
    let timeCell = await section.$("[id$='TableCell1']");
    let time = await page.evaluate((el) => el.textContent, timeCell);

    let days = time.split(/\s\s\s/)[1];

    if (days === "TBA") {
      sectionInstance.sunday = null;
      sectionInstance.monday = null;
      sectionInstance.tuesday = null;
      sectionInstance.wednesday = null;
      sectionInstance.thursday = null;
      sectionInstance.friday = null;
      sectionInstance.saturday = null;
    } else {
      sectionInstance.sunday = false;
      sectionInstance.monday = false;
      sectionInstance.tuesday = false;
      sectionInstance.wednesday = false;
      sectionInstance.thursday = false;
      sectionInstance.friday = false;
      sectionInstance.saturday = false;

      if (days.includes("Su")) sectionInstance.sunday = true;
      if (days.includes("M")) sectionInstance.monday = true;
      if (days.includes("Tu")) sectionInstance.tuesday = true;
      if (days.includes("W")) sectionInstance.wednesday = true;
      if (days.includes("Th")) sectionInstance.thursday = true;
      if (days.includes("F")) sectionInstance.friday = true;
      if (days.includes("Sa")) sectionInstance.saturday = true;
    }

    time = time.split(/(\s\s\s)/)[0];
    if (time == "No time set.") {
      sectionInstance.startTime = null;
      sectionInstance.endTime = null;
    } else {
      sectionInstance.startTime = parseTime(time.split("–")[0]);
      sectionInstance.endTime = parseTime(time.split("–")[1]);
    }

    //location
    let locationCell = await section.$("[id$='TableCell2']");
    sectionInstance.location = await page.evaluate((el) => el.textContent, locationCell);
    if (sectionInstance.location == "") sectionInstance.location = null;

    //dates
    let dateCell = await section.$("[id$='TableCell12']");
    let date = await page.evaluate((el) => el.textContent, dateCell);
    sectionInstance.startDate = date.split(/\sto\s/)[0];
    sectionInstance.endDate = date.split(/\sto\s/)[1];

    //instructor
    let instructorCell = await section.$("[id$='TableCell4']");
    let instructor = await page.evaluate((el) => el.textContent, instructorCell);
    instructor = instructor.replace(/^\s+|\s+$/g, "");
    if (instructor.includes("Staff") || instructor == "") {
      sectionInstance.instructorFirst = null;
      sectionInstance.instructorLast = null;
    } else {
      sectionInstance.instructorLast = removeJr(instructor.split(/\n/)[0].split(/,\s/)[0]);
      sectionInstance.instructorFirst = removeInitials(instructor.split(/\n/)[0].split(/,\s/)[1]);
    }

    //component and mode
    let componentAndModeCell = await section.$("[id$='TableCell10']");
    let componentAndMode = await page.evaluate((el) => el.textContent, componentAndModeCell);
    sectionInstance.instructionMode = componentAndMode.split(/,\s/)[1];

    await updateSection(sectionInstance);
  }
}

async function scrapePublicSchedule() {
  for (termKey of Object.keys(terms)) {
    for (let courseComponentKey of Object.keys(courseComponents)) {
      console.log("Parsing ", terms[termKey], courseComponents[courseComponentKey]);
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

      await scrapeSite(page, termKey, courseComponentKey);

      await browser.close();
    }
  }
  console.log(JSON.stringify(failedSections));
}
exports.scrapePublicSchedule = scrapePublicSchedule;
