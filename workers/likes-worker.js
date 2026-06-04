const allowedOrigins = new Set([
  "https://www.aiwallpaperprompts.com",
  "https://aiwallpaperprompts.com",
  "http://localhost:3000"
]);

const itemIdPattern = /^wallpaper-[a-z0-9]{8,16}$/;
const visitorCookieName = "awp_visitor";
const visitorTtlSeconds = 60 * 60 * 24 * 365;
const ipBuckets = new Map();
const visitorBuckets = new Map();

function json(data, init = {}, origin = "") {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...(init.headers || {})
    }
  });
}

function corsHeaders(origin) {
  if (!allowedOrigins.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
    "vary": "Origin"
  };
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const found = parts.find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

function visitorId() {
  return crypto.randomUUID().replace(/-/g, "");
}

function cookieHeader(id) {
  return `${visitorCookieName}=${encodeURIComponent(id)}; Path=/; Max-Age=${visitorTtlSeconds}; HttpOnly; Secure; SameSite=None`;
}

function rateLimited(map, key, limit, windowMs) {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

async function readTotals(db) {
  const { results } = await db
    .prepare("SELECT item_id, likes FROM wallpaper_like_totals WHERE likes > 0")
    .all();
  return Object.fromEntries((results || []).map((row) => [row.item_id, row.likes]));
}

async function readUserLikes(db, visitor) {
  if (!visitor) return [];
  const { results } = await db
    .prepare("SELECT item_id FROM wallpaper_like_votes WHERE visitor_id = ?")
    .bind(visitor)
    .all();
  return (results || []).map((row) => row.item_id);
}

async function toggleLike(db, itemId, visitor) {
  const existing = await db
    .prepare("SELECT 1 FROM wallpaper_like_votes WHERE item_id = ? AND visitor_id = ?")
    .bind(itemId, visitor)
    .first();
  const now = new Date().toISOString();

  if (existing) {
    await db.batch([
      db.prepare("DELETE FROM wallpaper_like_votes WHERE item_id = ? AND visitor_id = ?").bind(itemId, visitor),
      db
        .prepare(
          "UPDATE wallpaper_like_totals SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END, updated_at = ? WHERE item_id = ?"
        )
        .bind(now, itemId)
    ]);
    const row = await db.prepare("SELECT likes FROM wallpaper_like_totals WHERE item_id = ?").bind(itemId).first();
    return { liked: false, likes: row?.likes || 0 };
  }

  await db.batch([
    db.prepare("INSERT INTO wallpaper_like_votes (item_id, visitor_id, created_at) VALUES (?, ?, ?)").bind(itemId, visitor, now),
    db
      .prepare(
        "INSERT INTO wallpaper_like_totals (item_id, likes, updated_at) VALUES (?, 1, ?) ON CONFLICT(item_id) DO UPDATE SET likes = likes + 1, updated_at = excluded.updated_at"
      )
      .bind(itemId, now)
  ]);
  const row = await db.prepare("SELECT likes FROM wallpaper_like_totals WHERE item_id = ?").bind(itemId).first();
  return { liked: true, likes: row?.likes || 1 };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin && !allowedOrigins.has(origin)) {
      return json({ error: "Origin not allowed" }, { status: 403 }, origin);
    }

    if (!env.DB) {
      return json({ error: "Database is not configured" }, { status: 500 }, origin);
    }

    if (request.method === "GET" && url.pathname === "/likes") {
      let visitor = getCookie(request, visitorCookieName);
      const needsCookie = !visitor;
      if (!visitor) visitor = visitorId();
      const [totals, userLikes] = await Promise.all([readTotals(env.DB), readUserLikes(env.DB, visitor)]);
      return json(
        { totals, userLikes },
        { headers: needsCookie ? { "set-cookie": cookieHeader(visitor) } : {} },
        origin
      );
    }

    if (request.method === "POST" && url.pathname === "/likes/toggle") {
      const ip = clientIp(request);
      let visitor = getCookie(request, visitorCookieName);
      const needsCookie = !visitor;
      if (!visitor) visitor = visitorId();

      if (rateLimited(ipBuckets, ip, 100, 60_000) || rateLimited(visitorBuckets, visitor, 20, 60_000)) {
        return json({ error: "Too many requests" }, { status: 429 }, origin);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, { status: 400 }, origin);
      }

      const itemId = String(body?.itemId || "");
      if (!itemIdPattern.test(itemId)) {
        return json({ error: "Invalid itemId" }, { status: 400 }, origin);
      }

      const result = await toggleLike(env.DB, itemId, visitor);
      return json(
        { itemId, ...result },
        { headers: needsCookie ? { "set-cookie": cookieHeader(visitor) } : {} },
        origin
      );
    }

    return json({ error: "Not found" }, { status: 404 }, origin);
  }
};
