# Shancong Content Contract Static Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static content-contract foundation that makes the mini program render from one validated `content/site.json` file.

**Architecture:** This plan creates a single source-of-truth content contract, a deterministic validator, a sync script that generates WeChat-compatible runtime JS, and small runtime adapters consumed by the existing pages. It intentionally stops before building the local content-generator UI and DeepSeek Chat; those are separate subsystems that should get their own plans after this foundation is stable.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, CommonJS modules, Node.js built-in `fs`/`path`, no runtime cloud service, no external npm dependencies.

---

## Scope Split

The approved spec covers three independently testable subsystems:

1. Content contract + static mini-program runtime.
2. Local content generator UI.
3. DeepSeek-backed Chat proposal flow.

This plan implements subsystem 1 only. It produces working, testable software on its own: the mini program renders from `content/site.json`, and local scripts validate/sync that file. The generator UI and AI Chat should be planned after this lands.

## File Structure

- Create: `content/site.json`
  - Single source-of-truth content file grouped by `site`, `share`, `assets`, `templates`, `pages`, and `links`.
- Create: `scripts/validate-site-config.js`
  - Deterministic validator for the content contract.
- Create: `scripts/sync-site-config.js`
  - Converts `content/site.json` into `utils/content-data.js`, because WeChat mini programs cannot directly `require` plain JSON data files.
- Create: `utils/content-data.js`
  - Generated CommonJS config. This file is committed so WeChat Developer Tools can run without a precompile step.
- Create: `utils/content.js`
  - Runtime adapter with stable accessors for pages.
- Modify: `utils/site.js`
  - Keep as compatibility wrapper over `utils/content.js`.
- Modify: `utils/gallery.js`
  - Keep as compatibility wrapper over `utils/content.js`.
- Modify: `utils/homestays.js`
  - Keep as compatibility wrapper over `utils/content.js`.
- Modify: `pages/home/home.js`
  - Use runtime content adapter and add share metadata.
- Modify: `pages/home/home.wxml`
  - Keep current template renderer shape; ensure it reads section data from `content.js` output.
- Modify: `pages/detail/detail.js`
  - Use runtime content adapter for site/contact and room data.
- Modify: `pages/contact/contact.js`
  - Use runtime content adapter for contact and links.
- Modify: `README.md`
  - Replace split-config instructions with single-file workflow.
- Modify: `docs/implementation-plan.md`
  - Align implementation notes with `content/site.json`.

## Task 0: Pre-flight Worktree Check

**Files:**
- Inspect only: repository root

- [ ] **Step 1: Confirm current dirty worktree**

Run:

```bash
git status --short
```

Expected: existing uncommitted mini-program changes may appear. Do not revert or reset them.

- [ ] **Step 2: Confirm current spec exists**

Run:

```bash
test -f docs/superpowers/specs/2026-05-25-shancong-static-showcase-ai-content-generator-design.md
```

Expected: command exits with status `0`.

- [ ] **Step 3: Commit policy for this implementation**

Use small commits after each task. Because the worktree already has uncommitted changes from prior iterations, each task below lists the files to stage. Before each commit, run:

```bash
git diff --cached --stat
```

Expected: the staged file list contains only the files named by that task.

## Task 1: Add Unified `content/site.json`

**Files:**
- Create: `content/site.json`
- Test: JSON parse command

- [ ] **Step 1: Create the unified content file**

Create `content/site.json` with this content. The `pages.rooms` array preserves all four room records currently shown by the mini program.

```json
{
  "version": 1,
  "site": {
    "brandName": "山从",
    "locationText": "湖北 · 恩施 · 鹤峰县",
    "address": "湖北省恩施土家族苗族自治州鹤峰县山从民宿"
  },
  "share": {
    "title": "山从｜恩施鹤峰深山民宿",
    "path": "/pages/home/home",
    "image": "hero_mountain_house"
  },
  "assets": [
    {
      "id": "hero_mountain_house",
      "src": "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
      "localTarget": "/assets/photos/landscape/hero-mountain-house-01.jpg",
      "orientation": "landscape",
      "alt": "深山里的山从民宿建筑",
      "tags": ["首页", "深山", "建筑"]
    },
    {
      "id": "scene_deep_mountain",
      "src": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
      "localTarget": "/assets/photos/landscape/scene-deep-mountain-01.jpg",
      "orientation": "landscape",
      "alt": "恩施鹤峰深山环境",
      "tags": ["深山", "安静"]
    },
    {
      "id": "scene_stream",
      "src": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
      "localTarget": "/assets/photos/landscape/scene-stream-01.jpg",
      "orientation": "landscape",
      "alt": "天然溪流和山谷",
      "tags": ["溪流", "避暑"]
    },
    {
      "id": "room_window_portrait",
      "src": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&h=1300&q=80",
      "localTarget": "/assets/photos/portrait/room-window-01.jpg",
      "orientation": "portrait",
      "alt": "漂亮房间和柔和光线",
      "tags": ["房间", "拍照"]
    },
    {
      "id": "room_linen_portrait",
      "src": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&h=1300&q=80",
      "localTarget": "/assets/photos/portrait/room-linen-01.jpg",
      "orientation": "portrait",
      "alt": "床品和房间细节",
      "tags": ["房间", "细节"]
    },
    {
      "id": "coffee_landscape",
      "src": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
      "localTarget": "/assets/photos/landscape/coffee-bar-01.jpg",
      "orientation": "landscape",
      "alt": "山野咖啡",
      "tags": ["咖啡", "公共区"]
    },
    {
      "id": "coffee_pour_portrait",
      "src": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&h=1300&q=80",
      "localTarget": "/assets/photos/portrait/coffee-pour-01.jpg",
      "orientation": "portrait",
      "alt": "手冲咖啡特写",
      "tags": ["咖啡", "特写"]
    }
  ],
  "templates": [
    {
      "id": "feature_landscape",
      "name": "横图沉浸大卡",
      "summary": "一张横屏大图配底部文字，适合山景、溪流、建筑和公共区。",
      "renderer": "feature_landscape",
      "slots": [
        { "id": "cover", "type": "image", "orientation": "landscape", "required": true }
      ],
      "fields": [
        { "id": "eyebrow", "type": "text", "maxLength": 16, "required": false },
        { "id": "title", "type": "text", "maxLength": 18, "required": true },
        { "id": "text", "type": "text", "maxLength": 54, "required": true }
      ]
    },
    {
      "id": "portrait_pair",
      "name": "双竖图并排",
      "summary": "两张竖屏图并排，适合房间、咖啡、床品和窗景细节。",
      "renderer": "portrait_pair",
      "slots": [
        { "id": "left", "type": "image", "orientation": "portrait", "required": true },
        { "id": "right", "type": "image", "orientation": "portrait", "required": true }
      ],
      "fields": [
        { "id": "eyebrow", "type": "text", "maxLength": 16, "required": false },
        { "id": "title", "type": "text", "maxLength": 18, "required": true },
        { "id": "text", "type": "text", "maxLength": 54, "required": true }
      ]
    },
    {
      "id": "mixed_mosaic",
      "name": "横图加竖图拼贴",
      "summary": "一张横屏主图加一张竖屏侧图，适合讲一个场景和一个细节。",
      "renderer": "mixed_mosaic",
      "slots": [
        { "id": "wide", "type": "image", "orientation": "landscape", "required": true },
        { "id": "tall", "type": "image", "orientation": "portrait", "required": true }
      ],
      "fields": [
        { "id": "eyebrow", "type": "text", "maxLength": 16, "required": false },
        { "id": "title", "type": "text", "maxLength": 18, "required": true },
        { "id": "text", "type": "text", "maxLength": 54, "required": true }
      ]
    },
    {
      "id": "single_portrait",
      "name": "竖图留白卡",
      "summary": "一张竖屏图配安静文案，适合特别漂亮的房间角落或咖啡特写。",
      "renderer": "single_portrait",
      "slots": [
        { "id": "cover", "type": "image", "orientation": "portrait", "required": true }
      ],
      "fields": [
        { "id": "eyebrow", "type": "text", "maxLength": 16, "required": false },
        { "id": "title", "type": "text", "maxLength": 18, "required": true },
        { "id": "text", "type": "text", "maxLength": 54, "required": true }
      ]
    }
  ],
  "pages": {
    "home": {
      "hero": {
        "image": "hero_mountain_house",
        "kicker": "山从｜恩施鹤峰深山民宿",
        "title": "住进深山溪流旁的安静夏天",
        "text": "天然溪流、避暑山风、漂亮房间和一杯认真做的咖啡。",
        "points": ["深山", "安静", "天然溪流", "避暑", "漂亮房间", "咖啡"]
      },
      "intro": {
        "title": "山从不是一个赶行程的地方。",
        "text": "它更像一段留白：在山里醒来，沿溪边走走，回到房间坐一会儿，再去喝咖啡。"
      },
      "sections": [
        {
          "id": "deep_mountain",
          "enabled": true,
          "template": "feature_landscape",
          "slots": { "cover": "scene_deep_mountain" },
          "copy": {
            "eyebrow": "远离城市噪音",
            "title": "深山",
            "text": "山从在恩施鹤峰县的山里，白天听风，夜里听溪流和虫鸣。"
          }
        },
        {
          "id": "natural_stream",
          "enabled": true,
          "template": "feature_landscape",
          "slots": { "cover": "scene_stream" },
          "copy": {
            "eyebrow": "夏天的清凉来自山谷",
            "title": "天然溪流",
            "text": "溪水从民宿旁经过，适合散步、放空，也让夏季停留更舒服。"
          }
        },
        {
          "id": "beautiful_rooms",
          "enabled": true,
          "template": "portrait_pair",
          "slots": {
            "left": "room_window_portrait",
            "right": "room_linen_portrait"
          },
          "copy": {
            "eyebrow": "住下来也想拍照",
            "title": "漂亮房间",
            "text": "自然材质、柔和光线和干净留白，把睡眠和审美放在一起。"
          }
        },
        {
          "id": "mountain_coffee",
          "enabled": true,
          "template": "mixed_mosaic",
          "slots": {
            "wide": "coffee_landscape",
            "tall": "coffee_pour_portrait"
          },
          "copy": {
            "eyebrow": "早晨从一杯咖啡开始",
            "title": "山野咖啡",
            "text": "在山雾还没散的时候，喝一杯认真做的咖啡，再慢慢开始一天。"
          }
        }
      ]
    },
    "rooms": [
      {
        "id": "hs001",
        "name": "山从 · 溪流大床房",
        "tagline": "推窗见溪，睡进恩施鹤峰的深山安静里",
        "city": "恩施",
        "area": "鹤峰县",
        "type": "溪流",
        "price": 880,
        "rating": 4.9,
        "reviews": 86,
        "capacity": 2,
        "beds": "1张观景大床",
        "rooms": "一室一卫一景窗",
        "cover": "scene_deep_mountain",
        "images": ["scene_deep_mountain", "hero_mountain_house", "room_linen_portrait"],
        "tags": ["深山", "天然溪流", "安静"],
        "amenities": ["观景窗", "独立卫浴", "精品床品", "咖啡", "蓝牙音箱", "停车位"],
        "highlights": [
          "民宿位于恩施鹤峰县深山环境，远离主路车流和城市噪音",
          "天然溪流从房前山谷经过，适合放空、散步和夏季避暑",
          "房间强调极简美学和舒适床品，适合情侣或独处休息"
        ],
        "policies": ["14:00 后入住", "12:00 前退房", "入住需登记有效身份信息"]
      },
      {
        "id": "hs002",
        "name": "山从 · 咖啡露台房",
        "tagline": "在山雾和溪声里喝一杯晨间咖啡",
        "city": "恩施",
        "area": "鹤峰县",
        "type": "咖啡",
        "price": 980,
        "rating": 4.9,
        "reviews": 72,
        "capacity": 2,
        "beds": "1张大床",
        "rooms": "一室一卫一露台",
        "cover": "coffee_landscape",
        "images": ["coffee_landscape", "room_window_portrait", "scene_deep_mountain"],
        "tags": ["咖啡", "露台", "避暑"],
        "amenities": ["咖啡吧", "观景露台", "独立卫浴", "遮光窗帘", "洗漱套装"],
        "highlights": [
          "主打山野咖啡体验，适合清晨看山雾、傍晚听溪水",
          "露台面向山谷，夏季体感清凉，适合短住避暑",
          "房间保留充足留白和自然材质，拍照和休息都更舒服"
        ],
        "policies": ["14:00 后入住", "12:00 前退房", "22:00 后请降低室外音量"]
      },
      {
        "id": "hs003",
        "name": "山从 · 山景双床房",
        "tagline": "适合好友同行，在安静山谷里清凉过夜",
        "city": "恩施",
        "area": "鹤峰县",
        "type": "避暑",
        "price": 920,
        "rating": 4.8,
        "reviews": 58,
        "capacity": 3,
        "beds": "2张单人床",
        "rooms": "一室一卫",
        "cover": "room_window_portrait",
        "images": ["room_window_portrait", "room_linen_portrait", "scene_deep_mountain"],
        "tags": ["避暑", "山景", "好友"],
        "amenities": ["山景窗", "独立卫浴", "空调", "咖啡", "停车位", "行李寄存"],
        "highlights": [
          "适合朋友结伴、亲子短住或夏天来鹤峰避暑",
          "房间安静度高，夜晚主要是溪流和虫鸣声",
          "公共区可喝咖啡、阅读和整理旅行路线"
        ],
        "policies": ["14:00 后入住", "12:00 前退房", "不可在房内明火烹饪"]
      },
      {
        "id": "hs004",
        "name": "山从 · 深山包栋",
        "tagline": "把整段溪流、咖啡和安静山夜留给一群人",
        "city": "恩施",
        "area": "鹤峰县",
        "type": "包栋",
        "price": 3680,
        "rating": 4.9,
        "reviews": 41,
        "capacity": 10,
        "beds": "多间大床房与双床房",
        "rooms": "整栋民宿包场",
        "cover": "hero_mountain_house",
        "images": ["hero_mountain_house", "scene_deep_mountain", "coffee_landscape"],
        "tags": ["包栋", "团建", "深山"],
        "amenities": ["整栋独享", "咖啡吧", "溪流步道", "公共客厅", "停车位", "管家服务"],
        "highlights": [
          "适合家庭聚会、小型团建或朋友结伴避暑",
          "整栋独享，公共区可安排咖啡、茶歇和轻活动",
          "在深山环境中保持足够私密和安静，适合连续住几晚"
        ],
        "policies": ["15:00 后入住", "11:00 前退房", "包栋活动请提前确认人数和餐饮需求"]
      }
    ],
    "contact": {
      "hostName": "山从管家",
      "phone": "13800138000",
      "wechatId": "shancong_homestay",
      "responseText": "山路、天气、房间和咖啡都建议出发前确认，电话或微信会更直接。"
    }
  },
  "links": [
    {
      "id": "xiaohongshu",
      "title": "小红书",
      "summary": "查看山从近期图文、房间照片和住客笔记",
      "type": "copy",
      "value": "",
      "enabled": false
    },
    {
      "id": "map",
      "title": "导航链接",
      "summary": "复制地图定位链接，出发前发给同行人",
      "type": "copy",
      "value": "",
      "enabled": false
    },
    {
      "id": "external-platform",
      "title": "预订平台",
      "summary": "跳转到已配置的小程序平台查看档期",
      "type": "miniProgram",
      "appId": "",
      "path": "",
      "enabled": false
    }
  ]
}
```

- [ ] **Step 2: Verify JSON parses**

Run:

```bash
node -e 'JSON.parse(require("fs").readFileSync("content/site.json","utf8")); console.log("site json ok")'
```

Expected:

```text
site json ok
```

- [ ] **Step 3: Commit**

```bash
git add content/site.json
git commit -m "feat: add unified site content contract"
```

## Task 2: Add Deterministic Site Config Validator

**Files:**
- Create: `scripts/validate-site-config.js`
- Test: `node scripts/validate-site-config.js`

- [ ] **Step 1: Write validator script**

Create `scripts/validate-site-config.js` with this content:

```js
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "content/site.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const errors = [];
const warnings = [];
const supportedRenderers = new Set([
  "feature_landscape",
  "portrait_pair",
  "mixed_mosaic",
  "single_portrait"
]);

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function indexById(items, label) {
  const map = new Map();
  for (const item of items || []) {
    if (!item || !isNonEmptyString(item.id)) {
      fail(`${label} item is missing id`);
      continue;
    }
    if (map.has(item.id)) {
      fail(`${label} id duplicated: ${item.id}`);
    }
    map.set(item.id, item);
  }
  return map;
}

function validateTopLevel() {
  if (config.version !== 1) {
    fail("version must be 1");
  }
  if (!config.site) {
    fail("site is required");
    return;
  }
  if (!isNonEmptyString(config.site.brandName)) {
    fail("site.brandName is required");
  }
  if (!isNonEmptyString(config.site.locationText)) {
    fail("site.locationText is required");
  }
  if (!isNonEmptyString(config.site.address)) {
    fail("site.address is required");
  }
  if (!config.share || !isNonEmptyString(config.share.title)) {
    fail("share.title is required");
  }
  if (!config.pages || !config.pages.home || !config.pages.contact) {
    fail("pages.home and pages.contact are required");
  }
}

function validateAssets(assetMap) {
  for (const asset of assetMap.values()) {
    if (!["landscape", "portrait"].includes(asset.orientation)) {
      fail(`asset ${asset.id} orientation must be landscape or portrait`);
    }
    if (!isNonEmptyString(asset.src)) {
      fail(`asset ${asset.id} src is required`);
    }
    if (!isNonEmptyString(asset.alt)) {
      warn(`asset ${asset.id} alt is empty`);
    }
    if (asset.src && asset.src.startsWith("/")) {
      const assetPath = path.join(repoRoot, asset.src);
      if (!fs.existsSync(assetPath)) {
        fail(`asset ${asset.id} local path does not exist: ${asset.src}`);
      }
    }
  }
}

function validateTemplates(templateMap) {
  for (const template of templateMap.values()) {
    if (!supportedRenderers.has(template.renderer)) {
      fail(`template ${template.id} renderer is not supported: ${template.renderer}`);
    }
    if (!Array.isArray(template.slots) || template.slots.length === 0) {
      fail(`template ${template.id} must define slots`);
    }
    if (!Array.isArray(template.fields)) {
      fail(`template ${template.id} must define fields array`);
    }
    for (const slot of template.slots || []) {
      if (!isNonEmptyString(slot.id)) {
        fail(`template ${template.id} has slot without id`);
      }
      if (slot.type !== "image") {
        fail(`template ${template.id} slot ${slot.id} type must be image`);
      }
      if (!["landscape", "portrait"].includes(slot.orientation)) {
        fail(`template ${template.id} slot ${slot.id} orientation is invalid`);
      }
    }
  }
}

function validateSection(section, templateMap, assetMap) {
  if (!isNonEmptyString(section.id)) {
    fail("home section missing id");
  }
  const template = templateMap.get(section.template);
  if (!template) {
    fail(`section ${section.id} references missing template ${section.template}`);
    return;
  }
  for (const slot of template.slots) {
    const assetId = section.slots && section.slots[slot.id];
    if (slot.required && !assetId) {
      fail(`section ${section.id} missing required slot ${slot.id}`);
      continue;
    }
    const asset = assetMap.get(assetId);
    if (!asset) {
      fail(`section ${section.id} slot ${slot.id} references missing asset ${assetId}`);
      continue;
    }
    if (asset.orientation !== slot.orientation) {
      fail(`section ${section.id} slot ${slot.id} requires ${slot.orientation}, got ${asset.orientation}`);
    }
  }
  for (const field of template.fields || []) {
    const value = section.copy && section.copy[field.id];
    if (field.required && !isNonEmptyString(value)) {
      fail(`section ${section.id} missing required copy.${field.id}`);
    }
    if (value && field.maxLength && value.length > field.maxLength) {
      warn(`section ${section.id} copy.${field.id} length ${value.length} exceeds ${field.maxLength}`);
    }
  }
}

function validatePages(templateMap, assetMap) {
  const home = config.pages && config.pages.home;
  if (!home) {
    return;
  }
  if (!assetMap.has(home.hero && home.hero.image)) {
    fail(`home.hero.image references missing asset ${home.hero && home.hero.image}`);
  }
  for (const section of home.sections || []) {
    if (section.enabled === false) {
      continue;
    }
    validateSection(section, templateMap, assetMap);
  }

  for (const room of config.pages.rooms || []) {
    if (!isNonEmptyString(room.id)) {
      fail("room missing id");
    }
    if (!assetMap.has(room.cover)) {
      fail(`room ${room.id} cover references missing asset ${room.cover}`);
    }
    for (const imageId of room.images || []) {
      if (!assetMap.has(imageId)) {
        fail(`room ${room.id} image references missing asset ${imageId}`);
      }
    }
  }

  const contact = config.pages.contact;
  if (!isNonEmptyString(contact.phone) && !isNonEmptyString(contact.wechatId)) {
    fail("pages.contact.phone or pages.contact.wechatId is required");
  }
}

function validateLinks() {
  for (const link of config.links || []) {
    if (!isNonEmptyString(link.id)) {
      fail("link missing id");
    }
    if (!["copy", "miniProgram"].includes(link.type)) {
      fail(`link ${link.id} type must be copy or miniProgram`);
    }
    if (link.enabled && link.type === "copy" && !isNonEmptyString(link.value)) {
      fail(`enabled copy link ${link.id} requires value`);
    }
    if (link.enabled && link.type === "miniProgram" && !isNonEmptyString(link.appId)) {
      fail(`enabled miniProgram link ${link.id} requires appId`);
    }
  }
}

validateTopLevel();
const assetMap = indexById(config.assets, "asset");
const templateMap = indexById(config.templates, "template");
validateAssets(assetMap);
validateTemplates(templateMap);
validatePages(templateMap, assetMap);
validateLinks();

for (const message of warnings) {
  console.warn(`warning: ${message}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("site config ok");
```

- [ ] **Step 2: Run validator**

Run:

```bash
node scripts/validate-site-config.js
```

Expected:

```text
site config ok
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-site-config.js
git commit -m "feat: validate site content contract"
```

## Task 3: Add Sync Script and Runtime Data

**Files:**
- Create: `scripts/sync-site-config.js`
- Create: `utils/content-data.js`
- Test: `node scripts/sync-site-config.js`

- [ ] **Step 1: Write sync script**

Create `scripts/sync-site-config.js` with this content:

```js
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "content/site.json");
const outputPath = path.join(repoRoot, "utils/content-data.js");
const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const output = [
  "// This file is generated from content/site.json.",
  "// Run `node scripts/sync-site-config.js` after editing content/site.json.",
  `module.exports = ${JSON.stringify(config, null, 2)};`,
  ""
].join("\n");

fs.writeFileSync(outputPath, output);
console.log("synced utils/content-data.js");
```

- [ ] **Step 2: Generate runtime data**

Run:

```bash
node scripts/sync-site-config.js
```

Expected:

```text
synced utils/content-data.js
```

- [ ] **Step 3: Verify generated file is valid JS**

Run:

```bash
node --check utils/content-data.js
```

Expected: no output and exit status `0`.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-site-config.js utils/content-data.js
git commit -m "feat: sync site content for mini program runtime"
```

## Task 4: Add Runtime Content Adapter and Compatibility Wrappers

**Files:**
- Create: `utils/content.js`
- Modify: `utils/site.js`
- Modify: `utils/gallery.js`
- Modify: `utils/homestays.js`
- Test: `node --check ...`

- [ ] **Step 1: Write runtime content adapter**

Create `utils/content.js` with this content:

```js
const content = require("./content-data");

function getAssetMap() {
  return content.assets.reduce((map, asset) => {
    map[asset.id] = asset;
    return map;
  }, {});
}

function resolveAsset(assetId, assetMap) {
  return assetMap[assetId] || null;
}

function resolveSlots(slots, assetMap) {
  return Object.keys(slots || {}).reduce((resolved, slotName) => {
    resolved[slotName] = resolveAsset(slots[slotName], assetMap);
    return resolved;
  }, {});
}

function assetSrc(assetId, assetMap) {
  const asset = resolveAsset(assetId, assetMap);
  return asset ? asset.src : "";
}

function getSiteConfig() {
  return {
    brandName: content.site.brandName,
    locationText: content.site.locationText,
    address: content.site.address,
    sellingPoints: content.pages.home.hero.points,
    hero: Object.assign({}, content.pages.home.hero, {
      image: assetSrc(content.pages.home.hero.image, getAssetMap())
    }),
    intro: content.pages.home.intro,
    contact: content.pages.contact,
    wxCustomerServiceEnabled: Boolean(content.pages.contact.wxCustomerServiceEnabled)
  };
}

function getSellingPoints() {
  return content.pages.home.hero.points;
}

function getHomeGallerySections() {
  const assetMap = getAssetMap();
  return content.pages.home.sections
    .filter((section) => section.enabled !== false)
    .map((section) => Object.assign({}, section, {
      slots: resolveSlots(section.slots, assetMap)
    }));
}

function getHomestays() {
  const assetMap = getAssetMap();
  return content.pages.rooms.map((room) => Object.assign({}, room, {
    address: content.site.address,
    cover: assetSrc(room.cover, assetMap),
    images: (room.images || []).map((imageId) => assetSrc(imageId, assetMap)),
    host: {
      name: content.pages.contact.hostName,
      phone: content.pages.contact.phone,
      response: content.pages.contact.responseText
    }
  }));
}

function getHomestayById(id) {
  return getHomestays().find((room) => room.id === id);
}

function getLeadLinks() {
  return (content.links || []).filter((link) => {
    if (link.enabled === false) {
      return false;
    }
    return link.type === "copy" && Boolean(link.value);
  });
}

function getMiniProgramLinks() {
  return (content.links || []).filter((link) => {
    if (link.enabled === false) {
      return false;
    }
    return link.type === "miniProgram" && Boolean(link.appId);
  });
}

function getShareConfig() {
  const assetMap = getAssetMap();
  return Object.assign({}, content.share, {
    imageUrl: assetSrc(content.share.image, assetMap)
  });
}

module.exports = {
  getHomeGallerySections,
  getHomestayById,
  getHomestays,
  getLeadLinks,
  getMiniProgramLinks,
  getSellingPoints,
  getShareConfig,
  getSiteConfig
};
```

- [ ] **Step 2: Replace `utils/site.js` with wrapper**

Replace `utils/site.js` content with:

```js
const {
  getLeadLinks,
  getMiniProgramLinks,
  getSellingPoints,
  getSiteConfig
} = require("./content");

module.exports = {
  getLeadLinks,
  getMiniProgramLinks,
  getSellingPoints,
  getSiteConfig
};
```

- [ ] **Step 3: Replace `utils/gallery.js` with wrapper**

Replace `utils/gallery.js` content with:

```js
const {
  getHomeGallerySections
} = require("./content");

module.exports = {
  getHomeGallerySections
};
```

- [ ] **Step 4: Replace `utils/homestays.js` with wrapper**

Replace `utils/homestays.js` content with:

```js
const {
  getHomestayById,
  getHomestays
} = require("./content");

function getCities() {
  return ["全部"].concat(Array.from(new Set(getHomestays().map((item) => item.city))));
}

function getTypes() {
  return ["全部"].concat(Array.from(new Set(getHomestays().map((item) => item.type))));
}

module.exports = {
  getCities,
  getHomestayById,
  getHomestays,
  getTypes
};
```

- [ ] **Step 5: Check JS syntax**

Run:

```bash
node --check utils/content.js && node --check utils/site.js && node --check utils/gallery.js && node --check utils/homestays.js
```

Expected: no output and exit status `0`.

- [ ] **Step 6: Smoke test adapter output**

Run:

```bash
node -e 'const c=require("./utils/content"); console.log(c.getSiteConfig().brandName, c.getHomeGallerySections().length, c.getHomestays().length)'
```

Expected:

```text
山从 4 4
```

- [ ] **Step 7: Commit**

```bash
git add utils/content.js utils/site.js utils/gallery.js utils/homestays.js
git commit -m "feat: read mini program data from content contract"
```

## Task 5: Wire Pages to Runtime Content and Share Metadata

**Files:**
- Modify: `pages/home/home.js`
- Modify: `pages/detail/detail.js`
- Modify: `pages/contact/contact.js`
- Test: syntax checks and WeChat Developer Tools compile

- [ ] **Step 1: Update home page imports and share handling**

In `pages/home/home.js`, use `utils/content` directly and add `onShareAppMessage`. The final file should be:

```js
const {
  getHomeGallerySections,
  getHomestays,
  getSellingPoints,
  getShareConfig,
  getSiteConfig
} = require("../../utils/content");

Page({
  data: {
    site: getSiteConfig(),
    gallerySections: getHomeGallerySections(),
    sellingPoints: getSellingPoints(),
    rooms: []
  },

  onLoad() {
    this.setData({ rooms: getHomestays() });
  },

  onShareAppMessage() {
    const share = getShareConfig();
    return {
      title: share.title,
      path: share.path,
      imageUrl: share.imageUrl
    };
  },

  goContact() {
    wx.navigateTo({ url: "/pages/contact/contact" });
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  }
});
```

- [ ] **Step 2: Update detail page imports**

In `pages/detail/detail.js`, replace the imports with:

```js
const {
  getHomestayById,
  getSiteConfig
} = require("../../utils/content");
```

Keep the existing page methods unchanged after the import block.

- [ ] **Step 3: Update contact page imports**

In `pages/contact/contact.js`, replace the import block with:

```js
const {
  getLeadLinks,
  getMiniProgramLinks,
  getSiteConfig
} = require("../../utils/content");
```

Keep the existing page methods unchanged after the import block.

- [ ] **Step 4: Check page JS syntax**

Run:

```bash
node --check pages/home/home.js && node --check pages/detail/detail.js && node --check pages/contact/contact.js
```

Expected: no output and exit status `0`.

- [ ] **Step 5: Run contract validation and sync**

Run:

```bash
node scripts/validate-site-config.js && node scripts/sync-site-config.js
```

Expected:

```text
site config ok
synced utils/content-data.js
```

- [ ] **Step 6: Compile in WeChat Developer Tools**

Open WeChat Developer Tools and click `编译`.

Expected:

- Home page renders.
- Console has no `module is not defined` errors.
- Console may show WeChat base-library warnings; those are not blockers.

- [ ] **Step 7: Commit**

```bash
git add pages/home/home.js pages/detail/detail.js pages/contact/contact.js utils/content-data.js
git commit -m "feat: wire pages to unified content runtime"
```

## Task 6: Remove Old Split Gallery Runtime

**Files:**
- Delete: `content/gallery.json`
- Delete: `scripts/sync-gallery-config.js`
- Delete: `scripts/validate-gallery-config.js`
- Modify: `README.md`
- Modify: `docs/implementation-plan.md`
- Test: `rg` checks

- [ ] **Step 1: Delete old split gallery files**

Run:

```bash
for f in content/gallery.json scripts/sync-gallery-config.js scripts/validate-gallery-config.js; do test -f "$f" && rm "$f"; done
```

Expected: files are removed.

- [ ] **Step 2: Update README workflow**

In `README.md`, replace references to `content/gallery.json`, `utils/gallery-data.js`, `sync-gallery-config.js`, and `validate-gallery-config.js` with this workflow:

```markdown
### 内容维护

第一版内容统一维护在 `content/site.json`。

- `site`：品牌、地址和位置。
- `share`：朋友圈/群分享标题、路径和分享图。
- `assets`：所有图片资源，包含横屏/竖屏方向、路径、alt 和标签。
- `templates`：首页 UI 模版定义。
- `pages.home`：首页首屏、介绍和画廊 sections。
- `pages.rooms`：房间展示内容。
- `pages.contact`：电话、微信和联系说明。
- `links`：小红书、地图、外部平台和小程序跳转。

改完内容后运行：

```bash
node scripts/validate-site-config.js
node scripts/sync-site-config.js
```
```

- [ ] **Step 3: Update implementation plan docs**

In `docs/implementation-plan.md`, replace split-config references with:

```markdown
- `content/site.json`：唯一内容源，包含站点、分享、图片、模版、首页、房间、联系和链接。
- `utils/content-data.js`：由 `content/site.json` 生成的小程序运行时配置。
- `scripts/validate-site-config.js`：校验内容契约。
- `scripts/sync-site-config.js`：同步运行时配置。
```

- [ ] **Step 4: Verify old names are gone**

Run:

```bash
rg -n "gallery-data|sync-gallery|validate-gallery|content/gallery.json" README.md docs scripts utils pages content
```

Expected: no matches and exit status `1`.

- [ ] **Step 5: Verify current scripts still pass**

Run:

```bash
node scripts/validate-site-config.js && node scripts/sync-site-config.js && node --check utils/content-data.js
```

Expected:

```text
site config ok
synced utils/content-data.js
```

- [ ] **Step 6: Commit**

```bash
git add README.md docs/implementation-plan.md content scripts utils/content-data.js
git commit -m "docs: document unified site content workflow"
```

## Task 7: Final Verification

**Files:**
- Inspect: all changed files

- [ ] **Step 1: Run all deterministic checks**

Run:

```bash
node scripts/validate-site-config.js
node scripts/sync-site-config.js
node --check app.js
node --check utils/content.js
node --check utils/content-data.js
node --check utils/site.js
node --check utils/gallery.js
node --check utils/homestays.js
node --check pages/home/home.js
node --check pages/detail/detail.js
node --check pages/contact/contact.js
node -e 'for (const f of ["app.json","project.config.json","sitemap.json","pages/home/home.json","pages/detail/detail.json","pages/contact/contact.json","content/site.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("json ok")'
```

Expected:

```text
site config ok
synced utils/content-data.js
json ok
```

- [ ] **Step 2: Verify no old pages are referenced**

Run:

```bash
rg -n "pages/(booking|orders|profile|messages)|utils/(orders|date|messages)|goBooking|goOrders|goProfile|goMessages|立即预订|我的订单|提交订单|留言咨询" .
```

Expected: no matches and exit status `1`.

- [ ] **Step 3: Verify no DeepSeek API key is present**

Run:

```bash
rg -n "DEEPSEEK_API_KEY|sk-[A-Za-z0-9]" .
```

Expected: no matches and exit status `1`.

- [ ] **Step 4: Compile and smoke test in WeChat Developer Tools**

In WeChat Developer Tools:

1. Click `编译`.
2. Confirm homepage renders the hero, gallery, room card, and bottom contact band.
3. Tap the bottom contact entry.
4. Confirm contact page renders phone, WeChat ID, and address.
5. Return home and tap a room.
6. Confirm detail page renders images and contact buttons.

Expected: no runtime errors in the console except non-blocking WeChat base-library warnings.

- [ ] **Step 5: Commit final verification adjustments if any**

Only if Step 1-4 required small fixes:

Stage only the files changed by those fixes, confirm the staged file list with `git diff --cached --stat`, then commit:

```bash
git commit -m "fix: complete content contract runtime verification"
```

Expected: if no fixes were required, skip this commit.

## Follow-up Plans Required

After this plan lands, create separate implementation plans for:

1. **Local Content Generator UI**
   - Browser UI for editing `content/site.json`, selecting assets, previewing sections, and accepting generated output.
2. **DeepSeek Chat Proposal Flow**
   - Local API key handling, OpenAI-compatible DeepSeek adapter, proposal schema, diff preview, accept/reject flow.

These should not be implemented inside this plan because they are independent subsystems with their own test surface.
