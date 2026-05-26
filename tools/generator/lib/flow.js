function buildGeneratorFlowState(site, templatePacks, steps) {
  const home = site && site.pages && site.pages.home ? site.pages.home : {};
  return {
    source: {
      assetCount: ((site && site.assets) || []).length,
      templatePackCount: (templatePacks || []).length,
      sectionCount: (home.sections || []).length
    },
    workflow: {
      stepCount: (steps || []).length
    },
    output: {
      mode: "static-mini-program",
      artifacts: ["content/site.json", "utils/content-data.js"]
    }
  };
}

module.exports = {
  buildGeneratorFlowState
};
