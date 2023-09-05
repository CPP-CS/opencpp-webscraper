import moment from "moment";

export function removeInitials(s: string) {
  let res = s;
  res = res.split(" ")[0];
  return res;
}

export function removeJr(s: string) {
  let res = s;
  res = res.split(" Jr")[0];
  return res;
}

export function parseTime(time: string): string {
  return moment(time, "hh:mm A").format("HH:mm:ss");
}
export function parseDate(date: string): Date {
  return moment(date, "YYYY-MM-DD").toDate();
}
