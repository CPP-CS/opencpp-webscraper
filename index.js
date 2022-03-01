require("dotenv").config();
const Sequelize = require("sequelize");

const moment = require("moment");
console.log(process.env.DB_HOST, process.env.DB_USERNAME, process.env.DB_PASSWORD);
const sequelize = new Sequelize("db", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  maxConcurrentQueries: 100,
  dialect: "mysql",
  dialectOptions: {
    ssl: "Amazon RDS",
  },
  pool: { maxConnections: 5, maxIdleTime: 30 },
  language: "en",
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
let Professor = sequelize.define("professor", {
  InstructorFirst: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  InstructorLast: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  AvgGPA: Sequelize.FLOAT,
});
let Course = sequelize.define("course", {
  Subject: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  CourseNumber: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  AvgGPA: Sequelize.FLOAT,
});

exports.sequelize = sequelize;
exports.Section = Section;
exports.Professor = Professor;
exports.Course = Course;

const classHistory = require("./classHistory.json");
const { scrapePublicSchedule } = require("./scraper");
const { removeInitials, removeJr } = require("./utils");
const { calculateData } = require("./calculations");

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
    InstructorFirst: section["Instructor Name"] ? removeInitials(section["Instructor Name"].split(",")[1]) : null,
    InstructorLast: section["Instructor Name"] ? removeJr(section["Instructor Name"].split(",")[0]) : null,
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
    console.log("Created new section:", newData.Term, newData.ClassNumber);
  } else {
    existingSection.set(newData);
    await existingSection.save();
    console.log("Updated section:", newData.Term, newData.ClassNumber);
  }
}

async function scrapeClassHistory() {
  for (let key of Object.keys(classHistory)) {
    for (let section of classHistory[key]) {
      await updateSection(section);
    }
  }
}

(async () => {
  await sequelize.authenticate();
  console.log("Connected to database");
  await Section.sync({ alter: true });
  console.log("Synced Section table");
  await Professor.sync({ alter: true });
  console.log("Synced Professor table");
  await Course.sync({ alter: true });
  console.log("Synced Course table");

  await scrapePublicSchedule();

  await scrapeClassHistory();

  await calculateData();
})();
