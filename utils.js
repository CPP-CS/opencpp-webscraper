function removeInitials(s) {
  let res = s;
  // while (/(.)\s[A-Z]$/.test(res)) {
  //   res = res.substring(0, res.length - 2);
  // }
  res = res.split(" ")[0];
  return res;
}

function removeJr(s) {
  let res = s;
  res = res.split(" Jr")[0];
  return res;
}

exports.removeInitials = removeInitials;
exports.removeJr = removeJr;
