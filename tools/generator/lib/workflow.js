function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function includesAnyTag(asset, tags) {
  if (!tags || !tags.length) {
    return false;
  }
  const assetTags = new Set((asset.tags || []).map((tag) => String(tag).toLowerCase()));
  return tags.some((tag) => assetTags.has(String(tag).toLowerCase()));
}

function chooseAsset(site, requirement = {}, fallbackId) {
  const assets = site.assets || [];
  const matchingOrientation = assets.filter((asset) => {
    return !requirement.orientation || asset.orientation === requirement.orientation;
  });
  const tagged = matchingOrientation.find((asset) => includesAnyTag(asset, requirement.recommendedTags));
  if (tagged) {
    return tagged.id;
  }
  if (matchingOrientation.length) {
    return matchingOrientation[0].id;
  }
  return fallbackId || (assets[0] && assets[0].id) || "";
}

function buildWorkflowSteps(templatePack) {
  const baseSteps = Array.isArray(templatePack.workflow) && templatePack.workflow.length
    ? templatePack.workflow
    : [
      { id: "basic", title: "基础信息", fields: ["site.brandName", "site.locationText"] },
      { id: "hero", title: "首屏", fields: ["hero.image", "hero.title", "hero.text"] },
      { id: "sections", title: "图片区块", fields: ["sections"] },
      { id: "contact", title: "联系方式", fields: ["contact.phone", "contact.wechatId"] }
    ];

  const hasPreview = baseSteps.some((step) => step.id === "preview");
  return hasPreview
    ? baseSteps
    : baseSteps.concat([{ id: "preview", title: "预览与编译", fields: ["preview"] }]);
}

function templatePackToDraft(templatePack, site) {
  const hero = templatePack.hero || {};
  const fallbackHeroImage = site.pages && site.pages.home && site.pages.home.hero
    ? site.pages.home.hero.image
    : "";

  return {
    templatePackId: templatePack.id,
    templatePackName: templatePack.name,
    site: {
      brandName: site.site.brandName,
      locationText: site.site.locationText,
      address: site.site.address
    },
    share: Object.assign({}, site.share),
    hero: {
      image: chooseAsset(site, {
        orientation: "landscape",
        recommendedTags: ["首页", "建筑", "深山"]
      }, hero.image || fallbackHeroImage),
      kicker: hero.kicker || site.pages.home.hero.kicker,
      title: hero.title || site.pages.home.hero.title,
      text: hero.text || site.pages.home.hero.text,
      points: hero.points || site.pages.home.hero.points || []
    },
    sections: (templatePack.sections || []).map((section) => {
      const resolvedSlots = {};
      for (const [slotId, requirement] of Object.entries(section.slots || {})) {
        resolvedSlots[slotId] = chooseAsset(site, requirement);
      }
      return {
        id: section.id,
        enabled: section.enabled !== false,
        template: section.template,
        slots: resolvedSlots,
        copy: Object.assign({}, section.copy)
      };
    }),
    rooms: JSON.parse(JSON.stringify(site.pages.rooms || [])),
    contact: Object.assign({}, site.pages.contact),
    links: JSON.parse(JSON.stringify(site.links || []))
  };
}

function draftToSite(draft, site) {
  const next = JSON.parse(JSON.stringify(site));
  next.site = Object.assign({}, next.site, draft.site);
  next.share = Object.assign({}, next.share, draft.share);
  next.pages.home.hero = {
    image: draft.hero.image,
    kicker: draft.hero.kicker,
    title: draft.hero.title,
    text: draft.hero.text,
    points: draft.hero.points || []
  };
  next.pages.home.sections = (draft.sections || []).map((section) => ({
    id: normalizeText(section.id),
    enabled: section.enabled !== false,
    template: section.template,
    slots: Object.assign({}, section.slots),
    copy: Object.assign({}, section.copy)
  }));
  next.pages.rooms = JSON.parse(JSON.stringify(draft.rooms || next.pages.rooms || []));
  next.pages.contact = Object.assign({}, next.pages.contact, draft.contact);
  next.links = JSON.parse(JSON.stringify(draft.links || next.links || []));
  return next;
}

function applyTemplatePackProposal(existingPacks, proposal) {
  const packs = Array.isArray(existingPacks) ? existingPacks.slice() : [];
  const map = new Map(packs.map((pack) => [pack.id, pack]));
  for (const pack of proposal && proposal.templatePacks || []) {
    if (pack && pack.id) {
      map.set(pack.id, Object.assign({}, map.get(pack.id), pack));
    }
  }
  return Array.from(map.values());
}

module.exports = {
  applyTemplatePackProposal,
  buildWorkflowSteps,
  draftToSite,
  templatePackToDraft
};
