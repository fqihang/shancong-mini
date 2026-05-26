const assert = require("assert");
const {
  buildGeneratorFlowState,
  buildTemplatePipelineState
} = require("../lib/flow");

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

test("buildGeneratorFlowState summarizes source inputs and static output", () => {
  const flow = buildGeneratorFlowState(
    { assets: [{ id: "a" }, { id: "b" }], pages: { home: { sections: [{}, {}] } } },
    [{ id: "quiet" }, { id: "bold" }],
    [{ id: "basic" }, { id: "hero" }, { id: "preview" }]
  );

  assert.strictEqual(flow.source.assetCount, 2);
  assert.strictEqual(flow.source.templatePackCount, 2);
  assert.strictEqual(flow.source.sectionCount, 2);
  assert.strictEqual(flow.workflow.stepCount, 3);
  assert.deepStrictEqual(flow.output.artifacts, ["content/site.json", "utils/content-data.js"]);
  assert.strictEqual(flow.output.mode, "static-mini-program");
});

test("buildTemplatePipelineState maps the CMS generation sketch to stages and connections", () => {
  const pipeline = buildTemplatePipelineState(
    { deepSeekConfigured: true, selectedTemplatePackId: "quiet-gallery" },
    [{ id: "quiet-gallery" }, { id: "creek-summer" }],
    [{ id: "basic" }, { id: "hero" }, { id: "preview" }],
    [{ id: "room" }, { id: "coffee" }, { id: "creek" }]
  );

  assert.deepStrictEqual(
    pipeline.stages.map((stage) => stage.id),
    ["factory", "library", "editor", "assets", "package"]
  );
  assert.deepStrictEqual(pipeline.connections, [
    { from: "factory", to: "library", label: "模版文件" },
    { from: "library", to: "editor", label: "模版选择" },
    { from: "assets", to: "editor", label: "选择/编辑" },
    { from: "editor", to: "package", label: "打包" }
  ]);
  assert.strictEqual(pipeline.stages[0].status, "ready");
  assert.strictEqual(pipeline.stages[1].metric, "2 个模版");
  assert.strictEqual(pipeline.stages[2].metric, "3 步引导");
  assert.strictEqual(pipeline.stages[3].metric, "3 张素材");
  assert.strictEqual(pipeline.stages[4].metric, "content/site.json + utils/content-data.js");
});
