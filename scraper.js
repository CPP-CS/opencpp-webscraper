const puppeteer = require("puppeteer");
const { Section } = require("./index");
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
async function updateSection(section) {
  let existingSection = await Section.findOne({ where: { Term: section.term, ClassNumber: section.classNumber } });
  let newData = {
    Term: section.term,
    ClassCapacity: section.classCapacity,
    ClassTitle: section.classTitle,
    ClassNumber: section.classNumber,
    CourseNumber: section.courseNumber,
    Subject: section.subject,
    Component: section.courseComponent,
    Location: section.location,
    Units: section.units,
  };
  if (!existingSection) {
    await Section.create(newData);
  } else {
    existingSection.set(newData);
    await existingSection.save();
  }
}
async function scrapePublicSchedule() {
  for (termKey of Object.keys(terms)) {
    for (let courseComponentKey of Object.keys(courseComponents)) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto("https://schedule.cpp.edu/");
      await page.select("select#ctl00_ContentPlaceHolder1_TermDDL", termKey);
      await page.select("select#ctl00_ContentPlaceHolder1_CourseComponentDDL", courseComponentKey);
      await page.click("#ctl00_ContentPlaceHolder1_SearchButton");
      await page.waitForNetworkIdle();
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
        sectionInstance.subject = courseTitle.split(" ")[0];
        sectionInstance.courseNumber = courseTitle.split(" ")[1];
        let classNumberCell = await section.$("[id*='TableCell13']");
        sectionInstance.classNumber = await page.evaluate((el) => el.textContent, classNumberCell);
        let classCapacityCell = await section.$("[id*='TableCell14']");
        sectionInstance.classCapacity = await page.evaluate((el) => el.textContent, classCapacityCell);
        let classTitleCell = await section.$("[id*='TableCell8']");
        sectionInstance.classTitle = await page.evaluate((el) => el.textContent, classTitleCell);
        let unitsCell = await section.$("[id*='TableCell9']");
        sectionInstance.units = eval(await page.evaluate((el) => el.textContent, unitsCell));
        let timeCell = await section.$("[id*='TableCell1']");
        let time = await page.evaluate((el) => el.textContent, timeCell);
        if (time.includes("TBA")) {
          section.monday = null;
        }

        let locationCell = await section.$("[id*='TableCell2']");
        sectionInstance.location = await page.evaluate((el) => el.textContent, locationCell);
        let dateCell = await section.$("[id*='TableCell12']");
        sectionInstance.date = await page.evaluate((el) => el.textContent, dateCell);
        let instructorCell = await section.$("[id*='TableCell4']");
        sectionInstance.instructor = await page.evaluate((el) => el.textContent, instructorCell);
        let componentAndModeCell = await section.$("[id*='TableCell10']");
        sectionInstance.componentAndMode = await page.evaluate((el) => el.textContent, componentAndModeCell);
        await updateSection(sectionInstance);
      }

      await browser.close();
    }
  }
}
exports.scrapePublicSchedule = scrapePublicSchedule;
