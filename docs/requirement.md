# AI Wallpaper Prompt Gallery 需求说明

## 目标

建设一个面向海外用户的 AI 壁纸提示词图库站，展示精选 4K 壁纸图片、可复制提示词、negative prompt、风格标签、场景标签和分类页。

第一版先上线 MVP，后续每天追加“未知作品 + 未知角色”的图片和提示词。

## 用户

- AI 绘图用户
- 桌面壁纸和手机壁纸爱好者
- 需要 prompt 灵感的创作者
- 想找 4K desktop wallpaper / mobile wallpaper idea 的用户

## 核心痛点

普通 AI 图站只展示图片，不告诉用户如何生成。普通 prompt 站只有文字，没有成品图参考。本站把图片和 prompt 放在一起，让用户先看成品，再复制提示词。

## 展示重点

- 首页必须像图库站，不像工具站。
- 首屏优先展示图片墙、搜索入口、分类标签。
- 主比例为 `16:9` 桌面壁纸和 `9:16` 手机壁纸。
- 详情页按真实比例展示图片，不把竖图强行拉成横图。
- Prompt 明确标注为 Image2 优化。其他模型可以参考，但不保证同样效果。

## MVP 范围

- 首页图库
- 分类页
- 图片详情页
- Prompt copy 按钮
- Negative prompt 折叠
- Sitemap / robots
- About / Contact / Privacy
- 数据导入脚本

## 数据边界

公开站只使用未知作品、未知角色数据。

不得公开：

- 作品名
- 角色名
- `work`
- `character`
- `run_id`
- 本地绝对路径
- 含 IP 的原始文件名

旧版 `image_manifest.jsonl` 含 IP 字段，不用于公开站。

## 图片策略

列表页使用缩略图，详情页使用 4K JPG 原图。初期可以使用静态文件；图片规模持续增长后迁移到 Cloudflare R2。

## 免费策略

当前版本不做付费墙。竞品常见模式是免费入口或 freemium：壁纸站多靠免费浏览下载获得流量，AI 生成站多靠 credits / 会员收费，prompt 站多靠高级 prompt 或批量能力收费。

本站早期保持：

- 免费浏览图片。
- 免费复制 prompt 和 negative prompt。
- 免费下载 4K 原图。
- 免费使用搜索、筛选、详情页和点赞。

先用免费体验换取收录、访问、复制、下载、点赞和停留数据。只有当数据证明用户持续需要这些内容时，再设计精选 prompt pack、批量下载、收藏夹、会员图库或广告变现。

## 变现方向

短期：SEO 流量 + 广告可能性。

中期：prompt packs、精选壁纸包、会员收藏、批量下载。

长期：AI wallpaper workflow / prompt library 产品化。
