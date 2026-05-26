# Shancong Generator Flow Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the Excalidraw large-box-to-small-box sketch into a generator overview that shows inputs converging into the static mini program artifact.

**Architecture:** Add a pure flow summary helper in `tools/generator/lib/flow.js`, test it with Node assertions, expose the state via `/api/site`, and render a compact flow overview at the top of the local generator.

**Tech Stack:** Node.js CommonJS, plain browser JavaScript, static HTML/CSS.

---

### Task 1: Flow Summary Helper

**Files:**
- Create: `tools/generator/lib/flow.js`
- Create: `tools/generator/test/flow.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Test that the helper reports asset count, template pack count, workflow step count, and output artifact names.

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: FAIL because `tools/generator/lib/flow.js` does not exist.

- [ ] **Step 3: Implement helper**

Implement `buildGeneratorFlowState(site, templatePacks, steps)`.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 2: Generator UI

**Files:**
- Modify: `tools/generator/server.js`
- Modify: `tools/generator/public/index.html`
- Modify: `tools/generator/public/app.js`
- Modify: `tools/generator/public/styles.css`

- [ ] **Step 1: Add flow state to `/api/site`**

Return `flowState` using current site and template packs.

- [ ] **Step 2: Render overview**

Add a large source card, arrow, and smaller output card matching the sketch's structure.

- [ ] **Step 3: Refresh counts**

After import/save operations, update the flow state.

### Task 3: Verification

**Files:**
- Verify changed files

- [ ] **Step 1: Run checks**

Run `npm test`, JS syntax checks, config validation, sync consistency, and browser smoke test.

- [ ] **Step 2: Commit**

Commit with message: `feat: add generator flow overview`.
