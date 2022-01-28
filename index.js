require("dotenv").config();
const Sequelize = require("sequelize");

const moment = require("moment");

const sequelize = new Sequelize("database", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  dialectOptions: { connectTimeout: 150000 },
  logging: false,
});
let Section = sequelize.define("section", {
  ClassCapacity: Sequelize.INTEGER,
  ClassNumber: Sequelize.INTEGER,
  ClassTitle: Sequelize.STRING,
  Component: Sequelize.STRING,
  CourseNumber: Sequelize.STRING,
  EndDate: Sequelize.DATEONLY,
  EndTime: Sequelize.TIME,
  Friday: Sequelize.BOOLEAN,
  InstructionMode: Sequelize.STRING,
  InstructorFirst: Sequelize.STRING,
  InstructorLast: Sequelize.STRING,
  Location: Sequelize.STRING,
  Monday: Sequelize.BOOLEAN,
  Saturday: Sequelize.BOOLEAN,
  Section: Sequelize.STRING,
  StartDate: Sequelize.DATEONLY,
  StartTime: Sequelize.TIME,
  Subject: Sequelize.STRING,
  Sunday: Sequelize.BOOLEAN,
  Term: Sequelize.STRING,
  Thursday: Sequelize.BOOLEAN,
  Tuesday: Sequelize.BOOLEAN,
  TotalEnrollment: Sequelize.INTEGER,
  Units: Sequelize.FLOAT,
  Wednesday: Sequelize.BOOLEAN,
  A: Sequelize.INTEGER,
  "A-": Sequelize.INTEGER,
  "B+": Sequelize.INTEGER,
  B: Sequelize.INTEGER,
  "B-": Sequelize.INTEGER,
  "C+": Sequelize.INTEGER,
  C: Sequelize.INTEGER,
  "C-": Sequelize.INTEGER,
  "D+": Sequelize.INTEGER,
  D: Sequelize.INTEGER,
  "D-": Sequelize.INTEGER,
  F: Sequelize.INTEGER,
});

exports.sequelize = sequelize;
exports.Section = Section;

const classHistory = require("./classHistory.json");
const { scrapePublicSchedule } = require("./scraper");

async function updateSection(section) {
  console.log("Loading", section.Term, section["Class Number"]);
  let existingSection = await Section.findOne({ where: { Term: section.Term, ClassNumber: section["Class Number"] } });
  let newData = {
    ClassCapacity: section["Enroll Capacity"],
    ClassNumber: section["Class Number"],
    CourseNumber: section["Catalog Number"],
    EndDate: section["CLASS_END_DATE"],
    EndTime: section["Class End Time"] ? moment(section["Class End Time"], "hh:mm:ssA").format("HH:mm:ss") : null,
    Friday: section["CLASS_FRIDAY_MTG1"] == "Y",
    InstructionMode: section["Instruction Mode"],
    InstructorFirst: section["Instructor Name"] ? section["Instructor Name"].split(",")[1] : null,
    InstructorLast: section["Instructor Name"] ? section["Instructor Name"].split(",")[0] : null,
    Monday: section["CLASS_MONDAY_MTG1"] == "Y",
    Saturday: section["CLASS_SATURDAY_MTG1"] == "Y",
    Section: section["Class Section"],
    StartDate: section["CLASS_START_DATE"],
    StartTime: section["Class Start Time"] ? moment(section["Class Start Time"], "hh:mm:ssA").format("HH:mm:ss") : null,
    Subject: section["Subject"],
    Sunday: section["CLASS_SUNDAY_MTG1"] == "Y",
    Term: section["Term"],
    Thursday: section["CLASS_THURSDAY_MTG1"] == "Y",
    Tuesday: section["CLASS_TUESDAY_MTG1"] == "Y",
    TotalEnrollment: section["Enroll Total"],
    Wednesday: section["CLASS_WEDNESDAY_MTG1"] == "Y",
    A: section["Bronco ID_Count_A"] || 0,
    "A-": section["Bronco ID_Count_A-"] || 0,
    "B+": section["Bronco ID_Count_B+"] || 0,
    B: section["Bronco ID_Count_B"] || 0,
    "B-": section["Bronco ID_Count_B-"] || 0,
    "C+": section["Bronco ID_Count_C+"] || 0,
    C: section["Bronco ID_Count_C"] || 0,
    "C-": section["Bronco ID_Count_C-"] || 0,
    "D+": section["Bronco ID_Count_D+"] || 0,
    D: section["Bronco ID_Count_D"] || 0,
    "D-": section["Bronco ID_Count_D-"] || 0,
    F: section["Bronco ID_Count_F"] || 0,
  };
  if (!existingSection) {
    await Section.create(newData);
  } else {
    existingSection.set(newData);
    await existingSection.save();
  }
}

(async () => {
  await sequelize.authenticate();
  console.log("Connected to database");
  await Section.sync({ alter: true });
  console.log("Synced Section table");

  // await scrapePublicSchedule();

  // for (let key of Object.keys(classHistory)) {
  //   for (let section of classHistory[key]) {
  //     await updateSection(section);
  //   }
  // }
})();
