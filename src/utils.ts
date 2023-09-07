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

// This staggers promises so we don't overload sequelize.
export async function staggerPromises<T>(values: T[], f: (val: T, ind: number) => Promise<void>, increment: number) {
  for (let i = 0; i < values.length; i += increment) {
    await Promise.all(
      values.slice(i, Math.min(i + increment, values.length)).map(async (val, ind) => {
        await f(val, i + ind);
      })
    );
  }
}
