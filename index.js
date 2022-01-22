require("dotenv").config();
const Sequelize = require("sequelize");

const moment = require("moment");

const sequelize = new Sequelize("database", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  dialectOptions: { connectTimeout: 150000 },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection to database established");
  })
  .catch((e) => {
    console.log("Failed to connect to database: ", e);
  });

let Section = sequelize.define("section", {
  Building: Sequelize.STRING,
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
  Monday: Sequelize.BOOLEAN,
  Room: Sequelize.STRING,
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
Section.sync({ alter: true }).then(() => {
  console.log("Synced Section table");
});

const classHistory = require("./classHistory.json");

function updateSection(section) {
  Section.findOne({ where: { Term: section.Term, ClassNumber: section["Class Number"] } }).then((existingSection) => {
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
      StartTime: section["Class Start Time"]
        ? moment(section["Class Start Time"], "hh:mm:ssA").format("HH:mm:ss")
        : null,
      Subject: section["Subject"],
      Sunday: section["CLASS_SUNDAY_MTG1"] == "Y",
      Term: section["Term"],
      Thursday: section["CLASS_THURSDAY_MTG1"] == "Y",
      Tuesday: section["CLASS_TUESDAY_MTG1"] == "Y",
      TotalEnrollment: section["Enroll Total"],
      Wednesday: section["CLASS_WEDNESDAY_MTG1"] == "Y",
      A: section["Bronco ID_Count_A"],
      "A-": section["Bronco ID_Count_A-"],
      "B+": section["Bronco ID_Count_B+"],
      B: section["Bronco ID_Count_B"],
      "B-": section["Bronco ID_Count_B-"],
      "C+": section["Bronco ID_Count_C+"],
      C: section["Bronco ID_Count_C"],
      "C-": section["Bronco ID_Count_C-"],
      "D+": section["Bronco ID_Count_D+"],
      D: section["Bronco ID_Count_D"],
      "D-": section["Bronco ID_Count_D-"],
      F: section["Bronco ID_Count_F"],
    };
    if (!existingSection) {
      Section.create(newData);
    } else {
      existingSection.set(newData);
      existingSection.save();
    }
  });
}

["Spring 2021"].forEach((key) => {
  classHistory[key].forEach((section) => {
    updateSection(section);
  });
});
