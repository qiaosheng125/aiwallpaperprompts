import { NextRequest, NextResponse } from "next/server";
import { findItemBySlug } from "@/data/gallery";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function downloadFilename(item: NonNullable<ReturnType<typeof findItemBySlug>>) {
  const shortId = item.id.replace(/^wallpaper-/, "").slice(0, 10);
  const ratio = item.aspectRatio.replace(":", "x");
  const extension = item.imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
  const base = item.slug
    .replace(/-wallpaper-[a-z0-9]+$/i, "")
    .replace(/-prompt-for-image2$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 86);

  return `aiwallpaperprompts-${base}-${ratio}-${item.width}x${item.height}-${shortId}.${extension}`;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const item = findItemBySlug(slug);

  if (!item?.imageUrl) {
    return new NextResponse("Wallpaper not found", { status: 404 });
  }

  const response = await fetch(item.imageUrl);
  if (!response.ok || !response.body) {
    return new NextResponse("Wallpaper file is unavailable", { status: 502 });
  }

  const headers = new Headers();
  headers.set("content-type", response.headers.get("content-type") || "image/jpeg");
  headers.set("content-disposition", `attachment; filename="${downloadFilename(item)}"`);
  headers.set("cache-control", "public, max-age=86400, s-maxage=86400");

  const contentLength = response.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);

  return new NextResponse(response.body, { headers });
}
