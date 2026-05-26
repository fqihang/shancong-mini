const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  assetChoicesForRequirement,
  applyTemplatePackProposal,
  buildWorkflowSteps,
  draftToSite,
  summarizeDraftProgress,
  validateDraftBeforeCompile,
  templatePackToDraft
} = require("../lib/workflow");

const repoRoot = path.resolve(__dirname, "../../..");
const site = JSON.parse(fs.readFileSync(path.join(repoRoot, "content/site.json"), "utf8"));

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

const pack = {
  id: "quiet-gallery",
  name: "安静画廊",
  summary: "深山、溪流、房间和咖啡的低销售感首页",
  hero: {
    imageSlot: "hero",
    kicker: "山从｜恩施鹤峰深山民宿",
    title: "住进深山溪流旁的安静夏天",
    text: "天然溪流、避暑山风、漂亮房间和一杯认真做的咖啡。",
    points: ["深山", "安静", "溪流"]
  },
  sections: [
    {
      id: "stream",
      template: "feature_landscape",
      slots: { cover: { orientation: "landscape", recommendedTags: ["溪流"] } },
      copy: { eyebrow: "溪流旁", title: "天然溪流", text: "山谷里的清凉和安静。" }
    },
    {
      id: "room",
      template: "portrait_pair",
      slots: {
        left: { orientation: "portrait", recommendedTags: ["房间"] },
        right: { orientation: "portrait", recommendedTags: ["细节"] }
      },
      copy: { eyebrow: "住下来也想拍照", title: "漂亮房间", text: "自然材质和柔和光线。" }
    }
  ],
  workflow: [
    { id: "basic", title: "基础信息", fields: ["site.brandName", "site.locationText"] },
    { id: "hero", title: "首屏", fields: ["hero.image", "hero.title"] },
    { id: "sections", title: "图片区块", fields: ["sections"] },
    { id: "contact", title: "联系方式", fields: ["contact.phone", "contact.wechatId"] }
  ]
};

test("buildWorkflowSteps keeps the template-defined owner flow", () => {
  const steps = buildWorkflowSteps(pack);
  assert.deepStrictEqual(steps.map((step) => step.id), ["basic", "hero", "sections", "contact", "preview"]);
});

test("templatePackToDraft recommends images by slot orientation and tags", () => {
  const draft = templatePackToDraft(pack, site);
  assert.strictEqual(draft.templatePackId, "quiet-gallery");
  assert.strictEqual(draft.hero.image, "hero_mountain_house");
  assert.strictEqual(draft.sections[0].slots.cover, "scene_stream");
  assert.strictEqual(draft.sections[1].slots.left, "room_window_portrait");
});

test("assetChoicesForRequirement filters by orientation and marks recommended assets", () => {
  const choices = assetChoicesForRequirement(site, {
    orientation: "portrait",
    recommendedTags: ["咖啡"]
  });
  assert(choices.every((asset) => asset.orientation === "portrait"));
  assert.strictEqual(choices[0].id, "coffee_pour_portrait");
  assert.strictEqual(choices[0].recommended, true);
  assert(choices.some((asset) => asset.id === "room_window_portrait" && asset.recommended === false));
});

test("summarizeDraftProgress reports incomplete owner workflow steps", () => {
  const draft = templatePackToDraft(pack, site);
  draft.hero.title = "";
  draft.sections[0].slots.cover = "";
  draft.contact.phone = "";
  draft.contact.wechatId = "";
  const summary = summarizeDraftProgress(draft, buildWorkflowSteps(pack));
  const byId = Object.fromEntries(summary.map((step) => [step.id, step]));
  assert.strictEqual(byId.basic.complete, true);
  assert.strictEqual(byId.hero.complete, false);
  assert(byId.hero.issues.some((issue) => issue.includes("首屏标题")));
  assert.strictEqual(byId.sections.complete, false);
  assert(byId.sections.issues.some((issue) => issue.includes("stream")));
  assert.strictEqual(byId.contact.complete, false);
  assert.strictEqual(byId.preview.complete, false);
});

test("validateDraftBeforeCompile blocks drafts missing core lead information", () => {
  const draft = templatePackToDraft(pack, site);
  draft.hero.image = "";
  draft.sections[1].copy.text = "";
  draft.contact.phone = "";
  draft.contact.wechatId = "";
  const validation = validateDraftBeforeCompile(draft);
  assert.strictEqual(validation.valid, false);
  assert(validation.errors.some((error) => error.includes("首屏图片")));
  assert(validation.errors.some((error) => error.includes("room")));
  assert(validation.errors.some((error) => error.includes("电话或微信")));
});

test("draftToSite produces a valid site-shaped home page", () => {
  const draft = templatePackToDraft(pack, site);
  draft.hero.title = "在山从醒来";
  const nextSite = draftToSite(draft, site);
  assert.strictEqual(nextSite.pages.home.hero.title, "在山从醒来");
  assert.strictEqual(nextSite.pages.home.sections.length, 2);
  assert.strictEqual(nextSite.pages.home.sections[1].template, "portrait_pair");
});

test("applyTemplatePackProposal upserts packs and keeps existing packs", () => {
  const existing = [{ id: "existing", name: "旧模版" }];
  const next = applyTemplatePackProposal(existing, {
    type: "template_pack_proposal",
    templatePacks: [pack],
    warnings: []
  });
  assert.deepStrictEqual(next.map((item) => item.id), ["existing", "quiet-gallery"]);
});
