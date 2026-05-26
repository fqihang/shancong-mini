const state = {
  site: null,
  templatePacks: [],
  selectedPack: null,
  draft: null,
  steps: [],
  progress: [],
  assetChoices: { hero: [], sections: {} },
  assetScan: null,
  assetLibrary: [],
  flowState: null,
  currentStepId: "basic",
  lastProposal: null
};

const els = {
  reloadBtn: document.querySelector("#reloadBtn"),
  scanAssetsBtn: document.querySelector("#scanAssetsBtn"),
  importAssetsBtn: document.querySelector("#importAssetsBtn"),
  saveAssetMetadataBtn: document.querySelector("#saveAssetMetadataBtn"),
  assetScanSummary: document.querySelector("#assetScanSummary"),
  assetScanList: document.querySelector("#assetScanList"),
  assetLibraryList: document.querySelector("#assetLibraryList"),
  flowAssetCount: document.querySelector("#flowAssetCount"),
  flowTemplateCount: document.querySelector("#flowTemplateCount"),
  flowStepCount: document.querySelector("#flowStepCount"),
  flowOutputText: document.querySelector("#flowOutputText"),
  validateBtn: document.querySelector("#validateBtn"),
  compileBtn: document.querySelector("#compileBtn"),
  validationBadge: document.querySelector("#validationBadge"),
  keyBadge: document.querySelector("#keyBadge"),
  statusBox: document.querySelector("#statusBox"),
  templatePackSelect: document.querySelector("#templatePackSelect"),
  workflowSteps: document.querySelector("#workflowSteps"),
  workflowForm: document.querySelector("#workflowForm"),
  prevStepBtn: document.querySelector("#prevStepBtn"),
  nextStepBtn: document.querySelector("#nextStepBtn"),
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
    const draftErrors = payload.draftValidation && payload.draftValidation.errors
      ? payload.draftValidation.errors.join("\n")
      : "";
    throw new Error(payload.error || draftErrors || formatValidation(payload.validation) || "Request failed");
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

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function missing(value, message) {
  return textValue(value) ? [] : [message];
}

function sectionIssues(section) {
  if (section.enabled === false) {
    return [];
  }
  const label = textValue(section.id) || "未命名区块";
  const issues = [];
  for (const [slotId, assetId] of Object.entries(section.slots || {})) {
    if (!textValue(assetId)) {
      issues.push(`${label}: 缺少图片 ${slotId}`);
    }
  }
  if (!textValue(section.copy && section.copy.title)) {
    issues.push(`${label}: 缺少标题`);
  }
  if (!textValue(section.copy && section.copy.text)) {
    issues.push(`${label}: 缺少短文案`);
  }
  return issues;
}

function validateDraftBeforeCompileClient(draft) {
  if (!draft) {
    return { valid: false, errors: ["请先选择模版生成 draft"] };
  }
  const contact = draft.contact || {};
  const errors = [
    ...missing(draft.site && draft.site.brandName, "缺少民宿名称"),
    ...missing(draft.site && draft.site.locationText, "缺少位置"),
    ...missing(draft.share && draft.share.title, "缺少分享标题"),
    ...missing(draft.hero && draft.hero.image, "缺少首屏图片"),
    ...missing(draft.hero && draft.hero.title, "缺少首屏标题"),
    ...missing(draft.hero && draft.hero.text, "缺少首屏短文案")
  ];

  const sections = draft.sections || [];
  if (!sections.length) {
    errors.push("至少需要一个首页图片区块");
  } else {
    errors.push(...sections.flatMap(sectionIssues));
  }

  if (!textValue(contact.phone) && !textValue(contact.wechatId)) {
    errors.push("电话或微信至少填写一个");
  }

  return { valid: errors.length === 0, errors };
}

function stepIssues(stepId) {
  if (!state.draft) {
    return ["请先选择模版生成 draft"];
  }
  if (stepId === "basic") {
    return [
      ...missing(state.draft.site && state.draft.site.brandName, "缺少民宿名称"),
      ...missing(state.draft.site && state.draft.site.locationText, "缺少位置"),
      ...missing(state.draft.share && state.draft.share.title, "缺少分享标题")
    ];
  }
  if (stepId === "hero") {
    return [
      ...missing(state.draft.hero && state.draft.hero.image, "缺少首屏图片"),
      ...missing(state.draft.hero && state.draft.hero.title, "缺少首屏标题"),
      ...missing(state.draft.hero && state.draft.hero.text, "缺少首屏短文案")
    ];
  }
  if (stepId === "sections") {
    const sections = state.draft.sections || [];
    return sections.length ? sections.flatMap(sectionIssues) : ["至少需要一个首页图片区块"];
  }
  if (stepId === "contact") {
    const contact = state.draft.contact || {};
    return textValue(contact.phone) || textValue(contact.wechatId)
      ? []
      : ["电话或微信至少填写一个"];
  }
  if (stepId === "preview") {
    return validateDraftBeforeCompileClient(state.draft).errors;
  }
  return [];
}

function refreshProgress() {
  state.progress = (state.steps || []).map((step) => {
    const issues = stepIssues(step.id);
    return {
      id: step.id,
      title: step.title,
      complete: issues.length === 0,
      issueCount: issues.length,
      issues
    };
  });
}

function progressById() {
  return Object.fromEntries((state.progress || []).map((step) => [step.id, step]));
}

function refreshFlowState() {
  const home = state.site && state.site.pages && state.site.pages.home ? state.site.pages.home : {};
  state.flowState = {
    source: {
      assetCount: state.site && state.site.assets ? state.site.assets.length : 0,
      templatePackCount: state.templatePacks.length,
      sectionCount: (home.sections || []).length
    },
    workflow: {
      stepCount: state.steps.length
    },
    output: {
      artifacts: ["content/site.json", "utils/content-data.js"]
    }
  };
}

function renderFlowOverview() {
  if (!state.flowState) {
    return;
  }
  const source = state.flowState.source || {};
  const workflow = state.flowState.workflow || {};
  const output = state.flowState.output || {};
  els.flowAssetCount.textContent = `素材 ${source.assetCount || 0}`;
  els.flowTemplateCount.textContent = `模版 ${source.templatePackCount || 0}`;
  els.flowStepCount.textContent = `步骤 ${workflow.stepCount || 0}`;
  els.flowOutputText.textContent = (output.artifacts || []).join(" + ");
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
  refreshProgress();
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

function renderAssetScan() {
  const scan = state.assetScan;
  if (!scan) {
    els.assetScanSummary.textContent = "等待扫描。";
    els.assetScanList.innerHTML = "";
    els.importAssetsBtn.disabled = true;
    return;
  }
  els.assetScanSummary.textContent = [
    `目录：${scan.directories.join(" / ")}`,
    `本地照片 ${scan.files.length} 张`,
    `新照片 ${scan.newAssets.length} 张`,
    `已配置 ${scan.existingAssets.length} 张`
  ].join(" · ");
  els.importAssetsBtn.disabled = scan.newAssets.length === 0;
  const newItems = scan.newAssets.map((asset) => `
    <article class="scan-card new">
      <img src="${escapeHtml(asset.src)}" alt="" />
      <div>
        <strong>${escapeHtml(asset.id)}</strong>
        <span>${escapeHtml(asset.orientation)} · ${escapeHtml(asset.alt)}</span>
        <small>${escapeHtml((asset.tags || []).join(" · "))}</small>
      </div>
    </article>
  `).join("");
  const existingItems = scan.existingAssets.map((asset) => `
    <article class="scan-card existing">
      <img src="${escapeHtml(asset.src && asset.src.startsWith("/") ? asset.src : asset.localTarget || asset.src)}" alt="" />
      <div>
        <strong>${escapeHtml(asset.id)}</strong>
        <span>已配置 · ${escapeHtml(asset.orientation)}</span>
        <small>${escapeHtml(asset.alt || "")}</small>
      </div>
    </article>
  `).join("");
  els.assetScanList.innerHTML = `
    <div class="scan-group">
      <h3>新照片</h3>
      ${newItems || "<p>没有发现新照片。</p>"}
    </div>
    <div class="scan-group">
      <h3>已配置</h3>
      ${existingItems || "<p>还没有本地照片被配置。</p>"}
    </div>
  `;
}

function assetThumbSrc(asset) {
  return asset.src || asset.localTarget || "";
}

function renderAssetLibrary() {
  if (!state.assetLibrary.length) {
    els.assetLibraryList.innerHTML = "<p class=\"empty-library\">暂无素材。先扫描并加入素材库。</p>";
    return;
  }
  els.assetLibraryList.innerHTML = state.assetLibrary.map((asset) => `
    <article class="library-card" data-asset-id="${escapeHtml(asset.id)}">
      <img src="${escapeHtml(assetThumbSrc(asset))}" alt="" />
      <div class="library-card-body">
        <div class="library-card-meta">
          <strong>${escapeHtml(asset.id)}</strong>
          <span>${escapeHtml(asset.orientation)} · ${escapeHtml(asset.sourceType)} · ${asset.used ? "已使用" : "未使用"}</span>
        </div>
        <label>
          <span>Alt</span>
          <input data-asset-alt="${escapeHtml(asset.id)}" type="text" value="${escapeHtml(asset.alt || "")}" />
        </label>
        <label>
          <span>Tags（逗号分隔）</span>
          <input data-asset-tags="${escapeHtml(asset.id)}" type="text" value="${escapeHtml((asset.tags || []).join("，"))}" />
        </label>
        <small>${escapeHtml((asset.usage || []).join(" / ") || "暂未被页面使用")}</small>
      </div>
    </article>
  `).join("");
}

function renderSteps() {
  const progress = progressById();
  els.workflowSteps.innerHTML = state.steps.map((step) => `
    <button
      type="button"
      class="step-chip ${step.id === state.currentStepId ? "active" : ""} ${progress[step.id] && progress[step.id].complete ? "complete" : "incomplete"}"
      data-step="${escapeHtml(step.id)}"
    >
      <span>${escapeHtml(step.title)}</span>
      <small>${progress[step.id] && progress[step.id].complete ? "OK" : `${progress[step.id] ? progress[step.id].issueCount : 0} 项`}</small>
    </button>
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

function assetSelect(id, label, selectedId, orientation, choices) {
  const normalizedChoices = (choices && choices.length ? choices : assetsByOrientation(orientation).map((asset) => ({
    id: asset.id,
    src: asset.src,
    alt: asset.alt,
    orientation: asset.orientation,
    tags: asset.tags || [],
    recommended: false
  })));
  const options = normalizedChoices.map((asset) => `
    <option value="${escapeHtml(asset.id)}" ${asset.id === selectedId ? "selected" : ""}>
      ${escapeHtml(asset.id)} · ${escapeHtml(asset.alt || asset.orientation)}
    </option>
  `).join("");
  const cards = normalizedChoices.map((asset) => `
    <button
      type="button"
      class="asset-card ${asset.id === selectedId ? "selected" : ""} ${asset.recommended ? "recommended" : ""}"
      data-select-target="${escapeHtml(id)}"
      data-asset-id="${escapeHtml(asset.id)}"
    >
      <img src="${escapeHtml(asset.src)}" alt="" />
      <span>
        <strong>${escapeHtml(asset.alt || asset.id)}</strong>
        <small>${escapeHtml([asset.orientation, ...(asset.tags || [])].filter(Boolean).join(" · "))}</small>
      </span>
      ${asset.recommended ? "<em>推荐</em>" : ""}
    </button>
  `).join("");
  return `
    <label class="asset-select">
      <span>${escapeHtml(label)}</span>
      <select id="${escapeHtml(id)}">${options}</select>
    </label>
    <div class="asset-picker">${cards}</div>
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
      ${assetSelect("draftHeroImage", "首屏图片", state.draft.hero.image, "landscape", state.assetChoices.hero)}
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
      const choices = state.assetChoices.sections && state.assetChoices.sections[section.id]
        ? state.assetChoices.sections[section.id][slotId]
        : null;
      return assetSelect(`section_${sectionIndex}_slot_${slotId}`, `${section.id} / ${slotId}`, assetId, requirement.orientation, choices);
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

function renderWorkflowNav() {
  const index = state.steps.findIndex((step) => step.id === state.currentStepId);
  const current = progressById()[state.currentStepId];
  els.prevStepBtn.disabled = index <= 0;
  els.nextStepBtn.disabled = index < 0 || index >= state.steps.length - 1;
  els.nextStepBtn.textContent = index >= state.steps.length - 2 ? "去预览" : "下一步";
  if (current && current.issues.length) {
    els.statusBox.textContent = `当前步骤待补充：\n${current.issues.map((issue) => `- ${issue}`).join("\n")}`;
  } else if (current) {
    els.statusBox.textContent = "当前步骤已完整，可以继续。";
  }
}

function renderWorkflow() {
  refreshProgress();
  renderTemplateSelect();
  renderSteps();
  renderWorkflowForm();
  renderWorkflowNav();
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
  refreshProgress();
  renderSteps();
  renderWorkflowNav();
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
  state.progress = payload.progress || [];
  state.assetChoices = payload.assetChoices || { hero: [], sections: {} };
  state.currentStepId = state.steps[0].id;
  refreshFlowState();
  renderFlowOverview();
  setDraft(payload.draft);
}

async function loadSite() {
  const payload = await requestJson("/api/site");
  state.site = payload.site;
  state.templatePacks = payload.templatePacks || [];
  state.flowState = payload.flowState;
  setKeyBadge(payload.deepSeekConfigured);
  setStatus(formatValidation(payload.validation), payload.validation.valid ? "ok" : "bad");
  renderFlowOverview();
  await loadAssetLibrary();
  await chooseTemplatePack(state.templatePacks[0] && state.templatePacks[0].id);
}

async function loadAssetLibrary() {
  const payload = await requestJson("/api/assets/library");
  state.assetLibrary = payload.assets || [];
  renderAssetLibrary();
}

async function scanAssets() {
  const payload = await requestJson("/api/assets/scan");
  state.assetScan = payload.scan;
  renderAssetScan();
}

async function importAssets() {
  const payload = await requestJson("/api/assets/import", { method: "POST" });
  state.site = payload.site;
  state.assetScan = payload.scan;
  state.assetLibrary = payload.assets || state.assetLibrary;
  refreshFlowState();
  renderFlowOverview();
  renderAssetScan();
  renderAssetLibrary();
  setStatus(`已加入 ${payload.importedCount} 张新照片。\n${payload.sync.stdout}`, "ok");
  await chooseTemplatePack(state.selectedPack ? state.selectedPack.id : state.templatePacks[0] && state.templatePacks[0].id);
}

function collectAssetMetadataUpdates() {
  return state.assetLibrary.map((asset) => {
    const altInput = document.querySelector(`[data-asset-alt="${CSS.escape(asset.id)}"]`);
    const tagsInput = document.querySelector(`[data-asset-tags="${CSS.escape(asset.id)}"]`);
    return {
      id: asset.id,
      alt: altInput ? altInput.value : asset.alt || "",
      tags: tagsInput ? tagsInput.value : (asset.tags || []).join("，")
    };
  });
}

async function saveAssetMetadata() {
  const payload = await requestJson("/api/assets/metadata", {
    method: "POST",
    body: JSON.stringify({ updates: collectAssetMetadataUpdates() })
  });
  state.site = payload.site;
  state.assetLibrary = payload.assets || [];
  refreshFlowState();
  renderFlowOverview();
  renderAssetLibrary();
  setStatus(`素材信息已保存。\n${payload.sync.stdout}`, "ok");
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
  updateDraftFromForm();
  const draftValidation = validateDraftBeforeCompileClient(state.draft);
  if (!draftValidation.valid) {
    setStatus(`编译前需要补充：\n${draftValidation.errors.map((error) => `- ${error}`).join("\n")}`, "bad");
    return;
  }
  const payload = await requestJson("/api/workflow/compile", {
    method: "POST",
    body: JSON.stringify({ site: state.site, draft: state.draft })
  });
  state.site = payload.site;
  refreshFlowState();
  renderFlowOverview();
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

function moveStep(delta) {
  updateDraftFromForm();
  const index = state.steps.findIndex((step) => step.id === state.currentStepId);
  const next = state.steps[index + delta];
  if (!next) return;
  state.currentStepId = next.id;
  renderWorkflow();
}

els.workflowSteps.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-step]");
  if (!button) return;
  updateDraftFromForm();
  state.currentStepId = button.dataset.step;
  renderWorkflow();
});

els.workflowForm.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-select-target]");
  if (!button) return;
  const select = document.querySelector(`#${CSS.escape(button.dataset.selectTarget)}`);
  if (!select) return;
  select.value = button.dataset.assetId;
  updateDraftFromForm();
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
els.scanAssetsBtn.addEventListener("click", () => scanAssets().catch((error) => setStatus(error.message, "bad")));
els.importAssetsBtn.addEventListener("click", () => importAssets().catch((error) => setStatus(error.message, "bad")));
els.saveAssetMetadataBtn.addEventListener("click", () => saveAssetMetadata().catch((error) => setStatus(error.message, "bad")));
els.validateBtn.addEventListener("click", () => validateCurrentDraft().catch((error) => setStatus(error.message, "bad")));
els.compileBtn.addEventListener("click", () => compileDraft().catch((error) => setStatus(error.message, "bad")));
els.prevStepBtn.addEventListener("click", () => moveStep(-1));
els.nextStepBtn.addEventListener("click", () => moveStep(1));
els.sendDemoBtn.addEventListener("click", sendDemoChat);
els.saveProposalBtn.addEventListener("click", () => saveProposal().catch((error) => setStatus(error.message, "bad")));
els.discardProposalBtn.addEventListener("click", discardProposal);

loadSite().catch((error) => setStatus(error.message, "bad"));
