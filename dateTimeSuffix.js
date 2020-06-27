function getFileNameSuffix() {
  const currentDate = new Date();
  return `${currentDate.getDate()}_${
    currentDate.getMonth() + 1
  }_${currentDate.getFullYear()}_${currentDate.getHours()}_${currentDate.getMinutes()}_${currentDate.getSeconds()}_${
    currentDate.getHours() >= 12 ? "PM" : "AM"
  }`;
}

module.exports = { getFileNameSuffix };
