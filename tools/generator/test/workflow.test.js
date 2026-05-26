const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  applyTemplatePackProposal,
  buildWorkflowSteps,
  draftToSite,
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
