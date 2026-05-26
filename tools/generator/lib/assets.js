const fs = require("fs");
const path = require("path");

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const photoRoots = [
  { orientation: "landscape", dir: "assets/photos/landscape" },
  { orientation: "portrait", dir: "assets/photos/portrait" }
];

function toPublicPath(filePath, repoRoot) {
  return `/${path.relative(repoRoot, filePath).split(path.sep).join("/")}`;
}

function toAssetId(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toTitle(value) {
  const words = value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase());
  if (!words.length) {
    return "";
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ");
}

function tagsFromId(id) {
  return id.split("_").filter(Boolean);
}

function indexExistingAssets(site) {
  const byPath = new Map();
  const byId = new Map();
  for (const asset of site.assets || []) {
    if (asset.id) {
      byId.set(asset.id, asset);
    }
    for (const assetPath of [asset.src, asset.localTarget]) {
      if (assetPath && assetPath.startsWith("/")) {
        byPath.set(assetPath, asset);
      }
    }
  }
  return { byId, byPath };
}

function uniqueAssetId(id, existingIds) {
  let next = id || "asset";
  let index = 2;
  while (existingIds.has(next)) {
    next = `${id}_${index}`;
    index += 1;
  }
  existingIds.add(next);
  return next;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }
    if (!entry.isFile()) {
      return [];
    }
    return supportedExtensions.has(path.extname(entry.name).toLowerCase()) ? [entryPath] : [];
  });
}

function scanPhotoLibrary(repoRoot, site) {
  const existing = indexExistingAssets(site || {});
  const seenIds = new Set(existing.byId.keys());
  const files = [];
  const existingAssets = [];
  const newAssets = [];
  const seenExistingAssetIds = new Set();

  for (const root of photoRoots) {
    const absoluteDir = path.join(repoRoot, root.dir);
    for (const filePath of listFiles(absoluteDir)) {
      const src = toPublicPath(filePath, repoRoot);
      const existingAsset = existing.byPath.get(src);
      if (existingAsset) {
        if (!seenExistingAssetIds.has(existingAsset.id)) {
          existingAssets.push(existingAsset);
          seenExistingAssetIds.add(existingAsset.id);
        }
        files.push({
          id: existingAsset.id,
          src,
          orientation: existingAsset.orientation || root.orientation,
          status: "existing"
        });
        continue;
      }

      const baseId = toAssetId(filePath);
      const id = uniqueAssetId(baseId, seenIds);
      const asset = {
        id,
        src,
        localTarget: src,
        orientation: root.orientation,
        alt: toTitle(id),
        tags: tagsFromId(id)
      };
      newAssets.push(asset);
      files.push(Object.assign({ status: "new" }, asset));
    }
  }

  return {
    directories: photoRoots.map((root) => `/${root.dir}`),
    files,
    existingAssets,
    newAssets
  };
}

function mergeScannedAssets(site, scannedAssets) {
  const next = JSON.parse(JSON.stringify(site));
  const existingIds = new Set((next.assets || []).map((asset) => asset.id));
  const existingPaths = new Set();
  for (const asset of next.assets || []) {
    if (asset.src) existingPaths.add(asset.src);
    if (asset.localTarget) existingPaths.add(asset.localTarget);
  }

  for (const asset of scannedAssets || []) {
    if (!asset || !asset.id || existingIds.has(asset.id) || existingPaths.has(asset.src)) {
      continue;
    }
    next.assets.push(asset);
    existingIds.add(asset.id);
    existingPaths.add(asset.src);
  }
  return next;
}

function pushUsage(usageMap, assetId, label) {
  if (!assetId) {
    return;
  }
  if (!usageMap.has(assetId)) {
    usageMap.set(assetId, []);
  }
  usageMap.get(assetId).push(label);
}

function collectAssetUsage(site) {
  const usage = new Map();
  pushUsage(usage, site.share && site.share.image, "分享图");

  const home = site.pages && site.pages.home;
  if (home) {
    pushUsage(usage, home.hero && home.hero.image, "首页首屏");
    for (const section of home.sections || []) {
      for (const [slotId, assetId] of Object.entries(section.slots || {})) {
        pushUsage(usage, assetId, `首页区块 ${section.id} / ${slotId}`);
      }
    }
  }

  for (const room of (site.pages && site.pages.rooms) || []) {
    pushUsage(usage, room.cover, `房间 ${room.id} / 封面`);
    for (const imageId of room.images || []) {
      pushUsage(usage, imageId, `房间 ${room.id} / 图集`);
    }
  }

  return usage;
}

function assetSourceType(asset) {
  return asset.src && asset.src.startsWith("/") ? "local" : "remote";
}

function buildAssetLibrary(site) {
  const usage = collectAssetUsage(site || {});
  return ((site && site.assets) || []).map((asset) => {
    const assetUsage = usage.get(asset.id) || [];
    return Object.assign({}, asset, {
      sourceType: assetSourceType(asset),
      used: assetUsage.length > 0,
      usage: assetUsage
    });
  });
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function updateAssetMetadata(site, updates) {
  const updateMap = new Map((updates || [])
    .filter((update) => update && update.id)
    .map((update) => [update.id, update]));
  const next = JSON.parse(JSON.stringify(site));
  next.assets = (next.assets || []).map((asset) => {
    const update = updateMap.get(asset.id);
    if (!update) {
      return asset;
    }
    return Object.assign({}, asset, {
      alt: typeof update.alt === "string" ? update.alt.trim() : asset.alt,
      tags: update.tags === undefined ? asset.tags || [] : normalizeTags(update.tags)
    });
  });
  return next;
}

module.exports = {
  buildAssetLibrary,
  mergeScannedAssets,
  scanPhotoLibrary,
  updateAssetMetadata
};
