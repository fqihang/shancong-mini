const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const {
  validateSiteConfig
} = require("../../scripts/lib/site-validator");
const {
  assetChoicesForRequirement,
  applyTemplatePackProposal,
  buildWorkflowSteps,
  draftToSite,
  summarizeDraftProgress,
  validateDraftBeforeCompile,
  templatePackToDraft
} = require("./lib/workflow");

const repoRoot = path.resolve(__dirname, "../..");
const publicRoot = path.join(__dirname, "public");
const sitePath = path.join(repoRoot, "content/site.json");
const templatePacksPath = path.join(repoRoot, "content/template-packs.json");
const defaultPort = Number(process.env.PORT || process.env.GENERATOR_PORT || 57592);

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readSite() {
  return readJsonFile(sitePath);
}

function writeSite(site) {
  fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);
}

function readTemplatePacks() {
  if (!fs.existsSync(templatePacksPath)) {
    return { version: 1, templatePacks: [] };
  }
  return readJsonFile(templatePacksPath);
}

function writeTemplatePacks(payload) {
  fs.writeFileSync(templatePacksPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) {
        reject(new Error("Request body is too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${error.message}`));
      }
    });
    req.on("error", reject);
  });
}

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error((stderr || stdout || `script exited with ${code}`).trim()));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function validate(site) {
  return validateSiteConfig(site, { repoRoot });
}

function buildAssetChoicesForPack(site, templatePack) {
  return {
    hero: assetChoicesForRequirement(site, {
      orientation: "landscape",
      recommendedTags: ["首页", "建筑", "深山"]
    }),
    sections: Object.fromEntries((templatePack.sections || []).map((section) => {
      const slots = Object.fromEntries(Object.entries(section.slots || {}).map(([slotId, requirement]) => [
        slotId,
        assetChoicesForRequirement(site, requirement)
      ]));
      return [section.id, slots];
    }))
  };
}

function getDeepSeekKey() {
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY.trim();
  }
  if (process.env.DEEPSEEK_API_KEY_FILE) {
    const filePath = path.resolve(repoRoot, process.env.DEEPSEEK_API_KEY_FILE);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8").trim();
    }
  }
  const localKeyPath = path.join(repoRoot, ".deepseek-key");
  if (fs.existsSync(localKeyPath)) {
    return fs.readFileSync(localKeyPath, "utf8").trim();
  }
  return "";
}

async function readReferenceUrl(url) {
  if (!url) {
    return "";
  }
  const response = await fetch(url);
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

function buildContentProposalPrompt(site) {
  return [
    "你是山从民宿本地内容生成器里的内容与页面编排助手。",
    "你只能输出 JSON proposal，不能输出 Markdown、解释文字、WXML、WXSS、JS 或 API key。",
    "小程序定位：无云服务器、静态展示、获客、朋友圈和微信群传播。",
    "视觉原则：安静画廊感、大图、少字、留白、低销售感；避免强下单文案。",
    "Proposal 格式必须是：",
    JSON.stringify({
      type: "content_proposal",
      summary: "一句话说明改动",
      changes: {
        site: {},
        share: {},
        assets: [],
        templates: [],
        pages: {
          home: {
            hero: {},
            intro: {},
            sections: []
          },
          rooms: [],
          contact: {}
        },
        links: []
      },
      warnings: []
    }, null, 2),
    "如果 changes.pages.home.sections 存在，它必须是完整替换后的首页 sections 数组。",
    "如果 changes.assets、changes.templates、changes.pages.rooms 或 changes.links 存在，每项必须带 id；生成器会按 id 合并。",
    "只能引用当前 assets 里存在的图片 id，除非用户明确要求新增素材条目。",
    "当前可用 templates：",
    JSON.stringify(site.templates, null, 2),
    "当前 assets 摘要：",
    JSON.stringify(site.assets.map((asset) => ({
      id: asset.id,
      orientation: asset.orientation,
      alt: asset.alt,
      tags: asset.tags || []
    })), null, 2)
  ].join("\n\n");
}

function buildTemplatePackPrompt(site, references) {
  return [
    "你是山从民宿本地内容生成器里的页面方案设计师。",
    "你要分析用户给的网页、案例文档、素材清单和聊天要求，生成可保存的 templatePack demo。",
    "只能输出 JSON，不能输出 Markdown、解释文字、WXML、WXSS、JS 或 API key。",
    "DeepSeek 当前在本工具里只按文本和素材 metadata 工作，不要假装看到了图片真实内容；只能依据图片 id、orientation、alt、tags 推荐。",
    "视觉原则：安静画廊感、大图、少字、留白、低销售感；不要下单导向。",
    "输出格式必须是：",
    JSON.stringify({
      type: "template_pack_proposal",
      summary: "一句话说明这批 demo",
      templatePacks: [
        {
          id: "lowercase-kebab-id",
          name: "模版名",
          summary: "模版用途",
          styleKeywords: ["安静", "画廊感"],
          hero: {
            imageSlot: "hero",
            kicker: "山从｜恩施鹤峰深山民宿",
            title: "首屏标题",
            text: "首屏短文案",
            points: ["深山", "溪流"]
          },
          sections: [
            {
              id: "section_id",
              template: "feature_landscape",
              slots: {
                cover: { orientation: "landscape", recommendedTags: ["深山"] }
              },
              copy: {
                eyebrow: "不超过 16 字",
                title: "不超过 18 字",
                text: "不超过 54 字"
              }
            }
          ],
          workflow: [
            { id: "basic", title: "基础信息", fields: ["site.brandName", "site.locationText", "site.address"] },
            { id: "hero", title: "首屏", fields: ["hero.image", "hero.title", "hero.text", "hero.points"] },
            { id: "sections", title: "图片区块", fields: ["sections"] },
            { id: "contact", title: "联系方式", fields: ["contact.phone", "contact.wechatId", "links"] }
          ]
        }
      ],
      warnings: []
    }, null, 2),
    "当前可用小程序 renderer templates：",
    JSON.stringify(site.templates, null, 2),
    "当前素材 metadata：",
    JSON.stringify(site.assets.map((asset) => ({
      id: asset.id,
      orientation: asset.orientation,
      alt: asset.alt,
      tags: asset.tags || []
    })), null, 2),
    "参考材料：",
    JSON.stringify(references || {}, null, 2)
  ].join("\n\n");
}

function stripJsonFence(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function upsertById(existing, incoming) {
  if (!Array.isArray(incoming)) {
    return existing;
  }
  const map = new Map((existing || []).map((item) => [item.id, item]));
  for (const item of incoming) {
    if (item && item.id) {
      map.set(item.id, Object.assign({}, map.get(item.id), item));
    }
  }
  return Array.from(map.values());
}

function mergePlainObject(base, changes) {
  if (!changes || Array.isArray(changes) || typeof changes !== "object") {
    return base;
  }
  const output = Object.assign({}, base);
  for (const [key, value] of Object.entries(changes)) {
    if (Array.isArray(value)) {
      output[key] = value;
    } else if (value && typeof value === "object") {
      output[key] = mergePlainObject(output[key] || {}, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function applyProposal(site, proposal) {
  const changes = proposal && proposal.changes;
  if (!changes || typeof changes !== "object") {
    return site;
  }
  const next = JSON.parse(JSON.stringify(site));
  next.site = mergePlainObject(next.site, changes.site);
  next.share = mergePlainObject(next.share, changes.share);
  next.assets = upsertById(next.assets, changes.assets);
  next.templates = upsertById(next.templates, changes.templates);
  next.links = upsertById(next.links, changes.links);

  if (changes.pages) {
    next.pages = mergePlainObject(next.pages, changes.pages);
    if (changes.pages.rooms) {
      next.pages.rooms = upsertById(site.pages.rooms, changes.pages.rooms);
    }
    if (changes.pages.home && Array.isArray(changes.pages.home.sections)) {
      next.pages.home.sections = changes.pages.home.sections;
    }
  }

  return next;
}

async function callDeepSeek(message, site) {
  const apiKey = getDeepSeekKey();
  if (!apiKey) {
    const error = new Error("Missing DeepSeek API key. Set DEEPSEEK_API_KEY or create a local .deepseek-key file.");
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [
      { role: "system", content: buildContentProposalPrompt(site) },
      {
        role: "user",
        content: JSON.stringify({
          request: message,
          currentSite: site
        })
      }
    ]
  };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`DeepSeek returned non-JSON response: ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(data.error && data.error.message ? data.error.message : text);
  }

  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error("DeepSeek response did not include message content");
  }

  let proposal;
  try {
    proposal = JSON.parse(stripJsonFence(content));
  } catch (error) {
    throw new Error(`DeepSeek proposal is not valid JSON: ${error.message}`);
  }

  const previewSite = applyProposal(site, proposal);
  return {
    proposal,
    previewValidation: validate(previewSite)
  };
}

async function callDeepSeekTemplatePack(message, site, references) {
  const apiKey = getDeepSeekKey();
  if (!apiKey) {
    const error = new Error("Missing DeepSeek API key. Set DEEPSEEK_API_KEY or create a local .deepseek-key file.");
    error.statusCode = 400;
    throw error;
  }

  const referenceUrlText = references && references.url
    ? await readReferenceUrl(references.url)
    : "";

  const payload = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    response_format: { type: "json_object" },
    temperature: 0.75,
    messages: [
      {
        role: "system",
        content: buildTemplatePackPrompt(site, Object.assign({}, references, { urlText: referenceUrlText }))
      },
      {
        role: "user",
        content: JSON.stringify({
          request: message,
          currentSiteSummary: {
            site: site.site,
            home: site.pages.home,
            contact: site.pages.contact
          }
        })
      }
    ]
  };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = JSON.parse(text);
  if (!response.ok) {
    throw new Error(data.error && data.error.message ? data.error.message : text);
  }

  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error("DeepSeek response did not include message content");
  }

  let proposal;
  try {
    proposal = JSON.parse(stripJsonFence(content));
  } catch (error) {
    throw new Error(`DeepSeek template proposal is not valid JSON: ${error.message}`);
  }

  return { proposal };
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  if (pathname.startsWith("/assets/")) {
    const assetPath = path.join(repoRoot, path.normalize(decodeURIComponent(pathname)));
    if (!assetPath.startsWith(repoRoot) || !fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
      sendText(res, 404, "Not found");
      return;
    }
    const body = fs.readFileSync(assetPath);
    res.writeHead(200, {
      "Content-Type": contentTypeFor(assetPath),
      "Content-Length": body.length
    });
    res.end(body);
    return;
  }
  const normalized = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicRoot, normalized);
  if (!filePath.startsWith(publicRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypeFor(filePath),
    "Content-Length": body.length
  });
  res.end(body);
}

async function handleApi(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && requestUrl.pathname === "/api/site") {
      const site = readSite();
      const templatePackPayload = readTemplatePacks();
      sendJson(res, 200, {
        site,
        templatePacks: templatePackPayload.templatePacks,
        validation: validate(site),
        deepSeekConfigured: Boolean(getDeepSeekKey())
      });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/validate") {
      const body = await readBody(req);
      const site = body.site || body.config;
      sendJson(res, 200, { validation: validate(site) });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/save") {
      const body = await readBody(req);
      const site = body.site;
      const validation = validate(site);
      if (!validation.valid) {
        sendJson(res, 400, { validation });
        return;
      }
      writeSite(site);
      const sync = await runNodeScript(path.join(repoRoot, "scripts/sync-site-config.js"));
      sendJson(res, 200, { site, validation, sync });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/sync") {
      const sync = await runNodeScript(path.join(repoRoot, "scripts/sync-site-config.js"));
      sendJson(res, 200, { sync });
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/template-packs") {
      sendJson(res, 200, readTemplatePacks());
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/template-pack-proposal") {
      const body = await readBody(req);
      const site = body.site || readSite();
      const result = await callDeepSeekTemplatePack(body.message || "", site, body.references || {});
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/template-packs/save-proposal") {
      const body = await readBody(req);
      const current = readTemplatePacks();
      const templatePacks = applyTemplatePackProposal(current.templatePacks, body.proposal);
      const next = { version: 1, templatePacks };
      writeTemplatePacks(next);
      sendJson(res, 200, next);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/workflow/draft") {
      const body = await readBody(req);
      const site = body.site || readSite();
      const pack = body.templatePack;
      if (!pack || !pack.id) {
        sendJson(res, 400, { error: "templatePack is required" });
        return;
      }
      const steps = buildWorkflowSteps(pack);
      const draft = templatePackToDraft(pack, site);
      sendJson(res, 200, {
        steps,
        draft,
        progress: summarizeDraftProgress(draft, steps),
        assetChoices: buildAssetChoicesForPack(site, pack)
      });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/workflow/compile") {
      const body = await readBody(req);
      const site = body.site || readSite();
      const draft = body.draft;
      if (!draft || !draft.templatePackId) {
        sendJson(res, 400, { error: "draft is required" });
        return;
      }
      const draftValidation = validateDraftBeforeCompile(draft);
      if (!draftValidation.valid) {
        sendJson(res, 400, { draftValidation });
        return;
      }
      const nextSite = draftToSite(draft, site);
      const validation = validate(nextSite);
      if (!validation.valid) {
        sendJson(res, 400, { site: nextSite, validation });
        return;
      }
      writeSite(nextSite);
      const sync = await runNodeScript(path.join(repoRoot, "scripts/sync-site-config.js"));
      sendJson(res, 200, { site: nextSite, validation, sync });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/chat") {
      const body = await readBody(req);
      const site = body.site || readSite();
      const result = await callDeepSeek(body.message || "", site);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: "API route not found" });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(defaultPort, "127.0.0.1", () => {
  console.log(`Shancong generator running at http://127.0.0.1:${defaultPort}`);
});
