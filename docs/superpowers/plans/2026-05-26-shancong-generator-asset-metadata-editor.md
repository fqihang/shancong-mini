# Shancong Generator Asset Metadata Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner maintain image alt text and tags from the local generator, with visibility into where each asset is used.

**Architecture:** Extend `tools/generator/lib/assets.js` with pure helpers for asset usage summaries and metadata updates. Expose safe server endpoints that only update `alt` and `tags`, validate the full site, sync runtime output, then render an editable asset library in the existing generator.

**Tech Stack:** Node.js CommonJS, plain browser JavaScript, local JSON content contract.

---

### Task 1: Pure Asset Metadata Helpers

**Files:**
- Modify: `tools/generator/lib/assets.js`
- Modify: `tools/generator/test/assets.test.js`

- [ ] **Step 1: Add failing tests**

Add tests for:
- building an asset library with usage labels from hero, sections, rooms, share image
- updating only `alt` and `tags` for matching asset ids
- normalizing comma-separated tags and preserving all other asset fields

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Implement helpers**

Implement:
- `buildAssetLibrary(site)`
- `updateAssetMetadata(site, updates)`

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 2: API And UI

**Files:**
- Modify: `tools/generator/server.js`
- Modify: `tools/generator/public/app.js`
- Modify: `tools/generator/public/styles.css`

- [ ] **Step 1: Add API endpoints**

Add:
- `GET /api/assets/library`
- `POST /api/assets/metadata`

- [ ] **Step 2: Render editable library**

Show every asset with thumbnail, id, orientation, usage, alt input, tags input, and one save button for all changed rows.

- [ ] **Step 3: Refresh after save**

After save, update local `state.site`, rerender the asset library, and show sync status.

### Task 3: Verification

**Files:**
- Verify changed files

- [ ] **Step 1: Static checks**

Run:
`npm test`
`node --check tools/generator/server.js`
`node --check tools/generator/public/app.js`
`node --check tools/generator/lib/assets.js`

- [ ] **Step 2: Config checks**

Run:
`node scripts/validate-site-config.js`
`node scripts/sync-site-config.js`

- [ ] **Step 3: Browser smoke test**

Open `http://127.0.0.1:57592/`, confirm the metadata editor renders and saving an unchanged library does not corrupt content.

- [ ] **Step 4: Commit**

Commit with message: `feat: add asset metadata editor`.
