# 第六站成本监控与异常止损 SOP

更新日期：2026-06-02

站点：AI Wallpaper Prompt Gallery  
主域名：`aiwallpaperprompts.com`  
图片域名：`media.aiwallpaperprompts.com`  
点赞 API：`likes.aiwallpaperprompts.com`

## 当前结论

第六站当前不建议开启 Cloudflare Page Shield、Bot Fight Mode 或泄露凭据检测。

原因：

- 当前没有登录、密码、支付或用户账号。
- 图片走 Cloudflare R2，自身没有 R2 egress 费用，但有读取操作次数成本。
- 点赞 API 是 Cloudflare Worker，Free 计划有每日请求限制。
- 乱开 Bot Fight 可能误伤 Googlebot、Bingbot、Vercel 检查、我们自己的 smoke check 和 tracking check。

当前更应该做的是：预算告警 + 每日指标检查 + 预设止损动作。

## 可能产生成本的地方

1. Cloudflare R2

- 存储费用。
- Class A / Class B 操作费用。
- R2 没有 egress 流量费，但大量读图会产生 Class B 操作成本。

2. Cloudflare Workers

- 点赞 API：`likes.aiwallpaperprompts.com`
- Free 计划有请求上限，异常刷请求会先表现为请求量暴增。

3. Vercel

- 页面托管、带宽、函数调用。
- 第六站图片不放 Vercel，风险低于把原图放 Vercel。

## 立刻要做：Cloudflare 预算告警

路径：

```txt
Cloudflare Dashboard
-> 左侧 Manage Account / 管理账户
-> Billing / 账单
-> Billable Usage / 可计费使用量
-> Budget alerts / 预算提醒
```

建议创建两个提醒：

```txt
Budget alert 1: 1 USD
Budget alert 2: 5 USD
```

说明：

- 预算提醒只发邮件，不会自动停服务。
- 早期站点 $1 就应该提醒，因为正常情况下几乎不该产生明显费用。
- $5 作为严重提醒，收到后要马上检查 R2 / Worker / Vercel 指标。

## Cloudflare 每日检查指标

路径：

```txt
Cloudflare Dashboard
-> aiwallpaperprompts.com
```

重点看：

- Web Traffic：请求数是否异常暴涨。
- Security Events：是否有异常国家、IP、bot。
- R2：`aiwallpaperprompts-gallery` bucket 的 Class A / Class B 操作和存储量。
- Workers：`aiwallpaperprompts-likes` 请求量。

异常阈值：

```txt
R2 Class B 一天 > 100,000：开始关注
R2 Class B 一天 > 1,000,000：认为异常
likes Worker 一天 > 10,000：开始关注
likes Worker 一天 > 50,000：临时限流或关闭点赞
```

## Vercel 每日检查指标

路径：

```txt
Vercel Dashboard
-> 006_ai-wallpaper-prompt-gallery
-> Usage
```

重点看：

- Bandwidth
- Function Invocations
- Active CPU
- Edge Requests

异常阈值：

```txt
Vercel bandwidth 一天 > 1GB：开始关注
Vercel bandwidth 一天 > 5GB：检查是否被刷
Function invocations 异常增加：检查下载接口、点赞接口、API 路径
```

如果使用 Vercel Pro，进入：

```txt
Account Settings
-> Billing
-> Spend Management
```

设置预算或自动暂停规则。

## 出现异常时的止损顺序

### 1. 点赞 API 被刷

优先动作：

- 给 `likes.aiwallpaperprompts.com` 加 Cloudflare Rate Limiting。
- 临时关闭点赞按钮。
- Worker 内增加 IP + item_id 限流。
- 极端情况下临时停用 Worker route。

### 2. 图片被刷

优先动作：

- 检查 `media.aiwallpaperprompts.com` 请求来源。
- 对异常 IP / ASN / 国家加 WAF 规则。
- 暂时隐藏下载按钮。
- 首页继续只加载缩略图，不直接加载原图。
- 如果某个原图被热链，临时替换或限制该路径。

### 3. 页面被刷

优先动作：

- 查看 Cloudflare Security Events。
- 对异常路径加 Challenge。
- 对高频 IP 加 block / rate limit。
- 不要先开全站 Bot Fight，优先做路径级规则。

## 当前不建议开启的功能

### Page Shield

暂不开。

原因：当前没有支付、登录、密码或高风险第三方脚本。GA4 / Clarity 属于正常统计脚本。

### Bot Fight Mode

暂不开。

原因：可能误伤搜索引擎、Vercel 检查、我们自己的脚本检测和正常爬虫。出现具体异常后，优先做路径级规则。

### 泄露凭据检测

暂不开。

原因：当前没有登录和密码表单。

## 每周复查

每周至少记录一次：

- R2 存储量。
- R2 Class A / Class B 操作。
- Worker 请求量。
- Vercel bandwidth。
- 是否收到预算提醒邮件。
- 是否出现异常国家 / IP / ASN。

复查结果写回：

```txt
03_网站项目/006_ai-wallpaper-prompt-gallery/docs/review.md
```
