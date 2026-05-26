const path = require("path");
const {
  readSiteConfig,
  validateSiteConfig
} = require("./lib/site-validator");

const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "content/site.json");
const config = readSiteConfig(configPath);
const result = validateSiteConfig(config, { repoRoot });

for (const message of result.warnings) {
  console.warn(`warning: ${message}`);
}

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("site config ok");
