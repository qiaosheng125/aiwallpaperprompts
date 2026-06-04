# 每日图片与提示词更新 SOP

## 核心规则

- `E:\程序\2k4k\网站图片` 只是待审核、待上传目录，不代表可以自动上传。
- 只有用户明确说“这批可以上传”“开始上传”“壁纸站上传图片”时，才允许执行上传。
- 以后用户只要说“壁纸站上传图片”，默认含义就是：从 `E:\程序\2k4k\网站图片` 中按当前待上传图片的不同分辨率张数比例，挑选 20 张上传。
- 如果用户明确指定数量，按用户指定数量执行。
- 默认抽取策略不是随机全量，而是先统计待上传目录的分辨率分布，再按比例抽样，尽量保持横图、竖图、其他比例结构。
- 新生成但未审核的图片不能上传，不能归档到已上传目录。
- 上传、部署、线上验证都通过后，才允许归档。
- 归档只能移动本次确认清单中的图片，不能直接移动整个待上传目录。
- 如果上传记录数量、部署数量、归档数量不一致，必须先核对，不继续下一步。

## 输入文件

- 图片目录：`E:\程序\2k4k\网站图片`
- 提示词 manifest：`E:\程序\2k4k\image_manifest.jsonl`
- 上传记录：`data/private/uploaded-gallery-registry.json`
- 公开索引：`src/data/generated-gallery.ts`
- 私有 R2 环境变量：`.env.r2.local`

## 默认一键脚本

双击这个文件执行默认 20 张上传：

```txt
03_网站项目/006_ai-wallpaper-prompt-gallery/壁纸站一键上传20张.cmd
```

脚本会自动执行：

1. 读取 `.env.r2.local`。
2. 扫描 `E:\程序\2k4k\网站图片`。
3. 统计分辨率和比例。
4. 按比例挑选 20 张。
5. 复制到本批临时目录。
6. 从总 manifest 中过滤出本批 20 张的 `selected-manifest.jsonl`。
7. 只上传本批图片到 Cloudflare R2。
8. 更新 `src/data/generated-gallery.ts`。
9. 执行 `npm run build`。
10. 部署 Vercel 生产环境。
11. 绑定 `www.aiwallpaperprompts.com`。
12. 执行线上 smoke check。
13. 只归档本批 20 张。

`.env.r2.local` 不提交到公开仓库，格式如下：

```txt
R2_ACCOUNT_ID=
R2_BUCKET=aiwallpaperprompts-gallery
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=https://media.aiwallpaperprompts.com
```

## 手动命令

如果不使用一键脚本，手动流程如下。

先选择本批图片：

```bash
node scripts/select-upload-batch.mjs "E:\程序\2k4k\网站图片" "data/private/upload-batches/batch-YYYYMMDD-HHMMSS" 20
```

再过滤本批 manifest：

```bash
node scripts/filter-manifest-for-batch.mjs "E:\程序\2k4k\image_manifest.jsonl" "data/private/upload-batches/batch-YYYYMMDD-HHMMSS/selected-upload-batch.json" "data/private/upload-batches/batch-YYYYMMDD-HHMMSS/selected-manifest.jsonl"
```

再上传本批：

```bash
npm run daily:gallery -- "data/private/upload-batches/batch-YYYYMMDD-HHMMSS/selected-manifest.jsonl" "data/private/upload-batches/batch-YYYYMMDD-HHMMSS"
```

构建、部署、验证：

```bash
npm run build
npm exec vercel -- deploy --prod --yes
npm exec vercel -- alias set <deployment-url> www.aiwallpaperprompts.com
$env:BASE_URL='https://www.aiwallpaperprompts.com'; npm run smoke
```

## 审核要求

上传前人工检查：

- 删除低质量、明显畸形、构图重复严重的图片。
- 删除明显像现有 IP 或角色的图片。
- 确认图片对应 manifest 是“未知作品 + 未知角色”版本。
- 不公开 `work`、`character`、`run_id`、本地路径等私有字段。
- 主比例优先保留 `16:9` 桌面壁纸和 `9:16` 手机壁纸。

## 推荐更新量

- 启动期：每天 20-50 张。
- 站点稳定后：每天 50-100 张。
- 不建议一开始每天 1000 张，质量控制、分类维护和 sitemap 管理都会失控。

## 归档流程

归档目录：

```txt
E:\程序\2k4k\已上传归档\aiwallpaperprompts\YYYY-MM-DD\batch-YYYYMMDD-HHMMSS
```

归档前必须满足：

- 上传记录新增数量和本批确认清单一致。
- 线上部署成功。
- smoke check 通过。
- 抽查通过。

归档时只移动本批确认清单中的文件。不要直接移动整个 `网站图片` 目录，因为用户可能在上传过程中又放入新图。

## 已知踩坑

- 2026-06-01 曾出现上传记录 30 张，但归档移动 35 张的问题。原因是目录里混入了未审核新图。
- 处理原则：多移动的未上传图片必须移回 `网站图片`，并等待用户重新审核确认。
- 2026-06-03 一键脚本第一次使用总 manifest，导致历史已删除文件被计入 `missing`。已改为先生成本批 `selected-manifest.jsonl`，以后只处理本批 20 张。
- Windows PowerShell 5 读取无 BOM UTF-8 中文脚本容易乱码。包含中文路径的 `.ps1` 必须保存为 UTF-8 with BOM。

## R2 策略

当前图片存储使用 Cloudflare R2：

- 原图：`https://media.aiwallpaperprompts.com/gallery/originals/...`
- 缩略图：`https://media.aiwallpaperprompts.com/gallery/thumbs/...`
- 列表页使用缩略图。
- 详情页和下载路由使用原图。
- GitHub 和 Vercel 不提交、不部署本地大图。
- `.vercelignore` 必须排除 `public/gallery/**`、`data/private/**`、`data/raw/**`。

R2 环境变量只允许临时注入运行，不写入公开文件。
