const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

async function assertOk(path, expectedText) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  const text = await response.text();
  if (expectedText && !text.includes(expectedText)) {
    throw new Error(`${path} did not include expected text: ${expectedText}`);
  }
  return text;
}

async function main() {
  const homepage = await assertOk("/", "AI Wallpaper Prompt Gallery");
  const checks = [
    "IMAGE2-OPTIMIZED WALLPAPER PROMPTS",
    "Wallpaper prompt gallery",
    "16:9",
    "9:16",
    "Image2 output",
    "original unknown-character",
    "Newest 4K prompt drops",
    "9:16 phone wallpapers",
    "Popular visual directions",
    "Search mood, scene",
    "All tags",
    "Popular first"
  ];

  for (const check of checks) {
    if (!homepage.includes(check)) {
      throw new Error(`Homepage missing: ${check}`);
    }
  }

  await assertOk("/about", "About AI Wallpaper Prompt Gallery");
  await assertOk("/contact", "support@aiwallpaperprompts.com");
  await assertOk("/privacy", "Privacy");
  await assertOk("/robots.txt", "https://www.aiwallpaperprompts.com/sitemap.xml");
  await assertOk("/sitemap.xml", "https://www.aiwallpaperprompts.com/");

  const detailMatch = homepage.match(/href="(\/wallpapers\/[^"]+)"/);
  if (!detailMatch) {
    throw new Error("Homepage did not include a wallpaper detail link");
  }
  await assertOk(detailMatch[1], "Prompt");

  await assertOk("/categories/cinematic-anime", "Browse cinematic anime Image2 wallpaper prompts");
  await assertOk("/categories/mobile-wallpaper", "9:16 Phone Wallpaper Prompts");

  console.log("Smoke check passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
