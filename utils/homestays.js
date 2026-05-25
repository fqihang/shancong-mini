const {
  getHomestayById,
  getHomestays
} = require("./content");

function getCities() {
  return ["全部"].concat(Array.from(new Set(getHomestays().map((item) => item.city))));
}

function getTypes() {
  return ["全部"].concat(Array.from(new Set(getHomestays().map((item) => item.type))));
}

module.exports = {
  getCities,
  getHomestayById,
  getHomestays,
  getTypes
};
