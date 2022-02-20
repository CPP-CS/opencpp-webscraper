const { Op } = require("sequelize");
const { sequelize, Section, Professor } = require(".");
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

exports.calcAverageGPAs = async () => {
  let res = await sequelize.query("SELECT DISTINCT `InstructorFirst`, `InstructorLast` FROM database.sections", {
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
};
