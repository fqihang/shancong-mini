function buildTemplatePipelineState(options, templatePacks, steps, assets) {
  const configured = Boolean(options && options.deepSeekConfigured);
  const selectedTemplatePackId = options && options.selectedTemplatePackId;
  const packCount = (templatePacks || []).length;
  const stepCount = (steps || []).length;
  const assetCount = (assets || []).length;
  const packageArtifacts = ["content/site.json", "utils/content-data.js"];

  return {
    title: "CMS-生成系统",
    selectedTemplatePackId: selectedTemplatePackId || ((templatePacks || [])[0] && templatePacks[0].id) || "",
    stages: [
      {
        id: "factory",
        title: "模版制造",
        subtitle: "AI聊天生成",
        metric: configured ? "DeepSeek 已配置" : "DeepSeek 未配置",
        status: configured ? "ready" : "needs-key",
        target: "demo"
      },
      {
        id: "library",
        title: "模版库",
        subtitle: "保存 AI 生成的模版文件",
        metric: `${packCount} 个模版`,
        status: packCount > 0 ? "ready" : "empty",
        target: "template"
      },
      {
        id: "editor",
        title: "编辑器",
        subtitle: "一步步的引导素材填空",
        metric: `${stepCount} 步引导`,
        status: stepCount > 0 ? "ready" : "empty",
        target: "workflow"
      },
      {
        id: "assets",
        title: "素材库",
        subtitle: "照片选择、编辑和补充 metadata",
        metric: `${assetCount} 张素材`,
        status: assetCount > 0 ? "ready" : "empty",
        target: "assets"
      },
      {
        id: "package",
        title: "打包",
        subtitle: "Preview OK 后生成小程序静态产物",
        metric: packageArtifacts.join(" + "),
        status: "ready",
        target: "preview"
      }
    ],
    connections: [
      { from: "factory", to: "library", label: "模版文件" },
      { from: "library", to: "editor", label: "模版选择" },
      { from: "assets", to: "editor", label: "选择/编辑" },
      { from: "editor", to: "package", label: "打包" }
    ]
  };
}

function buildGeneratorFlowState(site, templatePacks, steps, options = {}) {
  const home = site && site.pages && site.pages.home ? site.pages.home : {};
  const assets = ((site && site.assets) || []);
  return {
    source: {
      assetCount: assets.length,
      templatePackCount: (templatePacks || []).length,
      sectionCount: (home.sections || []).length
    },
    workflow: {
      stepCount: (steps || []).length
    },
    output: {
      mode: "static-mini-program",
      artifacts: ["content/site.json", "utils/content-data.js"]
    },
    templatePipeline: buildTemplatePipelineState(options, templatePacks, steps, assets)
  };
}

module.exports = {
  buildGeneratorFlowState,
  buildTemplatePipelineState
};
