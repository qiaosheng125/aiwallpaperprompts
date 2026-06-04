# 2026-06-02 第六站第三批图片上传记录

站点：AI Wallpaper Prompt Gallery  
线上地址：`https://www.aiwallpaperprompts.com`

## 本批结果

- 用户明确确认 `E:\程序\2k4k\网站图片` 中图片可以上传。
- 子 Agent 只完成上传前审计，未执行上传；最终由 Codex 直接完成脚本修复、上传、部署、验证和归档。
- 增量上传结果：新增 165，跳过 121，缺图 95。
- 当前公开图库总数：286。
- 当前比例：9:16 手机壁纸 165 张，16:9 桌面壁纸 121 张。
- R2 上传成功，Vercel 生产部署成功，线上 smoke check 通过。
- 生产部署 ID：`dpl_Fk1HKQgjyrZDTwtwg7H4kZHAP6vC`。
- 生产域名已 alias 到 `aiwallpaperprompts.com`。

## 本批修复

- `scripts/daily-gallery-update.mjs`：风险词过滤从子串匹配改为独立词匹配，避免 `rem` 误伤普通英文单词。
- `scripts/daily-gallery-update.mjs`：prompt 安全过滤提前到复制、生成缩略图和上传 R2 之前，避免出现“已上传 R2 但未写入公开索引”的未登记资产。
- `scripts/import-gallery.mjs`：同步使用独立词风险匹配，保证以后初始导入和日更脚本规则一致。

## 归档

- 已归档 165 张成功发布源图。
- 归档目录：`E:\程序\2k4k\已上传归档\aiwallpaperprompts\2026-06-02\batch-025000`
- 归档目录额外包含 `upload-archive-summary.json`，所以目录文件数为 166。
- 上传后 `E:\程序\2k4k\网站图片` 剩余 13 张未动，按“未审核/未授权新图”处理。

## 验证

- `npm run build` 通过。
- `npm exec vercel -- --prod --yes` 成功。
- `$env:BASE_URL='https://www.aiwallpaperprompts.com'; npm run smoke` 通过。
