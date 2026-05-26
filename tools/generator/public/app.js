const state = {
  site: null,
  lastProposal: null,
  deepSeekConfigured: false
};

const els = {
  reloadBtn: document.querySelector("#reloadBtn"),
  validateBtn: document.querySelector("#validateBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  validationBadge: document.querySelector("#validationBadge"),
  keyBadge: document.querySelector("#keyBadge"),
  statusBox: document.querySelector("#statusBox"),
  jsonEditor: document.querySelector("#jsonEditor"),
  previewRoot: document.querySelector("#previewRoot"),
  brandNameInput: document.querySelector("#brandNameInput"),
  locationInput: document.querySelector("#locationInput"),
  shareTitleInput: document.querySelector("#shareTitleInput"),
  phoneInput: document.querySelector("#phoneInput"),
  wechatInput: document.querySelector("#wechatInput"),
  addressInput: document.querySelector("#addressInput"),
  chatInput: document.querySelector("#chatInput"),
  sendChatBtn: document.querySelector("#sendChatBtn"),
  proposalBox: document.querySelector("#proposalBox"),
  applyProposalBtn: document.querySelector("#applyProposalBtn"),
  discardProposalBtn: document.querySelector("#discardProposalBtn")
};

function setStatus(message, type = "neutral") {
  els.statusBox.textContent = message;
  els.validationBadge.textContent = type === "ok" ? "通过" : type === "bad" ? "有错误" : "未校验";
  els.validationBadge.className = `badge ${type}`;
}

function setKeyBadge(configured) {
  state.deepSeekConfigured = configured;
  els.keyBadge.textContent = configured ? "DeepSeek 已配置" : "DeepSeek 未配置";
  els.keyBadge.className = configured ? "badge ok" : "badge bad";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, Object.assign({
    headers: { "Content-Type": "application/json" }
  }, options));
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || formatValidation(payload.validation) || "Request failed");
  }
  return payload;
}

function parseEditor() {
  return JSON.parse(els.jsonEditor.value);
}

function writeEditor(site) {
  state.site = site;
  els.jsonEditor.value = JSON.stringify(site, null, 2);
  fillQuickFields(site);
  renderPreview(site);
}

function fillQuickFields(site) {
  els.brandNameInput.value = site.site.brandName || "";
  els.locationInput.value = site.site.locationText || "";
  els.shareTitleInput.value = site.share.title || "";
  els.phoneInput.value = site.pages.contact.phone || "";
  els.wechatInput.value = site.pages.contact.wechatId || "";
  els.addressInput.value = site.site.address || "";
}

function applyQuickFields() {
  const site = parseEditor();
  site.site.brandName = els.brandNameInput.value;
  site.site.locationText = els.locationInput.value;
  site.site.address = els.addressInput.value;
  site.share.title = els.shareTitleInput.value;
  site.pages.contact.phone = els.phoneInput.value;
  site.pages.contact.wechatId = els.wechatInput.value;
  writeEditor(site);
}

function formatValidation(validation) {
  if (!validation) return "";
  const lines = [];
  if (validation.errors && validation.errors.length) {
    lines.push("Errors:");
    lines.push(...validation.errors.map((item) => `- ${item}`));
  }
  if (validation.warnings && validation.warnings.length) {
    lines.push("Warnings:");
    lines.push(...validation.warnings.map((item) => `- ${item}`));
  }
  return lines.join("\n") || "site config ok";
}

function assetMap(site) {
  return Object.fromEntries((site.assets || []).map((asset) => [asset.id, asset]));
}

function assetSrc(site, id) {
  const asset = assetMap(site)[id];
  return asset ? asset.src : "";
}

function sectionImage(site, section, slot) {
  return assetSrc(site, section.slots && section.slots[slot]);
}

function renderSection(site, section) {
  const copy = section.copy || {};
  const copyHtml = `
    <div class="section-copy">
      <small>${escapeHtml(copy.eyebrow)}</small>
      <h4>${escapeHtml(copy.title)}</h4>
      <p>${escapeHtml(copy.text)}</p>
    </div>
  `;

  if (section.template === "feature_landscape") {
    return `
      <article class="preview-section">
        <img class="feature-img" src="${escapeHtml(sectionImage(site, section, "cover"))}" alt="" />
        ${copyHtml}
      </article>
    `;
  }

  if (section.template === "portrait_pair") {
    return `
      <article class="preview-section">
        ${copyHtml}
        <div class="portrait-row">
          <img src="${escapeHtml(sectionImage(site, section, "left"))}" alt="" />
          <img src="${escapeHtml(sectionImage(site, section, "right"))}" alt="" />
        </div>
      </article>
    `;
  }

  if (section.template === "mixed_mosaic") {
    return `
      <article class="preview-section">
        <img class="mixed-wide" src="${escapeHtml(sectionImage(site, section, "wide"))}" alt="" />
        <div class="mixed-row">
          ${copyHtml}
          <img class="mixed-tall" src="${escapeHtml(sectionImage(site, section, "tall"))}" alt="" />
        </div>
      </article>
    `;
  }

  if (section.template === "single_portrait") {
    return `
      <article class="preview-section">
        <img class="feature-img" src="${escapeHtml(sectionImage(site, section, "cover"))}" alt="" />
        ${copyHtml}
      </article>
    `;
  }

  return "";
}

function renderPreview(site) {
  const hero = site.pages.home.hero;
  const sections = (site.pages.home.sections || []).filter((section) => section.enabled !== false);
  const assets = site.assets || [];
  els.previewRoot.innerHTML = `
    <div class="phone-frame">
      <div class="preview-hero" style="background-image: url('${escapeHtml(assetSrc(site, hero.image))}')">
        <small>${escapeHtml(hero.kicker)}</small>
        <h3>${escapeHtml(hero.title)}</h3>
        <p>${escapeHtml(hero.text)}</p>
      </div>
      ${sections.map((section) => renderSection(site, section)).join("")}
      <article class="preview-section">
        <div class="section-copy">
          <small>联系</small>
          <h4>${escapeHtml(site.site.brandName)}</h4>
          <p>${escapeHtml(site.pages.contact.phone)} · ${escapeHtml(site.pages.contact.wechatId)}</p>
        </div>
      </article>
    </div>
    <div class="asset-list">
      ${assets.map((asset) => `
        <div class="asset-item">
          <img src="${escapeHtml(asset.src)}" alt="" />
          <div class="asset-meta">
            <strong>${escapeHtml(asset.id)}</strong>
            <span>${escapeHtml(asset.orientation)} · ${escapeHtml((asset.tags || []).join(" / "))}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function loadSite() {
  const payload = await requestJson("/api/site");
  writeEditor(payload.site);
  setKeyBadge(payload.deepSeekConfigured);
  setStatus(formatValidation(payload.validation), payload.validation.valid ? "ok" : "bad");
}

async function validateEditor() {
  const site = parseEditor();
  const payload = await requestJson("/api/validate", {
    method: "POST",
    body: JSON.stringify({ site })
  });
  setStatus(formatValidation(payload.validation), payload.validation.valid ? "ok" : "bad");
  renderPreview(site);
  return payload.validation;
}

async function saveEditor() {
  const site = parseEditor();
  const payload = await requestJson("/api/save", {
    method: "POST",
    body: JSON.stringify({ site })
  });
  writeEditor(payload.site);
  setStatus(`${formatValidation(payload.validation)}\n${payload.sync.stdout}`, "ok");
}

function upsertById(existing, incoming) {
  if (!Array.isArray(incoming)) return existing;
  const map = new Map((existing || []).map((item) => [item.id, item]));
  for (const item of incoming) {
    if (item && item.id) {
      map.set(item.id, Object.assign({}, map.get(item.id), item));
    }
  }
  return Array.from(map.values());
}

function mergePlainObject(base, changes) {
  if (!changes || Array.isArray(changes) || typeof changes !== "object") return base;
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
  if (!changes || typeof changes !== "object") return site;
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

async function sendChat() {
  const message = els.chatInput.value.trim();
  if (!message) {
    setStatus("请输入生成要求。", "bad");
    return;
  }
  const site = parseEditor();
  els.sendChatBtn.disabled = true;
  els.proposalBox.classList.remove("empty");
  els.proposalBox.textContent = "正在调用 DeepSeek...";
  try {
    const payload = await requestJson("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, site })
    });
    state.lastProposal = payload.proposal;
    els.proposalBox.textContent = JSON.stringify({
      proposal: payload.proposal,
      previewValidation: payload.previewValidation
    }, null, 2);
    els.applyProposalBtn.disabled = false;
    els.discardProposalBtn.disabled = false;
    setStatus(formatValidation(payload.previewValidation), payload.previewValidation.valid ? "ok" : "bad");
  } catch (error) {
    state.lastProposal = null;
    els.proposalBox.textContent = error.message;
    els.applyProposalBtn.disabled = true;
    els.discardProposalBtn.disabled = true;
    setStatus(error.message, "bad");
  } finally {
    els.sendChatBtn.disabled = false;
  }
}

async function applyLastProposal() {
  if (!state.lastProposal) return;
  const merged = applyProposal(parseEditor(), state.lastProposal);
  writeEditor(merged);
  await validateEditor();
}

function discardProposal() {
  state.lastProposal = null;
  els.proposalBox.className = "proposal-box empty";
  els.proposalBox.textContent = "已丢弃 proposal。";
  els.applyProposalBtn.disabled = true;
  els.discardProposalBtn.disabled = true;
}

for (const input of [
  els.brandNameInput,
  els.locationInput,
  els.shareTitleInput,
  els.phoneInput,
  els.wechatInput,
  els.addressInput
]) {
  input.addEventListener("change", () => {
    try {
      applyQuickFields();
    } catch (error) {
      setStatus(error.message, "bad");
    }
  });
}

els.jsonEditor.addEventListener("input", () => {
  try {
    const site = parseEditor();
    state.site = site;
    fillQuickFields(site);
    renderPreview(site);
  } catch {
    els.validationBadge.textContent = "JSON 错误";
    els.validationBadge.className = "badge bad";
  }
});

els.reloadBtn.addEventListener("click", () => loadSite().catch((error) => setStatus(error.message, "bad")));
els.validateBtn.addEventListener("click", () => validateEditor().catch((error) => setStatus(error.message, "bad")));
els.saveBtn.addEventListener("click", () => saveEditor().catch((error) => setStatus(error.message, "bad")));
els.sendChatBtn.addEventListener("click", sendChat);
els.applyProposalBtn.addEventListener("click", () => applyLastProposal().catch((error) => setStatus(error.message, "bad")));
els.discardProposalBtn.addEventListener("click", discardProposal);

loadSite().catch((error) => setStatus(error.message, "bad"));
