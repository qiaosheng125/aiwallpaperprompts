# AI Wallpaper Prompt Gallery 两日工作总结

日期：2026-05-31 至 2026-06-01

## 项目定位

第六站从“小工具站”转向“图片内容站”：用已有 4K 图片和对应提示词，做一个面向海外用户的 AI 壁纸提示词图库。

站点核心价值：

- 用户先看图，再进入详情页复制提示词。
- 提示词主要面向 Image2 生成效果优化。
- 图片以 16:9 桌面壁纸和 9:16 手机壁纸为主。
- 后续通过持续日更形成内容资产池。

## 已上线资产

- 站点名称：AI Wallpaper Prompt Gallery
- 主域名：`aiwallpaperprompts.com`
- Canonical URL：`https://www.aiwallpaperprompts.com`
- 图片媒体域名：`https://media.aiwallpaperprompts.com`
- 点赞 API 域名：`https://likes.aiwallpaperprompts.com`
- R2 bucket：`aiwallpaperprompts-gallery`
- D1 数据库：`aiwallpaperprompts-db`
- Worker：`aiwallpaperprompts-likes`

## 已完成的能力

### 1. 真实图片图库

已接入 `E:\程序\2k4k\image_manifest.jsonl` 和 `E:\程序\2k4k\网站图片`。

当前公开图库：

- 总数：46 条
- 16:9：44 张
- 9:16：2 张
- 所有图片和缩略图都托管在 Cloudflare R2
- Vercel 不再携带本地图库文件

### 2. R2 图片存储

完成 Cloudflare R2 接入：

- 原图路径：`gallery/originals/<hash>.jpg`
- 缩略图路径：`gallery/thumbs/<hash>-thumb.jpg`
- URL 使用 hash 文件名，避免暴露本地中文文件名和来源痕迹。
- `.vercelignore` 已排除 `public/gallery/`。

### 3. 日更脚本

`npm run daily:gallery` 已支持：

- 读取 manifest
- 匹配本地图片
- 跳过已上传记录
- 跳过缺图
- 生成缩略图
- 上传 R2
- 更新 `src/data/generated-gallery.ts`
- 更新 `data/private/uploaded-gallery-registry.json`

本次增量结果：

- 新增：38
- 跳过已上传：9
- 缺图：4
- 总公开条目：46

缺图视为人工审核淘汰，不阻塞发布。

### 4. 上传后归档

已建立归档规则：

```txt
E:\程序\2k4k\已上传归档\aiwallpaperprompts\YYYY-MM-DD
```

本次已归档：

```txt
E:\程序\2k4k\已上传归档\aiwallpaperprompts\2026-06-01
```

归档数量：47 个源文件。

归档后：

```txt
E:\程序\2k4k\网站图片
```

已清空，后续只放下一批待上传图片。

### 5. 分页系统

首页图库和分类页已加入分页：

- 每页 24 张
- 支持上一页、下一页和页码
- 首页首屏仍按高赞优先展示
- 适合短期集中上传几十张，后续稳定日更

### 6. 点赞系统

已完成真实全站点赞系统：

- 前端爱心按钮
- Worker API
- D1 存储
- 全站点赞数排序
- 点赞多的图片优先进入首页首屏

防刷策略：

- httpOnly 匿名访客 cookie
- 同一访客同一图片只能点一次，再点取消
- visitor 限频：每分钟 20 次
- IP 限频：每分钟 100 次
- 只允许本站 Origin
- 前端不能直接写数据库

### 7. 9:16 识别修复

发现问题：

manifest 中有两张真实尺寸为 `2160x3840` 的竖图，但 prompt 开头写了 `Aspect ratio: 16:9`，后文才出现 `9:16`，导致脚本误判为横图。

修复：

- 当前两张竖图已改为 `9:16`
- 标题改为 Phone Wallpaper
- 分类改为 Mobile Wallpaper
- `daily-gallery-update.mjs` 改为优先读取真实图片尺寸
- `import-gallery.mjs` 同步修复

## 安全处理

- R2 写入密钥没有写入项目文件。
- Cloudflare Worker 部署 token 用完后已删除。
- 公开数据中不保留 `run_id`、`work`、`character`、`browser`、本地路径、seed、score。
- Seed 和 score 已从前端详情页移除。

## 验证记录

已多次通过：

```bash
npm run build
BASE_URL=https://www.aiwallpaperprompts.com npm run smoke
```

生产站已部署：

```txt
https://www.aiwallpaperprompts.com
```

点赞 API 验证：

```txt
GET https://likes.aiwallpaperprompts.com/likes
```

返回 `200 OK`。

## 明日继续事项

1. 视觉检查首页、分页、9:16 入口和详情页。
2. 再上传一批图片，观察 R2、D1、Vercel 流程是否稳定。
3. 增加搜索和筛选体验，特别是 ratio、style、scene。
4. 考虑增加“下载图片”或“复制 prompt + negative prompt”的更明显入口。
5. 检查 GSC、Bing、GA4、Clarity 是否都已完成提交和记录。
6. 继续优化标题生成规则，减少模板化标题。

