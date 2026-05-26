# Shancong Generator Owner Workflow Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local generator feel like a guided owner workflow instead of a JSON-backed form.

**Architecture:** Keep the generator static and local. Put deterministic workflow helpers in `tools/generator/lib/workflow.js`, test them with Node assertions, then let `tools/generator/public/app.js` consume those helpers through the existing `/api/workflow/draft` and `/api/workflow/compile` flow.

**Tech Stack:** Node.js CommonJS, plain browser JavaScript, static HTML/CSS, existing `content/site.json` contract.

---

### Task 1: Workflow Helper Behavior

**Files:**
- Modify: `tools/generator/lib/workflow.js`
- Modify: `tools/generator/test/workflow.test.js`

- [ ] **Step 1: Add failing tests**

Add tests for `summarizeDraftProgress`, `assetChoicesForRequirement`, and `validateDraftBeforeCompile`. Expected first run fails because the functions are not exported.

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: FAIL with an export or function-not-defined assertion.

- [ ] **Step 3: Implement helpers**

Implement:
- `assetChoicesForRequirement(site, requirement)` returns assets filtered by orientation with `recommended` set from tag matches.
- `summarizeDraftProgress(draft, steps)` returns per-step completion states.
- `validateDraftBeforeCompile(draft)` returns blocking errors for missing hero title/image, missing section copy/slots, and missing phone plus WeChat.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 2: Guided Browser Workflow

**Files:**
- Modify: `tools/generator/server.js`
- Modify: `tools/generator/public/app.js`
- Modify: `tools/generator/public/index.html`
- Modify: `tools/generator/public/styles.css`

- [ ] **Step 1: Extend draft API**

Include helper-derived progress and asset choice metadata in `/api/workflow/draft`. Keep the existing response shape compatible by preserving `steps` and `draft`.

- [ ] **Step 2: Add owner navigation**

Add previous/next controls and step progress labels. Keep step chips available, but make the default flow linear.

- [ ] **Step 3: Improve image selection**

For each image slot, show a small asset grid with thumbnails, orientation, tags, and a recommended marker. Keep the native select as a simple fallback.

- [ ] **Step 4: Compile guard**

Run local draft validation before compile. Show blocking issues in the status panel and keep files unchanged when validation fails.

### Task 3: Verification And Finish

**Files:**
- Verify: all changed files

- [ ] **Step 1: Static checks**

Run:
`node --check tools/generator/server.js`
`node --check tools/generator/public/app.js`
`node --check tools/generator/lib/workflow.js`

- [ ] **Step 2: Config checks**

Run:
`node scripts/validate-site-config.js`
`node scripts/sync-site-config.js`

- [ ] **Step 3: Browser smoke test**

Open `http://127.0.0.1:57592/`, confirm the generator renders, step controls exist, recommended asset cards render, and preview updates after editing.

- [ ] **Step 4: Commit**

Commit with message: `feat: polish owner workflow generator`.
