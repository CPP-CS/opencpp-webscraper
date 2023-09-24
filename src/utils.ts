import moment from "moment";
import { CreationAttributes } from "sequelize";
import { Professor } from "./db/db";

function capitalizeFirst(str: string | undefined): string | undefined {
  if (!str) return str;
  return str
    .split(" ")
    .map((s) => s.charAt(0) + s.slice(1))
    .join(" ");
}

export function parseName(name: string): CreationAttributes<Professor> {
  const nameParts = name.split(",");

  if (nameParts.length < 2) {
    return {
      FirstName: "Staff",
    };
  }

  const Beginning = nameParts[1].trim();
  const BeginningParts = Beginning.split(" ");
  const FirstName = BeginningParts[0];
  let MiddleName: string | undefined;
  if (BeginningParts.length > 1) {
    MiddleName = BeginningParts.slice(1).join(" ");
  }

  const suffixes = ["JR", "SR", "II", "III", "IV", "V"];
  const End = nameParts[0].trim();
  const EndParts = End.split(" ");
  let Suffix: string | undefined;
  if (suffixes.includes(EndParts[EndParts.length - 1].toUpperCase())) {
    Suffix = EndParts.pop();
  }
  const LastName = EndParts.join(" ");

  return {
    FirstName: capitalizeFirst(FirstName) as string,
    MiddleName: capitalizeFirst(MiddleName),
    LastName: capitalizeFirst(LastName),
    Suffix: capitalizeFirst(Suffix),
  };
}

export function parseTime(time: string): string {
  return moment(time, "hh:mm A").format("HH:mm:ss");
}
export function parseDate(date: string): Date {
  return moment(date, "YYYY-MM-DD").toDate();
}
