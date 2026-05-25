const content = require("./content-data");

function getAssetMap() {
  return content.assets.reduce((map, asset) => {
    map[asset.id] = asset;
    return map;
  }, {});
}

function resolveAsset(assetId, assetMap) {
  return assetMap[assetId] || null;
}

function resolveSlots(slots, assetMap) {
  return Object.keys(slots || {}).reduce((resolved, slotName) => {
    resolved[slotName] = resolveAsset(slots[slotName], assetMap);
    return resolved;
  }, {});
}

function assetSrc(assetId, assetMap) {
  const asset = resolveAsset(assetId, assetMap);
  return asset ? asset.src : "";
}

function getSiteConfig() {
  const assetMap = getAssetMap();

  return {
    brandName: content.site.brandName,
    locationText: content.site.locationText,
    address: content.site.address,
    sellingPoints: content.pages.home.hero.points,
    hero: Object.assign({}, content.pages.home.hero, {
      image: assetSrc(content.pages.home.hero.image, assetMap)
    }),
    intro: content.pages.home.intro,
    contact: content.pages.contact,
    wxCustomerServiceEnabled: Boolean(content.pages.contact.wxCustomerServiceEnabled)
  };
}

function getSellingPoints() {
  return content.pages.home.hero.points;
}

function getHomeGallerySections() {
  const assetMap = getAssetMap();
  return content.pages.home.sections
    .filter((section) => section.enabled !== false)
    .map((section) => Object.assign({}, section, {
      slots: resolveSlots(section.slots, assetMap)
    }));
}

function getHomestays() {
  const assetMap = getAssetMap();
  return content.pages.rooms.map((room) => Object.assign({}, room, {
    address: content.site.address,
    cover: assetSrc(room.cover, assetMap),
    images: (room.images || []).map((imageId) => assetSrc(imageId, assetMap)),
    host: {
      name: content.pages.contact.hostName,
      phone: content.pages.contact.phone,
      response: content.pages.contact.responseText
    }
  }));
}

function getHomestayById(id) {
  return getHomestays().find((room) => room.id === id);
}

function getLeadLinks() {
  return (content.links || []).filter((link) => {
    if (link.enabled === false) {
      return false;
    }
    return link.type === "copy" && Boolean(link.value);
  });
}

function getMiniProgramLinks() {
  return (content.links || []).filter((link) => {
    if (link.enabled === false) {
      return false;
    }
    return link.type === "miniProgram" && Boolean(link.appId);
  });
}

function getShareConfig() {
  const assetMap = getAssetMap();
  return Object.assign({}, content.share, {
    imageUrl: assetSrc(content.share.image, assetMap)
  });
}

module.exports = {
  getHomeGallerySections,
  getHomestayById,
  getHomestays,
  getLeadLinks,
  getMiniProgramLinks,
  getSellingPoints,
  getShareConfig,
  getSiteConfig
};
