# 域名与部署记录

## 域名

- 主域名：`aiwallpaperprompts.com`
- Canonical URL：`https://www.aiwallpaperprompts.com`
- 首页 URL：`https://www.aiwallpaperprompts.com/`
- Sitemap URL：`https://www.aiwallpaperprompts.com/sitemap.xml`
- Robots URL：`https://www.aiwallpaperprompts.com/robots.txt`

## Vercel

- 项目名：`006_ai-wallpaper-prompt-gallery`
- 已绑定域名：
  - `aiwallpaperprompts.com`
  - `www.aiwallpaperprompts.com`
- 当前生产站：`https://www.aiwallpaperprompts.com`

## Cloudflare DNS

推荐配置：

```txt
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

当前状态：

- `www.aiwallpaperprompts.com` 已 HTTPS 200。
- `aiwallpaperprompts.com` 已 HTTPS 308 跳转到 `https://www.aiwallpaperprompts.com/`。

## 反馈邮箱

Cloudflare Email Routing 配置目标：

```txt
support@aiwallpaperprompts.com -> xyf1254519010@gmail.com
```

2026-06-01 用户已在 Cloudflare 后台完成配置。当前公开 DNS 查询暂未返回 Cloudflare Email Routing 的 MX/TXT 记录，可能仍在传播，需要稍后复查。

不建议开启 catch-all，全收保持禁用。
