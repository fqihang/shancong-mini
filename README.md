# 山从民宿静态展示获客微信小程序

这是一个原生微信小程序，用于山从民宿的静态展示和获客。当前定位是完全不依赖云服务器：不做自有下单、不做支付、不做留言数据库，也不做店主后台。用户看图和了解卖点后，通过电话、微信、地址和外部平台入口继续沟通。

山从位于湖北恩施鹤峰县，主打深山安静、天然溪流、夏季避暑、漂亮房间和咖啡体验。

## 当前功能

- 首页：沉浸式图片展示、核心卖点、房间掠影、底部联系入口。
- 房间详情：图集、空间气质、亮点、设施、入住须知、电话/联系店主。
- 联系页：拨打电话、复制微信号、复制地址、可配置平台链接和小程序跳转。
- 内容维护：统一维护在 `content/site.json`，再同步生成小程序运行时配置 `utils/content-data.js`。

## 运行方式

1. 打开微信开发者工具。
2. 选择“导入项目”，目录选择本仓库：`/Users/qihang.feng/Documents/AI/wechat-store`。
3. AppID 当前使用项目配置里的测试 AppID；上线前替换为真实小程序 AppID。
4. 当前 `project.config.json` 为了加载远程示例图片关闭了 `urlCheck`。正式环境建议把图片换成本地素材，或配置合法图片域名。

## 日常维护

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

微信小程序不能直接读取普通数据 JSON，同步脚本会把 `content/site.json` 写成运行时使用的 `utils/content-data.js`。

### 图片目录

图片目录：

- `assets/photos/landscape/`：横屏图，适合首屏、山景、溪流、建筑和公共区。
- `assets/photos/portrait/`：竖屏图，适合房间、窗景、咖啡、床品和局部细节。

## 产品边界

- 不接云数据库，不保存用户留言。
- 不做店主后台，内容通过代码配置维护。
- 不做强交易链路，预订和咨询导向电话、微信或既有平台。
- 如后续要直接打开 H5 页面，需要在微信小程序后台配置业务域名并使用 `web-view`。

## 参考资料

- [微信开放文档：web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
- [微信开放文档：wx.navigateToMiniProgram](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html)
- [微信开放文档：小程序运营规范与开放服务类目](https://developers.weixin.qq.com/miniprogram/product/)
