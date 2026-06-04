# AI Wallpaper Prompt Gallery 上线清单

## 基础信息

- [x] 站点名称：`AI Wallpaper Prompt Gallery`
- [x] 主域名：`aiwallpaperprompts.com`
- [x] Canonical URL：`https://www.aiwallpaperprompts.com`
- [x] 首页 URL：`https://www.aiwallpaperprompts.com/`
- [x] Sitemap URL：`https://www.aiwallpaperprompts.com/sitemap.xml`
- [x] Robots URL：`https://www.aiwallpaperprompts.com/robots.txt`
- [x] 反馈邮箱：`support@aiwallpaperprompts.com`

## 当前上线状态

- [x] Vercel 项目已创建：`006_ai-wallpaper-prompt-gallery`
- [x] 生产站点已上线：`https://www.aiwallpaperprompts.com`
- [x] 裸域 `https://aiwallpaperprompts.com/` 308 跳转到 `https://www.aiwallpaperprompts.com/`
- [x] 首页返回 200
- [x] Sitemap 返回 200
- [x] Robots 返回 200
- [x] 详情页返回 200
- [x] 分类页返回 200

## Cloudflare DNS

推荐记录：

```txt
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

当前观察：

- `www.aiwallpaperprompts.com` 已解析并可访问。
- `aiwallpaperprompts.com` 已解析并跳转到 `https://www.aiwallpaperprompts.com/`。

## 统计配置

- [x] GA4 Measurement ID：`G-DC6K2C83Y2`
- [x] Vercel 环境变量：`NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [x] Microsoft Clarity Project ID：`x069827ts2`
- [x] Vercel 环境变量：`NEXT_PUBLIC_CLARITY_ID`

创建信息：

- GA4 媒体资源名称：`AI Wallpaper Prompt Gallery - aiwallpaperprompts.com`
- GA4 数据流名称：`AI Wallpaper Prompt Gallery - www.aiwallpaperprompts.com`
- Clarity 项目名：`AI Wallpaper Prompt Gallery - aiwallpaperprompts.com`
- Clarity 网站 URL：`https://www.aiwallpaperprompts.com`

## 搜索收录

只提交最终 `www` 地址，不提交裸域。

- [x] Google Search Console 添加站点
- [x] Google Search Console 提交 sitemap：`https://www.aiwallpaperprompts.com/sitemap.xml`
- [x] Google Search Console 请求首页编入索引：`https://www.aiwallpaperprompts.com/`
- [x] Bing Webmaster 提交 sitemap：`https://www.aiwallpaperprompts.com/sitemap.xml`

## 数据导入

- [x] 已创建 `scripts/import-gallery.mjs`
- [x] 已创建公开安全数据结构
- [x] 已排除 `work`、`character`、`run_id`、本地绝对路径等字段
- [x] 已接入 Cloudflare R2 存储图片
- [x] 已接入图片下载按钮
- [x] 已接入爱心排序
- [x] 已接入搜索、比例筛选、标签筛选、排序

## 后续检查

1. [x] 部署后检查源码是否包含 `G-DC6K2C83Y2` 和 `x069827ts2`。
2. [x] 检查裸域跳转到 `www`。
3. [x] 检查 sitemap / robots / 9:16 分类页 / 下载接口。
4. [ ] 在 GA4 实时报告里确认访问数据。
5. [ ] 在 Clarity 里确认项目开始收到访问数据。
