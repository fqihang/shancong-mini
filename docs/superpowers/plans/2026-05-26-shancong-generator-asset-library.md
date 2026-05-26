# Shancong Generator Asset Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner add photos to local landscape/portrait folders, scan them in the generator, and merge new assets into `content/site.json`.

**Architecture:** Add deterministic filesystem scanning in `tools/generator/lib/assets.js`, expose scan/import endpoints from `tools/generator/server.js`, and render an asset library panel in the existing local generator. The mini program still consumes only synced static config.

**Tech Stack:** Node.js CommonJS, plain browser JavaScript, local filesystem, existing `content/site.json` contract.

---

### Task 1: Asset Scanner

**Files:**
- Create: `tools/generator/lib/assets.js`
- Create: `tools/generator/test/assets.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Add tests for:
- scanning `assets/photos/landscape` and `assets/photos/portrait`
- generating stable ids, alt text, tags, and local paths
- ignoring unsupported files
- not duplicating assets already referenced by `src` or `localTarget`

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: FAIL because `tools/generator/lib/assets.js` does not exist.

- [ ] **Step 3: Implement scanner**

Implement `scanPhotoLibrary(repoRoot, site)` and `mergeScannedAssets(site, scannedAssets)`.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 2: Generator API And UI

**Files:**
- Modify: `tools/generator/server.js`
- Modify: `tools/generator/public/index.html`
- Modify: `tools/generator/public/app.js`
- Modify: `tools/generator/public/styles.css`

- [ ] **Step 1: Add endpoints**

Add:
- `GET /api/assets/scan`
- `POST /api/assets/import`

The import endpoint validates the updated site and syncs `utils/content-data.js`.

- [ ] **Step 2: Add asset panel**

Show scan summary, new local photos, already configured photos, and a button to import new assets.

- [ ] **Step 3: Refresh workflow after import**

After import, update `state.site`, rescan template draft choices, and keep the generator ready for workflow selection.

### Task 3: Docs And Verification

**Files:**
- Modify: `README.md`
- Modify: `assets/photos/README.md`

- [ ] **Step 1: Update docs**

Replace old gallery JSON commands with the generator scan/import workflow.

- [ ] **Step 2: Verify**

Run:
`npm test`
`node --check tools/generator/server.js`
`node --check tools/generator/public/app.js`
`node scripts/validate-site-config.js`
`node scripts/sync-site-config.js`

- [ ] **Step 3: Browser smoke test**

Open `http://127.0.0.1:57592/`, confirm the asset panel renders and scan API returns a summary.

- [ ] **Step 4: Commit**

Commit with message: `feat: add local asset library scanner`.
