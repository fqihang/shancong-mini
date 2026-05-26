const fs = require("fs");
const path = require("path");

const supportedRenderers = new Set([
  "feature_landscape",
  "portrait_pair",
  "mixed_mosaic",
  "single_portrait"
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function readSiteConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function validateSiteConfig(config, options = {}) {
  const repoRoot = options.repoRoot || path.resolve(__dirname, "../..");
  const errors = [];
  const warnings = [];

  function fail(message) {
    errors.push(message);
  }

  function warn(message) {
    warnings.push(message);
  }

  function indexById(items, label) {
    const map = new Map();
    for (const item of items || []) {
      if (!item || !isNonEmptyString(item.id)) {
        fail(`${label} item is missing id`);
        continue;
      }
      if (map.has(item.id)) {
        fail(`${label} id duplicated: ${item.id}`);
      }
      map.set(item.id, item);
    }
    return map;
  }

  function validateTopLevel() {
    if (config.version !== 1) {
      fail("version must be 1");
    }
    if (!config.site) {
      fail("site is required");
      return;
    }
    if (!isNonEmptyString(config.site.brandName)) {
      fail("site.brandName is required");
    }
    if (!isNonEmptyString(config.site.locationText)) {
      fail("site.locationText is required");
    }
    if (!isNonEmptyString(config.site.address)) {
      fail("site.address is required");
    }
    if (!config.share || !isNonEmptyString(config.share.title)) {
      fail("share.title is required");
    }
    if (!config.pages || !config.pages.home || !config.pages.contact) {
      fail("pages.home and pages.contact are required");
    }
  }

  function validateAssets(assetMap) {
    for (const asset of assetMap.values()) {
      if (!["landscape", "portrait"].includes(asset.orientation)) {
        fail(`asset ${asset.id} orientation must be landscape or portrait`);
      }
      if (!isNonEmptyString(asset.src)) {
        fail(`asset ${asset.id} src is required`);
      }
      if (!isNonEmptyString(asset.alt)) {
        warn(`asset ${asset.id} alt is empty`);
      }
      if (asset.src && asset.src.startsWith("/")) {
        const assetPath = path.join(repoRoot, asset.src);
        if (!fs.existsSync(assetPath)) {
          fail(`asset ${asset.id} local path does not exist: ${asset.src}`);
        }
      }
    }
  }

  function validateTemplates(templateMap) {
    for (const template of templateMap.values()) {
      if (!supportedRenderers.has(template.renderer)) {
        fail(`template ${template.id} renderer is not supported: ${template.renderer}`);
      }
      if (!Array.isArray(template.slots) || template.slots.length === 0) {
        fail(`template ${template.id} must define slots`);
      }
      if (!Array.isArray(template.fields)) {
        fail(`template ${template.id} must define fields array`);
      }
      for (const slot of template.slots || []) {
        if (!isNonEmptyString(slot.id)) {
          fail(`template ${template.id} has slot without id`);
        }
        if (slot.type !== "image") {
          fail(`template ${template.id} slot ${slot.id} type must be image`);
        }
        if (!["landscape", "portrait"].includes(slot.orientation)) {
          fail(`template ${template.id} slot ${slot.id} orientation is invalid`);
        }
      }
    }
  }

  function validateSection(section, templateMap, assetMap) {
    if (!isNonEmptyString(section.id)) {
      fail("home section missing id");
    }
    const template = templateMap.get(section.template);
    if (!template) {
      fail(`section ${section.id} references missing template ${section.template}`);
      return;
    }
    for (const slot of template.slots) {
      const assetId = section.slots && section.slots[slot.id];
      if (slot.required && !assetId) {
        fail(`section ${section.id} missing required slot ${slot.id}`);
        continue;
      }
      const asset = assetMap.get(assetId);
      if (!asset) {
        fail(`section ${section.id} slot ${slot.id} references missing asset ${assetId}`);
        continue;
      }
      if (asset.orientation !== slot.orientation) {
        fail(`section ${section.id} slot ${slot.id} requires ${slot.orientation}, got ${asset.orientation}`);
      }
    }
    for (const field of template.fields || []) {
      const value = section.copy && section.copy[field.id];
      if (field.required && !isNonEmptyString(value)) {
        fail(`section ${section.id} missing required copy.${field.id}`);
      }
      if (value && field.maxLength && value.length > field.maxLength) {
        warn(`section ${section.id} copy.${field.id} length ${value.length} exceeds ${field.maxLength}`);
      }
    }
  }

  function validatePages(templateMap, assetMap) {
    const home = config.pages && config.pages.home;
    if (!home) {
      return;
    }
    if (!assetMap.has(home.hero && home.hero.image)) {
      fail(`home.hero.image references missing asset ${home.hero && home.hero.image}`);
    }
    for (const section of home.sections || []) {
      if (section.enabled === false) {
        continue;
      }
      validateSection(section, templateMap, assetMap);
    }

    for (const room of config.pages.rooms || []) {
      if (!isNonEmptyString(room.id)) {
        fail("room missing id");
      }
      if (!assetMap.has(room.cover)) {
        fail(`room ${room.id} cover references missing asset ${room.cover}`);
      }
      for (const imageId of room.images || []) {
        if (!assetMap.has(imageId)) {
          fail(`room ${room.id} image references missing asset ${imageId}`);
        }
      }
    }

    const contact = config.pages.contact;
    if (!isNonEmptyString(contact.phone) && !isNonEmptyString(contact.wechatId)) {
      fail("pages.contact.phone or pages.contact.wechatId is required");
    }
  }

  function validateLinks() {
    for (const link of config.links || []) {
      if (!isNonEmptyString(link.id)) {
        fail("link missing id");
      }
      if (!["copy", "miniProgram"].includes(link.type)) {
        fail(`link ${link.id} type must be copy or miniProgram`);
      }
      if (link.enabled && link.type === "copy" && !isNonEmptyString(link.value)) {
        fail(`enabled copy link ${link.id} requires value`);
      }
      if (link.enabled && link.type === "miniProgram" && !isNonEmptyString(link.appId)) {
        fail(`enabled miniProgram link ${link.id} requires appId`);
      }
    }
  }

  validateTopLevel();
  const assetMap = indexById(config.assets, "asset");
  const templateMap = indexById(config.templates, "template");
  validateAssets(assetMap);
  validateTemplates(templateMap);
  validatePages(templateMap, assetMap);
  validateLinks();

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  readSiteConfig,
  validateSiteConfig
};
