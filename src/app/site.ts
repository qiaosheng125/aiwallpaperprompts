export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^\uFEFF/, "").trim() ||
  "https://www.aiwallpaperprompts.com";

export const siteName = "AI Wallpaper Prompt Gallery";
