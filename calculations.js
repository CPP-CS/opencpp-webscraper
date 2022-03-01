const { Op } = require("sequelize");
const { sequelize, Section, Professor, Course } = require(".");
const { GPA } = require("./constants");

async function getAvgGPA(query) {
  function removeNulls(obj) {
    for (atr of Object.keys(obj)) {
      if (obj[atr] == null) delete obj[atr];
    }
  }
  let where = {
    Subject: query.subject,
    CourseNumber: query.courseNumber,
    InstructorFirst: query.instructorFirst,
    InstructorLast: query.instructorLast,
    Term: query.term,
    InstructionMode: query.instructionMode,
    A: {
      [Op.ne]: null,
    },
  };
  removeNulls(where);
  let sections = await Section.findAll({
    attributes: ["TotalEnrollment", "A", "A-", "B", "B+", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
    where: where,
  });

  return calcAvg(sections);
}

function calcAvg(sections) {
  let tEnrollment = 0;
  let tPoints = 0;
  for (let section of sections) {
    tEnrollment += section.TotalEnrollment;
    for (let grade of Object.keys(GPA)) {
      tPoints += GPA[grade] * section[grade];
    }
  }
  return tPoints / tEnrollment;
}

exports.calculateData = async () => {
  // calculate & make professors
  let res = await sequelize.query("SELECT DISTINCT `InstructorFirst`, `InstructorLast` FROM db.sections", {
    model: Section,
    mapToModel: true,
  });
  for (let professorName of res) {
    if (professorName.InstructorFirst == null || professorName.InstructorLast == null) continue;

    let avgGPA = await getAvgGPA({
      instructorFirst: professorName.InstructorFirst,
      instructorLast: professorName.InstructorLast,
    });

    let [professor] = await Professor.findOrCreate({
      where: { InstructorFirst: professorName.InstructorFirst, InstructorLast: professorName.InstructorLast },
    });
    professor.AvgGPA = avgGPA ? avgGPA : null;
    await professor.save();
    console.log(professor.InstructorFirst, professor.InstructorLast, professor.AvgGPA);
  }

  // calculate and make courses
  res = await sequelize.query("SELECT DISTINCT `Subject`, `CourseNumber` FROM db.sections", {
    model: Section,
    mapToModel: true,
  });
  for (let courseName of res) {
    if (courseName.Subject == null || courseName.CourseNumber == null) continue;

    let avgGPA = await getAvgGPA({
      subject: courseName.Subject,
      courseNumber: courseName.CourseNumber,
    });

    let [course] = await Course.findOrCreate({
      where: { Subject: courseName.Subject, CourseNumber: courseName.CourseNumber },
    });
    course.AvgGPA = avgGPA ? avgGPA : null;
    await course.save();
    console.log(course.Subject, course.CourseNumber, course.AvgGPA);
  }
};
