const state = {
  site: null,
  templatePacks: [],
  selectedPack: null,
  draft: null,
  steps: [],
  currentStepId: "basic",
  lastProposal: null
};

const els = {
  reloadBtn: document.querySelector("#reloadBtn"),
  validateBtn: document.querySelector("#validateBtn"),
  compileBtn: document.querySelector("#compileBtn"),
  validationBadge: document.querySelector("#validationBadge"),
  keyBadge: document.querySelector("#keyBadge"),
  statusBox: document.querySelector("#statusBox"),
  templatePackSelect: document.querySelector("#templatePackSelect"),
  workflowSteps: document.querySelector("#workflowSteps"),
  workflowForm: document.querySelector("#workflowForm"),
  draftEditor: document.querySelector("#draftEditor"),
  previewRoot: document.querySelector("#previewRoot"),
  referenceUrlInput: document.querySelector("#referenceUrlInput"),
  referenceDocInput: document.querySelector("#referenceDocInput"),
  chatInput: document.querySelector("#chatInput"),
  sendDemoBtn: document.querySelector("#sendDemoBtn"),
  proposalBox: document.querySelector("#proposalBox"),
  saveProposalBtn: document.querySelector("#saveProposalBtn"),
  discardProposalBtn: document.querySelector("#discardProposalBtn")
};

function setStatus(message, type = "neutral") {
  els.statusBox.textContent = message;
  els.validationBadge.textContent = type === "ok" ? "通过" : type === "bad" ? "有错误" : "未校验";
  els.validationBadge.className = `badge ${type}`;
}

function setKeyBadge(configured) {
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

function assetsByOrientation(orientation) {
  return (state.site.assets || []).filter((asset) => !orientation || asset.orientation === orientation);
}

function assetMap(site) {
  return Object.fromEntries((site.assets || []).map((asset) => [asset.id, asset]));
}

function assetSrc(site, id) {
  const asset = assetMap(site)[id];
  return asset ? asset.src : "";
}

function templateById(id) {
  return (state.site.templates || []).find((template) => template.id === id);
}

function slotRequirements(section) {
  const template = templateById(section.template);
  return Object.fromEntries((template && template.slots || []).map((slot) => [slot.id, slot]));
}

function selectedDraftSiteShape() {
  if (!state.draft) {
    return state.site;
  }
  const next = JSON.parse(JSON.stringify(state.site));
  next.site = Object.assign({}, next.site, state.draft.site);
  next.share = Object.assign({}, next.share, state.draft.share);
  next.pages.home.hero = Object.assign({}, state.draft.hero);
  next.pages.home.sections = JSON.parse(JSON.stringify(state.draft.sections || []));
  next.pages.rooms = JSON.parse(JSON.stringify(state.draft.rooms || next.pages.rooms || []));
  next.pages.contact = Object.assign({}, next.pages.contact, state.draft.contact);
  next.links = JSON.parse(JSON.stringify(state.draft.links || next.links || []));
  return next;
}

function syncDraftEditor() {
  els.draftEditor.value = state.draft ? JSON.stringify(state.draft, null, 2) : "";
}

function setDraft(draft) {
  state.draft = draft;
  syncDraftEditor();
  renderWorkflow();
  renderPreview(selectedDraftSiteShape());
}

function renderTemplateSelect() {
  els.templatePackSelect.innerHTML = state.templatePacks.map((pack) => `
    <option value="${escapeHtml(pack.id)}">${escapeHtml(pack.name)} · ${escapeHtml(pack.summary)}</option>
  `).join("");
  if (state.selectedPack) {
    els.templatePackSelect.value = state.selectedPack.id;
  }
}

function renderSteps() {
  els.workflowSteps.innerHTML = state.steps.map((step) => `
    <button
      type="button"
      class="step-chip ${step.id === state.currentStepId ? "active" : ""}"
      data-step="${escapeHtml(step.id)}"
    >${escapeHtml(step.title)}</button>
  `).join("");
}

function inputRow(id, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input id="${escapeHtml(id)}" type="text" value="${escapeHtml(value)}" />
    </label>
  `;
}

function textareaRow(id, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <textarea id="${escapeHtml(id)}" class="small-textarea">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function assetSelect(id, label, selectedId, orientation) {
  const options = assetsByOrientation(orientation).map((asset) => `
    <option value="${escapeHtml(asset.id)}" ${asset.id === selectedId ? "selected" : ""}>
      ${escapeHtml(asset.id)} · ${escapeHtml(asset.alt || asset.orientation)}
    </option>
  `).join("");
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select id="${escapeHtml(id)}">${options}</select>
    </label>
  `;
}

function renderBasicStep() {
  return `
    <div class="form-grid">
      ${inputRow("draftBrand", "民宿名称", state.draft.site.brandName)}
      ${inputRow("draftLocation", "位置", state.draft.site.locationText)}
      ${inputRow("draftAddress", "地址", state.draft.site.address)}
      ${inputRow("draftShareTitle", "分享标题", state.draft.share.title)}
    </div>
  `;
}

function renderHeroStep() {
  return `
    <div class="form-grid">
      ${assetSelect("draftHeroImage", "首屏图片", state.draft.hero.image, "landscape")}
      ${inputRow("draftHeroKicker", "身份小字", state.draft.hero.kicker)}
      ${inputRow("draftHeroTitle", "主标题", state.draft.hero.title)}
      ${inputRow("draftHeroPoints", "卖点标签（逗号分隔）", (state.draft.hero.points || []).join("，"))}
    </div>
    ${textareaRow("draftHeroText", "首屏短文案", state.draft.hero.text)}
  `;
}

function renderSectionsStep() {
  return (state.draft.sections || []).map((section, sectionIndex) => {
    const slots = slotRequirements(section);
    const slotControls = Object.entries(section.slots || {}).map(([slotId, assetId]) => {
      const requirement = slots[slotId] || {};
      return assetSelect(`section_${sectionIndex}_slot_${slotId}`, `${section.id} / ${slotId}`, assetId, requirement.orientation);
    }).join("");
    return `
      <div class="section-editor">
        <div class="section-editor-title">${escapeHtml(section.id)} · ${escapeHtml(section.template)}</div>
        <div class="form-grid">${slotControls}</div>
        <div class="form-grid">
          ${inputRow(`section_${sectionIndex}_eyebrow`, "小标题", section.copy.eyebrow)}
          ${inputRow(`section_${sectionIndex}_title`, "标题", section.copy.title)}
        </div>
        ${textareaRow(`section_${sectionIndex}_text`, "短文案", section.copy.text)}
      </div>
    `;
  }).join("");
}

function renderContactStep() {
  const firstCopyLink = (state.draft.links || []).find((link) => link.type === "copy") || {};
  return `
    <div class="form-grid">
      ${inputRow("draftPhone", "电话", state.draft.contact.phone)}
      ${inputRow("draftWechat", "微信号", state.draft.contact.wechatId)}
      ${inputRow("draftLinkTitle", "外部入口标题", firstCopyLink.title || "")}
      ${inputRow("draftLinkValue", "外部入口链接/文本", firstCopyLink.value || "")}
    </div>
    ${textareaRow("draftResponse", "联系说明", state.draft.contact.responseText)}
  `;
}

function renderPreviewStep() {
  return `
    <div class="compile-note">
      <strong>Preview OK 后生成编译产物</strong>
      <p>点击右上角按钮会把当前 draft 编译为 content/site.json，通过校验后同步 utils/content-data.js。</p>
    </div>
  `;
}

function renderWorkflowForm() {
  if (!state.draft) {
    els.workflowForm.innerHTML = "<div class=\"empty-state\">请选择模版。</div>";
    return;
  }
  if (state.currentStepId === "basic") els.workflowForm.innerHTML = renderBasicStep();
  if (state.currentStepId === "hero") els.workflowForm.innerHTML = renderHeroStep();
  if (state.currentStepId === "sections") els.workflowForm.innerHTML = renderSectionsStep();
  if (state.currentStepId === "contact") els.workflowForm.innerHTML = renderContactStep();
  if (state.currentStepId === "preview") els.workflowForm.innerHTML = renderPreviewStep();
}

function renderWorkflow() {
  renderTemplateSelect();
  renderSteps();
  renderWorkflowForm();
}

function updateDraftFromForm() {
  if (!state.draft) return;
  const $ = (id) => document.querySelector(`#${CSS.escape(id)}`);
  if (state.currentStepId === "basic") {
    state.draft.site.brandName = $("draftBrand").value;
    state.draft.site.locationText = $("draftLocation").value;
    state.draft.site.address = $("draftAddress").value;
    state.draft.share.title = $("draftShareTitle").value;
  }
  if (state.currentStepId === "hero") {
    state.draft.hero.image = $("draftHeroImage").value;
    state.draft.hero.kicker = $("draftHeroKicker").value;
    state.draft.hero.title = $("draftHeroTitle").value;
    state.draft.hero.text = $("draftHeroText").value;
    state.draft.hero.points = $("draftHeroPoints").value.split(/[，,]/).map((item) => item.trim()).filter(Boolean);
  }
  if (state.currentStepId === "sections") {
    for (const [sectionIndex, section] of (state.draft.sections || []).entries()) {
      for (const slotId of Object.keys(section.slots || {})) {
        section.slots[slotId] = $(`section_${sectionIndex}_slot_${slotId}`).value;
      }
      section.copy.eyebrow = $(`section_${sectionIndex}_eyebrow`).value;
      section.copy.title = $(`section_${sectionIndex}_title`).value;
      section.copy.text = $(`section_${sectionIndex}_text`).value;
    }
  }
  if (state.currentStepId === "contact") {
    state.draft.contact.phone = $("draftPhone").value;
    state.draft.contact.wechatId = $("draftWechat").value;
    state.draft.contact.responseText = $("draftResponse").value;
    const link = (state.draft.links || []).find((item) => item.type === "copy");
    if (link) {
      link.title = $("draftLinkTitle").value;
      link.value = $("draftLinkValue").value;
      link.enabled = Boolean(link.value);
    }
  }
  syncDraftEditor();
  renderPreview(selectedDraftSiteShape());
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
    return `<article class="preview-section"><img class="feature-img" src="${escapeHtml(assetSrc(site, section.slots.cover))}" alt="" />${copyHtml}</article>`;
  }
  if (section.template === "portrait_pair") {
    return `
      <article class="preview-section">
        ${copyHtml}
        <div class="portrait-row">
          <img src="${escapeHtml(assetSrc(site, section.slots.left))}" alt="" />
          <img src="${escapeHtml(assetSrc(site, section.slots.right))}" alt="" />
        </div>
      </article>
    `;
  }
  if (section.template === "mixed_mosaic") {
    return `
      <article class="preview-section">
        <img class="mixed-wide" src="${escapeHtml(assetSrc(site, section.slots.wide))}" alt="" />
        <div class="mixed-row">
          ${copyHtml}
          <img class="mixed-tall" src="${escapeHtml(assetSrc(site, section.slots.tall))}" alt="" />
        </div>
      </article>
    `;
  }
  if (section.template === "single_portrait") {
    return `<article class="preview-section"><img class="feature-img" src="${escapeHtml(assetSrc(site, section.slots.cover))}" alt="" />${copyHtml}</article>`;
  }
  return "";
}

function renderPreview(site) {
  const hero = site.pages.home.hero;
  const sections = (site.pages.home.sections || []).filter((section) => section.enabled !== false);
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
  `;
}

async function chooseTemplatePack(packId) {
  state.selectedPack = state.templatePacks.find((pack) => pack.id === packId) || state.templatePacks[0];
  if (!state.selectedPack) return;
  const payload = await requestJson("/api/workflow/draft", {
    method: "POST",
    body: JSON.stringify({ site: state.site, templatePack: state.selectedPack })
  });
  state.steps = payload.steps;
  state.currentStepId = state.steps[0].id;
  setDraft(payload.draft);
}

async function loadSite() {
  const payload = await requestJson("/api/site");
  state.site = payload.site;
  state.templatePacks = payload.templatePacks || [];
  setKeyBadge(payload.deepSeekConfigured);
  setStatus(formatValidation(payload.validation), payload.validation.valid ? "ok" : "bad");
  await chooseTemplatePack(state.templatePacks[0] && state.templatePacks[0].id);
}

async function validateCurrentDraft() {
  const payload = await requestJson("/api/validate", {
    method: "POST",
    body: JSON.stringify({ site: selectedDraftSiteShape() })
  });
  setStatus(formatValidation(payload.validation), payload.validation.valid ? "ok" : "bad");
}

async function compileDraft() {
  if (!state.draft) return;
  const payload = await requestJson("/api/workflow/compile", {
    method: "POST",
    body: JSON.stringify({ site: state.site, draft: state.draft })
  });
  state.site = payload.site;
  setStatus(`${formatValidation(payload.validation)}\n${payload.sync.stdout}`, "ok");
  renderPreview(payload.site);
}

async function sendDemoChat() {
  const message = els.chatInput.value.trim();
  if (!message) {
    setStatus("请输入 demo 生成要求。", "bad");
    return;
  }
  els.sendDemoBtn.disabled = true;
  els.proposalBox.classList.remove("empty");
  els.proposalBox.textContent = "正在分析参考材料并生成 demo...";
  try {
    const payload = await requestJson("/api/template-pack-proposal", {
      method: "POST",
      body: JSON.stringify({
        site: selectedDraftSiteShape(),
        message,
        references: {
          url: els.referenceUrlInput.value.trim(),
          document: els.referenceDocInput.value.trim()
        }
      })
    });
    state.lastProposal = payload.proposal;
    els.proposalBox.textContent = JSON.stringify(payload.proposal, null, 2);
    els.saveProposalBtn.disabled = false;
    els.discardProposalBtn.disabled = false;
  } catch (error) {
    state.lastProposal = null;
    els.proposalBox.textContent = error.message;
    els.saveProposalBtn.disabled = true;
    els.discardProposalBtn.disabled = true;
    setStatus(error.message, "bad");
  } finally {
    els.sendDemoBtn.disabled = false;
  }
}

async function saveProposal() {
  if (!state.lastProposal) return;
  const payload = await requestJson("/api/template-packs/save-proposal", {
    method: "POST",
    body: JSON.stringify({ proposal: state.lastProposal })
  });
  state.templatePacks = payload.templatePacks || [];
  renderTemplateSelect();
  const firstNewPack = state.lastProposal.templatePacks && state.lastProposal.templatePacks[0];
  await chooseTemplatePack(firstNewPack ? firstNewPack.id : state.templatePacks[0].id);
  setStatus("模版已保存，并已进入配置 workflow。", "ok");
}

function discardProposal() {
  state.lastProposal = null;
  els.proposalBox.className = "proposal-box empty";
  els.proposalBox.textContent = "已丢弃 proposal。";
  els.saveProposalBtn.disabled = true;
  els.discardProposalBtn.disabled = true;
}

els.workflowSteps.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-step]");
  if (!button) return;
  updateDraftFromForm();
  state.currentStepId = button.dataset.step;
  renderWorkflow();
});

els.workflowForm.addEventListener("change", () => updateDraftFromForm());
els.workflowForm.addEventListener("input", () => updateDraftFromForm());
els.templatePackSelect.addEventListener("change", () => chooseTemplatePack(els.templatePackSelect.value).catch((error) => setStatus(error.message, "bad")));
els.draftEditor.addEventListener("change", () => {
  try {
    state.draft = JSON.parse(els.draftEditor.value);
    renderWorkflow();
    renderPreview(selectedDraftSiteShape());
  } catch (error) {
    setStatus(error.message, "bad");
  }
});

els.reloadBtn.addEventListener("click", () => loadSite().catch((error) => setStatus(error.message, "bad")));
els.validateBtn.addEventListener("click", () => validateCurrentDraft().catch((error) => setStatus(error.message, "bad")));
els.compileBtn.addEventListener("click", () => compileDraft().catch((error) => setStatus(error.message, "bad")));
els.sendDemoBtn.addEventListener("click", sendDemoChat);
els.saveProposalBtn.addEventListener("click", () => saveProposal().catch((error) => setStatus(error.message, "bad")));
els.discardProposalBtn.addEventListener("click", discardProposal);

loadSite().catch((error) => setStatus(error.message, "bad"));
