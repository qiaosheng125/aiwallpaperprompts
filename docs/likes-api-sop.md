# 点赞 API SOP

## 当前目标

把第六站的爱心功能从“本地浏览器喜欢”升级为“全站真实点赞数排序”。

## Cloudflare 资源

- D1 数据库名：`aiwallpaperprompts-db`
- D1 数据库 ID：`12652259-45df-419b-9341-04b8bf634413`
- Worker 名：`aiwallpaperprompts-likes`
- API 域名：`https://likes.aiwallpaperprompts.com`

## 当前状态

2026-06-01 已完成：

- Worker 已部署。
- D1 绑定已生效。
- 自定义域名 `likes.aiwallpaperprompts.com` 已绑定 Worker。
- Vercel 生产环境变量已配置：

```txt
NEXT_PUBLIC_LIKES_API_URL=https://likes.aiwallpaperprompts.com
```

- 复制环境变量时不要带 BOM、中文冒号、空格或多余换行。
- 前端会清理开头 BOM / 空白和尾部斜杠，并校验必须是 `http` / `https` URL。
- 如果 URL 不合法，远程点赞会自动禁用，但本地点赞仍可用。

- 生产站已重新部署。
- `GET https://likes.aiwallpaperprompts.com/likes` 返回 `200 OK`。
- 测试点赞数据已清理，当前 `totals` 为空。
- `BASE_URL=https://www.aiwallpaperprompts.com npm run smoke` 通过。

2026-06-02 修复：

- 第七站 tracking checker 原型扫描时发现过 malformed likes API 请求。
- 已在 `src/app/gallery-interactions.tsx` 增加 `cleanPublicUrl()`，防止 `NEXT_PUBLIC_LIKES_API_URL` 含 BOM/空白时拼出错误请求。
- 已部署生产环境，deployment id：`dpl_4a2pJtfTfX8qEPuiFJ8NBGLQ5Qzo`。
- 复测 `npm run smoke` 通过，tracking checker 复扫无 malformed likes API 请求。

## D1 表

已在 Cloudflare D1 控制台执行：

```sql
CREATE TABLE IF NOT EXISTS wallpaper_like_totals (
  item_id TEXT PRIMARY KEY,
  likes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallpaper_like_votes (
  item_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (item_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_wallpaper_like_votes_item_id
ON wallpaper_like_votes (item_id);
```

## 防刷规则

- 不开放直接写数据库。
- 前端只请求 Worker。
- Worker 只允许本站 Origin。
- 使用 httpOnly `visitor_id` cookie 做匿名去重。
- `item_id + visitor_id` 唯一约束，避免同一访客重复点赞同一张图。
- Worker 内置基础限频：
  - 单个 visitor 每分钟最多 20 次点赞操作。
  - 单个 IP 每分钟最多 100 次点赞操作。

## 接口

```txt
GET /likes
POST /likes/toggle
```

`GET /likes` 返回：

```json
{
  "totals": {
    "wallpaper-xxx": 12
  },
  "userLikes": ["wallpaper-xxx"]
}
```

`POST /likes/toggle` 请求：

```json
{
  "itemId": "wallpaper-xxx"
}
```

返回：

```json
{
  "itemId": "wallpaper-xxx",
  "liked": true,
  "likes": 13
}
```

## 下一步

1. 在 D1 数据库详情页复制数据库 ID。
2. 替换 `wrangler.toml` 里的 `REPLACE_WITH_D1_DATABASE_ID`。
3. 部署 Worker。
4. 给 Worker 绑定自定义域名：`likes.aiwallpaperprompts.com`。
5. 在 Vercel 配置：

```txt
NEXT_PUBLIC_LIKES_API_URL=https://likes.aiwallpaperprompts.com
```

6. 重新部署网站。

## Worker 部署命令

以后更新 Worker 时使用：

```bash
npm exec wrangler -- deploy --domain likes.aiwallpaperprompts.com
```
