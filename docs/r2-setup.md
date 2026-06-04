# Cloudflare R2 图片存储配置

## 目标

第六站图片不长期存放在 Vercel 项目里。图片和缩略图上传到 Cloudflare R2，Vercel 只保存代码、页面和公开索引。

## 推荐命名

```txt
Bucket name: aiwallpaperprompts-gallery
Public custom domain: https://media.aiwallpaperprompts.com
```

如果暂时不配置自定义域名，也可以先使用 Cloudflare 提供的公开 R2 URL，但长期建议使用 `media.aiwallpaperprompts.com`。

## 需要的环境变量

```txt
R2_ACCOUNT_ID=
R2_BUCKET=aiwallpaperprompts-gallery
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=https://media.aiwallpaperprompts.com
```

这些值不要写进 Git 仓库。只放在本机环境变量、`.env.local` 或 Vercel 环境变量中。

## Codex 脚本行为

运行：

```bash
npm run daily:gallery
```

如果检测到完整 R2 环境变量：

- 原图上传到：`gallery/originals/<safe-file>.jpg`
- 缩略图上传到：`gallery/thumbs/<safe-file>-thumb.jpg`
- `imageUrl` 写成 R2 公开 URL
- `thumbUrl` 写成 R2 公开 URL
- `data/private/uploaded-gallery-registry.json` 记录 `storage: cloudflare-r2`

如果没有 R2 环境变量：

- 继续使用 `public/gallery/`
- `imageUrl` 和 `thumbUrl` 使用站内 `/gallery/...`
- `storage: vercel-public`

## 迁移已有图片

已有站内图片迁移到 R2：

```bash
npm run migrate:r2
```

脚本会：

- 读取 `src/data/generated-gallery.ts`。
- 找到当前 `/gallery/...` 的原图和缩略图。
- 上传到 R2。
- 把 `imageUrl` 和 `thumbUrl` 改成 R2 公开 URL。
- 更新 `data/private/uploaded-gallery-registry.json`。

迁移完成且构建通过后，才可以让 Vercel 部署不再包含 `public/gallery` 图片。

## 缺图 / 审核淘汰记录

manifest 有记录但图片目录里没有对应图片，属于正常情况，通常表示人工审核时删掉了丑图或不合格图。

脚本会报告 `missing`，按“审核淘汰 / 缺图跳过”处理，不会中断，也不会发布。

## 安全边界

- 不上传 `run_id`、`work`、`character`、`path`、`browser`。
- R2 文件名使用 hash，避免公开中文文件名和历史来源痕迹。
- 不提交 R2 Access Key。
- 不在浏览器前端暴露 R2 写权限。

## 下一步

1. 在 Cloudflare 创建 R2 bucket。
2. 配置公开访问域名，建议 `media.aiwallpaperprompts.com`。
3. 创建只允许访问该 bucket 的 R2 API token。
4. 把环境变量填入本机或 Vercel。
5. 跑 `npm run daily:gallery`。
6. 确认新生成的 `src/data/generated-gallery.ts` 中图片 URL 指向 R2。
7. 跑 `npm run migrate:r2` 迁移已有 Vercel 静态图片。
8. 构建、部署并验证 R2 图片 URL 返回 200。
# 当前状态

2026-06-01 已完成 R2 正式接入：

- Bucket：`aiwallpaperprompts-gallery`
- 公开媒体域名：`https://media.aiwallpaperprompts.com`
- 首批 8 张原图与 8 张缩略图已迁移到 R2。
- 站点数据已切换到 R2 URL。
- Vercel 部署已通过 `.vercelignore` 排除 `public/gallery/`。
- 写入密钥只用于本机命令环境，不写入仓库。
