# 山从静态展示获客小程序实施方案

## 目标

第一版小程序只解决展示和获客，不建设云服务器和自有后台。用户进入小程序后先被山从的空间气质打动，再通过电话、微信、地址或外部平台入口继续咨询。

山从的核心定位是恩施鹤峰县的深山度假民宿：安静、天然溪流、夏季避暑、漂亮房间和咖啡体验。

## 非目标

- 不做小程序内下单、支付、库存和订单管理。
- 不做用户留言数据库。
- 不做店主后台和账号体系。
- 不依赖云开发、自有 Node.js 服务或数据库。

## 用户路径

1. 用户进入首页，先感知恩施鹤峰、深山溪流、安静避暑、房间美学和咖啡体验。
2. 用户浏览图片叙事和房间掠影。
3. 用户进入房间详情，查看空间、设施、亮点和入住须知。
4. 用户进入联系页，拨打电话、复制微信、复制地址，或跳转/复制外部平台入口。
5. 店主在微信、电话或既有平台完成后续沟通和转化。

## MVP 功能范围

### C 端小程序

- 首页氛围展示
- 场景卖点图片叙事
- 房间掠影
- 房间详情
- 电话咨询
- 微信号复制
- 地址复制
- 外部链接复制
- 已配置小程序跳转

### 内容维护

- `content/site.json`：唯一内容源，包含站点、分享、图片、模版、首页、房间、联系和链接。
- `utils/content-data.js`：由 `content/site.json` 生成的小程序运行时配置。
- `scripts/validate-site-config.js`：校验内容契约。
- `scripts/sync-site-config.js`：同步运行时配置。
- `assets/photos/landscape/`：横屏图片。
- `assets/photos/portrait/`：竖屏图片。
- 正式素材可放本地小程序资源目录，或使用已配置合法域名的图片链接。

## 数据配置

### content/site.json

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `site` | object | 品牌、展示位置和可复制地址 |
| `share` | object | 微信分享标题、路径和分享图 |
| `assets` | object[] | 图片清单，包含 `id`、`orientation`、`src`、`alt` 和标签 |
| `templates` | object[] | UI 模版，定义 renderer、图片 slots 和文案字段 |
| `pages.home` | object | 首页首屏、介绍和图片叙事区块 |
| `pages.rooms` | object[] | 房间卡片、图集、设施、亮点、入住须知 |
| `pages.contact` | object | 电话、微信和管家说明 |
| `links` | object[] | 外部网页复制入口和其它小程序跳转入口 |

当前预设模版：

- `feature_landscape`：一张横图沉浸大卡，适合山景、溪流、建筑。
- `portrait_pair`：两张竖图并排，适合房间、咖啡、床品细节。
- `mixed_mosaic`：一张横图加一张竖图，适合场景加细节。
- `single_portrait`：一张竖图留白卡，适合特别漂亮的角落或特写。

改完 `content/site.json` 后运行：

```bash
node scripts/validate-site-config.js
node scripts/sync-site-config.js
```

### homestays

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 空间 ID |
| `name` | string | 空间名称 |
| `tagline` | string | 空间短句 |
| `cover` | string | 卡片封面 |
| `images` | string[] | 详情页图集 |
| `capacity` | number | 最大人数 |
| `beds` | string | 床型 |
| `rooms` | string | 空间结构 |
| `tags` | string[] | 标签 |
| `amenities` | string[] | 设施 |
| `highlights` | string[] | 亮点 |
| `policies` | string[] | 入住须知 |

## 微信能力约束

- 外部网页：小程序 `web-view` 需要配置业务域名；未配置时不建议在小程序内打开，当前方案采用复制链接。
- 小程序跳转：`wx.navigateToMiniProgram` 需要配置目标小程序 `appId`，并且必须由用户点击触发。
- 客服入口：如启用 `open-type="contact"`，需要在小程序后台完成客服能力配置。
- 电话能力：`wx.makePhoneCall` 只负责拉起系统电话，不保存咨询记录。

## 合规清单

- 服务类目与实际住宿/旅游经营主体一致。
- 图片、地址、房间设施和卖点需真实。
- 如果未来收集手机号、微信号、定位、相册上传或表单数据，需要补充隐私保护指引。
- 正式环境要处理图片合法域名、备案、客服能力和服务类目配置。

## 实施顺序

### 第 1 阶段：静态展示可用

- 首页氛围展示完成。
- 房间详情完成。
- 联系页完成。
- 内容集中到 `utils/site.js` 和 `utils/homestays.js`。

### 第 2 阶段：替换真实素材

- 替换真实房间、溪流、咖啡和公共区图片。
- 替换真实电话、微信和地址。
- 配置小红书、大众点评、地图或平台链接。

### 第 3 阶段：提审准备

- 替换真实 AppID。
- 配置合法图片域名或改用本地资源。
- 配置客服、服务类目、隐私协议和运营规范所需材料。

## 参考资料

- [微信开放文档：web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
- [微信开放文档：wx.navigateToMiniProgram](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html)
- [微信开放文档：运营规范](https://developers.weixin.qq.com/miniprogram/product/)
