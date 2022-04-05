export function removeInitials(s: string) {
  let res = s;
  // while (/(.)\s[A-Z]$/.test(res)) {
  //   res = res.substring(0, res.length - 2);
  // }
  res = res.split(" ")[0];
  return res;
}

export function removeJr(s: string) {
  let res = s;
  res = res.split(" Jr")[0];
  return res;
}
