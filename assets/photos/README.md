# 山从图片目录

图片按方向分目录。店主只需要把素材放到对应目录，再打开本地生成器扫描并加入素材库。

## 目录规则

- `landscape/`：横屏图片，适合首屏大图、溪流、山景、公共区、咖啡吧全景。建议比例 16:9、4:3 或 3:2。
- `portrait/`：竖屏图片，适合房间细节、窗景、咖啡特写、人物手部、床品细节。建议比例 3:4、2:3 或 9:16。

## 命名建议

- 横屏：`scene-stream-01.jpg`、`hero-mountain-01.jpg`、`coffee-bar-01.jpg`
- 竖屏：`room-window-01.jpg`、`coffee-cup-01.jpg`、`linen-detail-01.jpg`

## 使用方式

1. 把横屏照片放进 `assets/photos/landscape/`。
2. 把竖屏照片放进 `assets/photos/portrait/`。
3. 启动本地生成器：

```bash
npm run generator
```

4. 打开 `http://127.0.0.1:57592/`。
5. 在“素材库”面板点击“扫描照片”。
6. 确认新照片后点击“加入素材库”。

生成器会把新照片加入 `content/site.json` 的 `assets`，并同步到 `utils/content-data.js`。之后在店家配置 Workflow 里就可以直接选择这些照片。

本地图片路径会写成小程序绝对路径，例如：

```json
"/assets/photos/landscape/hero-mountain-01.jpg"
```

当前示例先使用远程图片。替换真实素材后，优先通过生成器扫描导入，避免手动改错图片 id、方向和路径。
