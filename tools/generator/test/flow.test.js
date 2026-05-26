const assert = require("assert");
const {
  buildGeneratorFlowState
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
