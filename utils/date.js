function pad(value) {
  return value < 10 ? "0" + value : String(value);
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(start, end) {
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((endTime - startTime) / 86400000));
}

function defaultStay() {
  const today = new Date();
  const checkIn = formatDate(addDays(today, 1));
  const checkOut = formatDate(addDays(today, 2));
  return { checkIn, checkOut };
}

module.exports = {
  addDays,
  defaultStay,
  diffDays,
  formatDate
};
