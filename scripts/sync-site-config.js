const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "content/site.json");
const outputPath = path.join(repoRoot, "utils/content-data.js");
const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const output = [
  "// This file is generated from content/site.json.",
  "// Run `node scripts/sync-site-config.js` after editing content/site.json.",
  `module.exports = ${JSON.stringify(config, null, 2)};`,
  ""
].join("\n");

fs.writeFileSync(outputPath, output);
console.log("synced utils/content-data.js");
