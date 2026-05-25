# 山从静态展示获客小程序与 AI 内容生成器设计

## 背景

山从小程序的定位是一个完全无云服务器的展示获客页面，用于在微信朋友圈、微信群和私聊中传播。它不做订单、支付、留言数据库或线上后台。用户打开后应先感受到山从的审美和气质，再自然找到电话、微信、地址或外部平台入口继续咨询。

当前核心目标不是覆盖所有客群，而是用内容筛选用户：深山、安静、溪流、避暑、漂亮房间、咖啡等内容分别吸引不同动机的人。第一反应目标是“这家民宿很有调性，我想加微信问问”。

## 设计目标

- 小程序保持静态、轻量、可审美化传播。
- 店主日常维护素材、联系方式和跳转链接，不维护数据库或线上后台。
- 图片素材放在项目本地目录，更新后通过微信开发者工具重新上传版本。
- 首页采用安静画廊感：大图、少字、留白、低销售感。
- 数据结构成为生成器和小程序之间的契约，未来可由 AI 生成。
- 本地内容生成器提供 Chat 功能，通过 DeepSeek API 辅助生成 UI 模版、页面区块和文案。

## 非目标

- 不建设云服务器、数据库、登录体系或线上 CMS。
- 不在小程序运行时调用 AI API。
- 不把 DeepSeek API key 写入仓库、小程序包或生成后的内容 JSON。
- 不做实时线上内容更新；每次素材变更仍通过本地生成和小程序上传发布。
- 不让 AI 直接生成或覆盖 WXML/WXSS/JS 页面代码。

## 总体架构

系统分为三块：

1. **静态小程序**
   - 用户可见端。
   - 渲染首页、房间详情页和联系页。
   - 只读取构建后的静态配置和本地图片资源。
   - 不连接云服务，不保存用户输入。

2. **本地内容生成器**
   - 在店主电脑本地运行，可通过浏览器访问。
   - 提供结构化编辑、素材管理、页面预览、校验和生成能力。
   - 输出单一内容文件 `content/site.json`，再同步为小程序运行时配置。

3. **AI Chat 助理**
   - 位于本地内容生成器内。
   - 通过本地 Node 适配层调用 DeepSeek API。
   - 只生成受约束的 JSON proposal，经用户确认和校验后才写入内容文件。

数据流：

```text
本地图片与输入
  -> 本地内容生成器
  -> UI Template Contract / content/site.json
  -> 同步脚本生成小程序运行时配置
  -> 微信开发者工具上传
  -> 用户看到静态小程序
```

## UI Template Contract

生成器和小程序都围绕同一套 UI Template Contract 工作。生成器用它引导内容生产，小程序用它渲染真实页面。

Contract 包含三类核心对象：

### Template Definition

定义一个 UI 模版的能力，而不是具体内容。

字段草案：

```json
{
  "id": "feature_landscape",
  "name": "横图沉浸大卡",
  "summary": "一张横屏大图配底部文字",
  "slots": [
    { "id": "cover", "type": "image", "orientation": "landscape", "required": true }
  ],
  "fields": [
    { "id": "eyebrow", "type": "text", "maxLength": 16, "required": false },
    { "id": "title", "type": "text", "maxLength": 18, "required": true },
    { "id": "text", "type": "text", "maxLength": 54, "required": true }
  ],
  "renderer": "feature_landscape",
  "tone": ["quiet", "gallery"]
}
```

第一版支持的模版：

- `feature_landscape`：横图沉浸大卡，适合山景、溪流、建筑和公共区。
- `portrait_pair`：双竖图并排，适合房间、窗景、咖啡、床品细节。
- `mixed_mosaic`：一张横图加一张竖图，适合场景加细节。
- `single_portrait`：单竖图留白卡，适合特别漂亮的角落或特写。

### Section Instance

定义页面上的一个真实区块。

字段草案：

```json
{
  "id": "mountain_coffee",
  "enabled": true,
  "template": "mixed_mosaic",
  "slots": {
    "wide": "coffee_bar_01",
    "tall": "coffee_pour_01"
  },
  "copy": {
    "eyebrow": "早晨从一杯咖啡开始",
    "title": "山野咖啡",
    "text": "在山雾还没散的时候，喝一杯认真做的咖啡。"
  }
}
```

### Renderer Mapping

小程序内部维护 `template id -> 渲染分支` 的映射。新增模版时，必须同时满足：

- Template Definition 已定义字段和 slot。
- 内容生成器能根据定义渲染表单。
- 小程序端有对应 renderer。
- 校验脚本能验证实例数据。

AI 未来可以生成 Template Definition 和 Section Instance 草案，但只有被小程序 renderer 支持的 template 才能上线展示。

## 单一内容文件结构

第一版使用一个主内容文件：`content/site.json`。它按页面和运营对象分组，方便店主理解。

结构草案：

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
      "src": "/assets/photos/landscape/hero-mountain-house-01.jpg",
      "orientation": "landscape",
      "alt": "深山里的山从民宿建筑",
      "tags": ["首页", "深山", "建筑"]
    }
  ],
  "templates": [],
  "pages": {
    "home": {
      "hero": {
        "image": "hero_mountain_house",
        "kicker": "山从｜恩施鹤峰深山民宿",
        "title": "住进深山溪流旁的安静夏天",
        "text": "天然溪流、避暑山风、漂亮房间和一杯认真做的咖啡。"
      },
      "sections": []
    },
    "rooms": [],
    "contact": {
      "phone": "13800138000",
      "wechatId": "shancong_homestay",
      "responseText": "山路、天气、房间和咖啡都建议出发前确认。"
    }
  },
  "links": []
}
```

维护原则：

- 店主主要面对 `site`、`share`、`assets`、`pages`、`links`。
- `templates` 可以由系统内置，也可以由 AI 生成草案后经开发者或工具确认启用。
- 运行时需要一个同步脚本，将 `content/site.json` 转换成小程序可 `require` 的 JS 配置。

## 小程序页面结构

### 首页

首页是主传播页。

结构：

- 首屏大图。
- 小字身份：`山从｜恩施鹤峰深山民宿`。
- 诗意主标题，不强销售。
- 画廊区：按 `pages.home.sections` 渲染不同 template。
- 房间掠影：展示空间气质，不主打价格和下单。
- 页面底部联系入口：克制的“联系山从”。

视觉规则：

- 大图、少字、留白、低销售感。
- 每个内容区只放小标题、标题和一句短文案。
- 不按情侣、亲子、团建等客群分类。
- 联系入口不浮动，不密集出现。

### 房间详情页

详情页用于补充信息，保留以后扩展空间。

内容：

- 图集。
- 空间气质。
- 设施、亮点、入住须知。
- 电话和联系页入口。

### 联系页

联系页负责转化，但保持克制。

内容：

- 电话。
- 微信号复制。
- 地址复制。
- 小红书、地图、外部平台链接。
- 已配置的小程序跳转。

按钮文案使用“复制微信”“拨打电话”“复制地址”，避免“立即抢订”等强销售表述。

## 本地内容生成器

生成器是本地浏览器工具，不是线上后台。

功能模块：

1. **站点信息**
   - 维护品牌、地点、分享标题、地址、联系方式。

2. **素材管理**
   - 管理横屏和竖屏图片目录。
   - 为图片生成或编辑 `id`、`orientation`、`alt`、`tags`。
   - 标记未使用图片作为提醒。

3. **首页编排**
   - 根据 Template Definition 生成表单。
   - 添加、排序、启用和停用 sections。
   - 根据 slot 要求选择横图或竖图。
   - 预览接近小程序真实展示的画廊效果。

4. **房间展示**
   - 维护房间名称、短句、封面、图集、标签、亮点、设施、入住须知。
   - 房间封面和图集从 assets 里选择。

5. **联系与链接**
   - 维护微信、电话、地址、小红书、地图、外部平台和小程序跳转。

6. **生成与校验**
   - 输出 `content/site.json`。
   - 同步为运行时 JS 配置。
   - 运行 schema 和资源校验。

## AI Chat 设计

生成器内置右侧 Chat 面板，左侧保留结构化编辑和预览区。

Chat 的职责是辅助生成和修改内容，不是自由聊天机器人。它围绕当前 `site.json`、UI Template Contract、素材清单和视觉原则工作。

支持的指令类型：

- “参考这个民宿网站，生成 3 个首页模版。”
- “用这些竖图做一个更有高级感的房间展示区。”
- “把首页改得更像安静画廊，不要销售感。”
- “基于这组图片生成首页 sections。”
- “帮我写每个区块的一句话文案。”
- “检查现在的首页是不是卖点重复。”

### DeepSeek 接入

- 本地 Node 适配层读取 `DEEPSEEK_API_KEY`。
- 调用 DeepSeek OpenAI-compatible Chat Completions API。
- API key 只能存在本地环境变量或本地未入库密钥文件。
- 请求 prompt 注入：
  - 当前 schema。
  - 当前 templates。
  - 当前 site.json 摘要。
  - 当前素材列表。
  - 山从视觉原则：安静画廊感、低销售、少字、大图、留白。
- 返回格式必须是 JSON proposal。

### AI Proposal

AI 输出不直接覆盖文件，而是生成 proposal。

字段草案：

```json
{
  "type": "template_proposal",
  "summary": "新增一个横图主视觉加双竖图细节的画廊模版",
  "changes": {
    "templates": [],
    "pages": {
      "home": {
        "sections": []
      }
    }
  },
  "warnings": []
}
```

生成器展示 diff 和预览，用户可以：

- 接受全部。
- 只接受某个 template。
- 只接受文案。
- 丢弃。
- 继续追问修改。

### AI 安全边界

- AI 不能直接写小程序页面代码。
- AI 不能跳过 JSON parse、schema 校验和资源校验。
- AI 不能自动发布小程序。
- AI 不能把 API key 写入仓库或小程序包。
- AI 输出失败时不修改现有内容。

## 错误处理

校验错误分为阻断和提醒。

阻断错误：

- `content/site.json` 不是合法 JSON。
- 缺少必填字段：品牌名、分享标题、电话或微信至少一个。
- section 引用不存在的 template。
- section slot 引用不存在的 asset。
- 图片方向与 slot 要求不匹配。
- 本地图片路径不存在。
- renderer 不支持指定 template id。

提醒错误：

- 图片没有 alt。
- 图片未被任何页面使用。
- 区块文案过长。
- 首页连续多个区块使用同一种模版导致节奏单一。
- 链接未配置或被禁用。

运行时策略：

- 小程序运行时只读取已通过校验和同步的配置。
- 若某个可选区块异常，生成阶段应阻断；运行时不做复杂兜底。
- 联系页缺少某个链接时隐藏该入口。

## 测试策略

### 数据层测试

- 校验合法 `site.json` 通过。
- 校验 template id 不存在时报错。
- 校验 slot 缺失时报错。
- 校验横竖屏不匹配时报错。
- 校验图片路径不存在时报错。
- 校验分享标题、联系方式缺失时报错。

### 生成器测试

- 导入图片后能识别并保存 asset。
- 选择 template 后表单按字段和 slot 渲染。
- AI proposal 能展示 diff，不会自动覆盖文件。
- 接受 proposal 后写入 `content/site.json`。
- 拒绝 proposal 后现有内容不变。

### 小程序测试

- 首页可按 sections 顺序渲染多种 template。
- 首页视觉保持画廊感，联系入口不浮动。
- 房间详情可展示图集和联系入口。
- 联系页可拨打电话、复制微信、复制地址。
- 禁用链接不显示。

### 手工验收

- 在微信开发者工具中编译通过。
- 朋友圈分享标题显示为 `山从｜恩施鹤峰深山民宿`。
- 首页第一屏轻微说明是民宿，但主标题保持诗意。
- 页面没有强销售按钮密集出现。

## 待实施边界

第一阶段实现建议：

- 合并现有 `site.js`、`gallery.json`、`homestays.js` 到 `content/site.json`。
- 建立 schema、同步脚本和校验脚本。
- 小程序读取同步后的运行时配置。
- 实现本地内容生成器基础界面。
- 实现 DeepSeek Chat proposal 流程。

第二阶段再考虑：

- 参考网站截图或案例的更完整 AI 分析。
- 图片自动识别横竖屏和内容标签。
- 更高级的本地可视化拖拽编排。
- 多套主题或模板市场。
