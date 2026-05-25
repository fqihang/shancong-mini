# 山从图片目录

图片按方向分目录，店主只需要把素材放到对应目录，再在 `content/gallery.json` 里改图片路径。

## 目录规则

- `landscape/`：横屏图片，适合首屏大图、溪流、山景、公共区、咖啡吧全景。建议比例 16:9、4:3 或 3:2。
- `portrait/`：竖屏图片，适合房间细节、窗景、咖啡特写、人物手部、床品细节。建议比例 3:4、2:3 或 9:16。

## 命名建议

- 横屏：`scene-stream-01.jpg`、`hero-mountain-01.jpg`、`coffee-bar-01.jpg`
- 竖屏：`room-window-01.jpg`、`coffee-cup-01.jpg`、`linen-detail-01.jpg`

## 配置路径

本地图片在 `content/gallery.json` 里写成小程序绝对路径：

```json
"/assets/photos/landscape/hero-mountain-01.jpg"
```

当前示例先使用远程图片，替换真实素材后再改成以上本地路径。

改完 JSON 后运行：

```bash
node scripts/sync-gallery-config.js
node scripts/validate-gallery-config.js
```
