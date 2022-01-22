const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
});
exports.sequelize = sequelize;

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection to database established");
  })
  .catch((e) => {
    console.log("Failed to connect to database: ", e);
  });

let Section = sequelize.define("section", {
  AcademicSession: Sequelize.STRING,
  Building: Sequelize.STRING,
  Capacity: Sequelize.INTEGER,
  ClassCapacity: Sequelize.INTEGER,
  ClassNumber: Sequelize.INTEGER,
  ClassTitle: Sequelize.STRING,
  Component: Sequelize.STRING,
  CourseNumber: Sequelize.INTEGER,
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
});
Section.sync().then(() => {
  console.log("Synced Section table");
});
exports.Section = Section;
