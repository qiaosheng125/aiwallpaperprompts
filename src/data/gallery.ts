import { generatedGalleryItems } from "./generated-gallery";

export type GalleryItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  prompt: string;
  negativePrompt?: string;
  styles: string[];
  scenes: string[];
  moods: string[];
  colors: string[];
  uses: string[];
  createdAt: string;
};

export const sampleGalleryItems: GalleryItem[] = [
  {
    id: "sample-cinematic-starlight",
    slug: "cinematic-starlight-anime-wallpaper-prompt",
    title: "Cinematic Starlight Anime Wallpaper Prompt",
    description:
      "A widescreen original anime wallpaper prompt built around starlight, calm atmosphere, and desktop-safe negative space.",
    imageUrl: "",
    thumbUrl: "",
    width: 3840,
    height: 2160,
    aspectRatio: "16:9",
    prompt:
      "Original unknown anime character in a cinematic starlight scene, 4K desktop wallpaper, wide composition, soft rim light, layered night sky, quiet emotional pause, clean silhouette, detailed hair light, balanced negative space for desktop icons, high quality anime illustration.",
    negativePrompt:
      "low quality, blurry, text, watermark, logo, recognizable copyrighted character, existing anime character, copied costume, copied weapon, distorted hands",
    styles: ["Cinematic Anime"],
    scenes: ["Night Sky", "Starlight"],
    moods: ["Calm", "Dreamy"],
    colors: ["Blue", "Purple"],
    uses: ["Desktop Wallpaper"],
    createdAt: "2026-05-31"
  },
  {
    id: "sample-sakura-road",
    slug: "sakura-road-anime-wallpaper-prompt",
    title: "Sakura Road Anime Wallpaper Prompt",
    description:
      "A bright original anime wallpaper prompt for spring, soft light, and a clean road-perspective composition.",
    imageUrl: "",
    thumbUrl: "",
    width: 3840,
    height: 2160,
    aspectRatio: "16:9",
    prompt:
      "Original unknown anime character walking along a sakura road, wide 4K desktop wallpaper, spring light, soft petals, road perspective, clean foreground, pastel color palette, expressive eyes, gentle breeze, detailed clothing folds, polished anime key visual.",
    negativePrompt:
      "low quality, blurry, text, watermark, logo, recognizable copyrighted character, copied school uniform, messy background, extra limbs",
    styles: ["Cinematic Anime", "Pastel Anime"],
    scenes: ["Sakura", "Road"],
    moods: ["Bright", "Cozy"],
    colors: ["Pink", "Pastel"],
    uses: ["Desktop Wallpaper"],
    createdAt: "2026-05-31"
  },
  {
    id: "sample-fireworks",
    slug: "summer-fireworks-anime-wallpaper-prompt",
    title: "Summer Fireworks Anime Wallpaper Prompt",
    description:
      "A warm fireworks prompt with a still emotional frame and clear 4K wallpaper composition.",
    imageUrl: "",
    thumbUrl: "",
    width: 3840,
    height: 2160,
    aspectRatio: "16:9",
    prompt:
      "Original unknown anime character under summer fireworks, 4K widescreen wallpaper, warm face light, quiet pause, riverside reflection, soft night air, clean composition, detailed eyes, gentle color bloom, cinematic anime illustration, no text.",
    negativePrompt:
      "low quality, blurry, text, watermark, logo, recognizable copyrighted character, copied outfit, crowded festival background, bad hands",
    styles: ["Cinematic Anime"],
    scenes: ["Fireworks", "River"],
    moods: ["Romantic", "Calm"],
    colors: ["Gold", "Dark"],
    uses: ["Desktop Wallpaper"],
    createdAt: "2026-05-31"
  },
  {
    id: "sample-neon-rain-portrait",
    slug: "neon-rain-mobile-anime-wallpaper-prompt",
    title: "Neon Rain Mobile Anime Wallpaper Prompt",
    description:
      "A vertical 9:16 original anime wallpaper prompt for phone lock screens, neon rain, and clean portrait framing.",
    imageUrl: "",
    thumbUrl: "",
    width: 2160,
    height: 3840,
    aspectRatio: "9:16",
    prompt:
      "Original unknown anime character standing in neon rain, 9:16 mobile wallpaper, vertical portrait composition, reflective street light, cinematic wet hair highlights, soft bokeh, clean upper area for lock screen clock, expressive eyes, high quality anime illustration, Image2 optimized.",
    negativePrompt:
      "low quality, blurry, text, watermark, logo, recognizable copyrighted character, existing anime character, copied costume, copied weapon, distorted hands",
    styles: ["Cinematic Anime", "Neon Anime"],
    scenes: ["Rain", "City"],
    moods: ["Moody", "Dreamy"],
    colors: ["Neon", "Purple"],
    uses: ["Mobile Wallpaper"],
    createdAt: "2026-05-31"
  },
  {
    id: "sample-sunlit-window-portrait",
    slug: "sunlit-window-mobile-anime-wallpaper-prompt",
    title: "Sunlit Window Mobile Anime Wallpaper Prompt",
    description:
      "A soft 9:16 phone wallpaper prompt with warm window light, quiet atmosphere, and clock-safe negative space.",
    imageUrl: "",
    thumbUrl: "",
    width: 2160,
    height: 3840,
    aspectRatio: "9:16",
    prompt:
      "Original unknown anime character beside a sunlit window, 9:16 mobile wallpaper, warm morning light, quiet room atmosphere, clean top negative space for phone clock, soft fabric details, gentle expression, natural color palette, polished anime key visual, Image2 optimized.",
    negativePrompt:
      "low quality, blurry, text, watermark, logo, recognizable copyrighted character, copied outfit, messy room, extra limbs",
    styles: ["Pastel Anime"],
    scenes: ["Window", "Morning"],
    moods: ["Calm", "Cozy"],
    colors: ["Warm", "Pastel"],
    uses: ["Mobile Wallpaper"],
    createdAt: "2026-05-31"
  }
];

export const galleryItems: GalleryItem[] =
  generatedGalleryItems.length > 0 ? generatedGalleryItems : sampleGalleryItems;

export const allTags = Array.from(
  new Set(
    galleryItems.flatMap((item) => [
      ...item.styles,
      ...item.scenes,
      ...item.moods,
      ...item.colors,
      ...item.uses
    ])
  )
).sort();

export function findItemBySlug(slug: string) {
  return galleryItems.find((item) => item.slug === slug);
}

export function slugifyTag(tag: string) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function findTagBySlug(slug: string) {
  return allTags.find((tag) => slugifyTag(tag) === slug);
}

export function itemsForTag(tag: string) {
  return galleryItems.filter((item) =>
    [...item.styles, ...item.scenes, ...item.moods, ...item.colors, ...item.uses].includes(tag)
  );
}

export function displayTag(tag: string) {
  if (tag === "Desktop Wallpaper") return "Desktop Wallpapers";
  if (tag === "Mobile Wallpaper") return "Mobile Wallpapers";
  return tag;
}

export function categoryTitle(tag: string) {
  if (tag === "Desktop Wallpaper") return "16:9 Desktop Wallpaper Prompts";
  if (tag === "Mobile Wallpaper") return "9:16 Phone Wallpaper Prompts";
  return `${tag} Wallpaper Prompts`;
}

export function categoryDescription(tag: string) {
  if (tag === "Desktop Wallpaper") {
    return "Browse 16:9 Image2 wallpaper prompts with 4K source images, copy-ready prompt text, and desktop-focused compositions.";
  }
  if (tag === "Mobile Wallpaper") {
    return "Browse 9:16 Image2 phone wallpaper prompts with 4K vertical images, lock-screen-friendly framing, and copy-ready prompt text.";
  }
  return `Browse ${tag.toLowerCase()} Image2 wallpaper prompts with 4K images, copy-ready prompt text, and reusable visual tags.`;
}

export function relatedItemsFor(item: GalleryItem, limit = 6) {
  const itemTags = new Set([...item.styles, ...item.scenes, ...item.moods, ...item.colors, ...item.uses]);

  return galleryItems
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => {
      const candidateTags = [...candidate.styles, ...candidate.scenes, ...candidate.moods, ...candidate.colors, ...candidate.uses];
      const score =
        candidateTags.filter((tag) => itemTags.has(tag)).length +
        (candidate.aspectRatio === item.aspectRatio ? 3 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || String(b.candidate.createdAt).localeCompare(String(a.candidate.createdAt)))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
