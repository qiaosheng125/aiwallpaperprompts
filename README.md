# AI Wallpaper Prompt Gallery

第六站项目：面向海外用户的 AI 壁纸提示词图库。

主域名：`aiwallpaperprompts.com`  
Canonical URL：`https://www.aiwallpaperprompts.com`  
生产 URL：`https://www.aiwallpaperprompts.com`

## 项目定位

这不是普通壁纸站，而是可复用的 Image2 壁纸提示词图库：

- 4K AI wallpaper gallery
- 可复制 prompt / negative prompt
- 支持 16:9 桌面壁纸和 9:16 手机壁纸
- 按风格、场景、情绪、颜色、用途分类
- 支持搜索、筛选、爱心排序、详情页、下载原图
- 每日可追加图片和提示词的数据资产站

## 重要边界

公开站只接收“未知作品 + 未知角色”的图片和 manifest。导入脚本必须丢弃或忽略以下字段：

- `work`
- `character`
- `run_id`
- 原始含 IP 的文件名
- 任何作品名、角色名、商标、版权来源

只有用户明确说“这批图可以上传”时，才允许把 `E:\程序\2k4k\网站图片` 中的图片上传到 R2 并归档。

## 数据结构

代码仓库只保存网站代码、导入脚本和公开安全索引，不保存大批量 4K 图片。

推荐结构：

```txt
data/raw/                   # 原始 manifest，不提交
data/private/               # 私有处理过程，不提交
src/data/generated-gallery.ts # 公开安全索引，可提交
```

图片存储：

- Cloudflare R2：存 4K 原图和缩略图
- Vercel：只部署网站代码和索引
- GitHub：只保存代码和小型公开索引

## 每日更新流程

1. 生成未知作品、未知角色图片。
2. 人工审核图片，删除质量差或可识别 IP 的图片。
3. 用户确认“这批图可以上传”。
4. 运行导入脚本生成公开安全数据。
5. 上传新增图片到 R2。
6. 已上传图片归档，未上传图片保留在待审核目录。
7. 本地检查分类、详情页、复制 prompt、下载按钮。
8. 重新部署 Vercel。

## 本地开发

```bash
npm install
npm run dev
```

## 环境变量

- `NEXT_PUBLIC_SITE_URL`：最终 canonical 域名，当前为 `https://www.aiwallpaperprompts.com`
- `NEXT_PUBLIC_BARE_DOMAIN`：裸域名跳转用，当前为 `aiwallpaperprompts.com`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`：当前为 `G-DC6K2C83Y2`
- `NEXT_PUBLIC_CLARITY_ID`：当前为 `x069827ts2`
- `NEXT_PUBLIC_LIKES_API_URL`：点赞 API，当前为 `https://likes.aiwallpaperprompts.com`

## 部署资料

站点名称：AI Wallpaper Prompt Gallery

- 主域名：`aiwallpaperprompts.com`
- Canonical URL：`https://www.aiwallpaperprompts.com`
- 首页 URL：`https://www.aiwallpaperprompts.com/`
- Sitemap URL：`https://www.aiwallpaperprompts.com/sitemap.xml`
- 反馈邮箱：`support@aiwallpaperprompts.com`

GA4：

- 媒体资源名称：`AI Wallpaper Prompt Gallery - aiwallpaperprompts.com`
- 数据流名称：`AI Wallpaper Prompt Gallery - www.aiwallpaperprompts.com`
- Measurement ID：`G-DC6K2C83Y2`

Clarity：

- 项目名：`AI Wallpaper Prompt Gallery - aiwallpaperprompts.com`
- 网站 URL：`https://www.aiwallpaperprompts.com`
- Project ID：`x069827ts2`
