import readXlsxFile from "read-excel-file/node";
import * as fs from "fs";

const map = {
  Term: "Term",
  "Academic Group": "Academic Group",
  "Academic Org": "Academic Org",
  "Class Session": "Class Session",
  Subject: "Subject",
  "Catalog Number": "Catalog Number",
  "Class Number": "Class Number",
  "Academic Career": "Academic Career",
  "Class Description": "Class Description",
  "Class Section": "Class Section",
  "Instructor ID": "Instructor ID",
  "Instructor Name": "Instructor Name",
  "Instruction Mode": "Instruction Mode",
  "Meeting Pattern": "Meeting Pattern",
  "Enroll Total": "Enroll Total",
  "Enroll Capacity": "Enroll Capacity",
  CLASS_START_DATE: "CLASS_START_DATE",
  CLASS_END_DATE: "CLASS_END_DATE",
  "Class Start Time": "Class Start Time",
  "Class End Time": "Class End Time",
  CLASS_MONDAY_MTG1: "CLASS_MONDAY_MTG1",
  CLASS_TUESDAY_MTG1: "CLASS_TUESDAY_MTG1",
  CLASS_WEDNESDAY_MTG1: "CLASS_WEDNESDAY_MTG1",
  CLASS_THURSDAY_MTG1: "CLASS_THURSDAY_MTG1",
  CLASS_FRIDAY_MTG1: "CLASS_FRIDAY_MTG1",
  CLASS_SATURDAY_MTG1: "CLASS_SATURDAY_MTG1",
  CLASS_SUNDAY_MTG1: "CLASS_SUNDAY_MTG1",
  "Bronco ID_Count_A": "Bronco ID_Count_A",
  "Bronco ID_Count_A-": "Bronco ID_Count_A-",
  "Bronco ID_Count_B+": "Bronco ID_Count_B+",
  "Bronco ID_Count_B": "Bronco ID_Count_B",
  "Bronco ID_Count_B-": "Bronco ID_Count_B-",
  "Bronco ID_Count_C+": "Bronco ID_Count_C+",
  "Bronco ID_Count_C": "Bronco ID_Count_C",
  "Bronco ID_Count_C-": "Bronco ID_Count_C-",
  "Bronco ID_Count_D+": "Bronco ID_Count_D+",
  "Bronco ID_Count_D": "Bronco ID_Count_D",
  "Bronco ID_Count_D-": "Bronco ID_Count_D-",
  "Bronco ID_Count_F": "Bronco ID_Count_F",
};

export const convertToJson = async () => {
  await readXlsxFile(fs.createReadStream("./src/gradeData/data.xlsx"), { map }).then(({ rows, errors }) => {
    if (errors.length !== 0) {
      console.log("Errors:", errors);
    }
    fs.writeFileSync("./src/gradeData/data.json", JSON.stringify(rows));
  });
};

convertToJson();
