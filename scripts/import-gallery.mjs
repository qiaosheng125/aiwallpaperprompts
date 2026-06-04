import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inputPath = process.argv[2] || "data/raw/image_manifest.jsonl";
const outputPath = process.argv[3] || "src/data/generated-gallery.ts";
const publicGalleryDir = process.argv[4] || "public/gallery";

const bannedKeys = new Set(["work", "character", "run_id", "path", "browser"]);
const riskyTerms = [
  "naruto",
  "genshin",
  "frieren",
  "one piece",
  "chainsaw",
  "pokemon",
  "attack on titan",
  "demon slayer",
  "miku",
  "sakura",
  "rem",
  "asuna",
  "madoka",
  "evangelion"
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRiskyPrompt(prompt) {
  if (/[\u300a\u300b]/.test(prompt)) return true;
  return riskyTerms.some((term) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`, "i").test(prompt));
}

function inferAspectRatio(raw, prompt, dimensions = {}) {
  const explicit = cleanText(raw.aspect_ratio || raw.aspectRatio);
  if (explicit === "9:16" || explicit === "16:9" || explicit === "1:1") return explicit;
  if (Number(dimensions.height) > Number(dimensions.width)) return "9:16";
  if (Number(dimensions.width) > Number(dimensions.height)) return "16:9";
  const match = prompt.match(/aspect ratio:\s*(9:16|16:9|1:1)/i);
  if (match) return match[1];
  const arMatch = prompt.match(/--ar\s*(9:16|16:9|1:1)|\b(9:16|16:9|1:1)\s+aspect ratio/i);
  if (arMatch) return arMatch[1] || arMatch[2];
  return Number(raw.height) > Number(raw.width) ? "9:16" : "16:9";
}

function inferTags(prompt, aspectRatio) {
  const text = prompt.toLowerCase();
  const styles = ["Cinematic Anime"];
  const scenes = [];
  const moods = [];
  const colors = [];
  const uses = [aspectRatio === "9:16" ? "Mobile Wallpaper" : "Desktop Wallpaper"];

  if (text.includes("starlight") || text.includes("star")) scenes.push("Starlight");
  if (text.includes("night")) scenes.push("Night Sky");
  if (text.includes("cherry blossom")) scenes.push("Cherry Blossom");
  if (text.includes("firework")) scenes.push("Fireworks");
  if (text.includes("river") || text.includes("reflection")) scenes.push("River");
  if (/\btrain\b/.test(text)) scenes.push("Train");
  if (text.includes("beach") || text.includes("summer")) scenes.push("Beach");
  if (text.includes("observatory") || text.includes("telescope")) scenes.push("Observatory");
  if (text.includes("cathedral")) scenes.push("Cathedral");
  if (text.includes("lo-fi") || text.includes("room")) scenes.push("Lo-fi Room");
  if (text.includes("garden")) scenes.push("Garden");
  if (text.includes("city")) scenes.push("City");
  if (text.includes("watercolor")) styles.push("Watercolor Anime");
  if (text.includes("pixel")) styles.push("Pixel Art");
  if (text.includes("impressionist")) styles.push("Impressionist Anime");
  if (text.includes("vaporwave")) styles.push("Vaporwave Anime");
  if (text.includes("gothic")) styles.push("Gothic Anime");
  if (text.includes("lo-fi")) styles.push("Lo-fi Anime");
  if (text.includes("calm") || text.includes("quiet")) moods.push("Calm");
  if (text.includes("dream")) moods.push("Dreamy");
  if (text.includes("romantic")) moods.push("Romantic");
  if (text.includes("cozy")) moods.push("Cozy");
  if (text.includes("melancholy")) moods.push("Melancholy");
  if (text.includes("blue")) colors.push("Blue");
  if (text.includes("pink")) colors.push("Pink");
  if (text.includes("gold")) colors.push("Gold");
  if (text.includes("purple")) colors.push("Purple");
  if (text.includes("green")) colors.push("Green");
  if (text.includes("violet")) colors.push("Violet");
  if (text.includes("pastel")) colors.push("Pastel");

  return {
    styles: [...new Set(styles)],
    scenes: [...new Set(scenes.length ? scenes : ["Original Scene"])],
    moods: [...new Set(moods.length ? moods : ["Calm"])],
    colors: [...new Set(colors.length ? colors : ["Mixed"])],
    uses
  };
}

function titleFromTags(tags, aspectRatio, index) {
  const scene = tags.scenes.find((tag) => tag !== "Original Scene");
  const style = tags.styles.find((tag) => tag !== "Cinematic Anime");
  const device = aspectRatio === "9:16" ? "Phone" : "Desktop";
  const theme = [scene, style].filter(Boolean).join(" ");
  if (theme) return `${theme} ${device} Wallpaper Prompt for Image2`;
  return `Original Anime ${device} Wallpaper Prompt for Image2 #${index + 1}`;
}

function descriptionFromTags(tags, aspectRatio) {
  const ratio = aspectRatio === "9:16" ? "phone lock screen" : "desktop wallpaper";
  const scene = tags.scenes.find((tag) => tag !== "Original Scene") || "original anime scene";
  return `A ready-to-copy Image2 prompt for a 4K ${ratio}, built around ${scene.toLowerCase()} with an unknown original character.`;
}

async function publicFileLookup(directory) {
  try {
    const files = await readdir(directory);
    const map = new Map();
    for (const file of files) {
      map.set(file.toLowerCase(), file);
      map.set(path.parse(file).name.toLowerCase(), file);
    }
    return map;
  } catch {
    return new Map();
  }
}

function findPublicFile(rawFilename, publicFiles) {
  const cleanName = cleanText(rawFilename);
  if (!cleanName) return "";
  const exact = publicFiles.get(cleanName.toLowerCase());
  if (exact) return exact;
  return publicFiles.get(path.parse(cleanName).name.toLowerCase()) || "";
}

async function imageDimensions(file) {
  try {
    const meta = await sharp(file).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return {};
  }
}

async function toPublicItem(raw, index, publicFiles) {
  for (const key of bannedKeys) {
    delete raw[key];
  }

  const prompt = cleanText(raw.final_prompt || raw.prompt || raw.submitted_prompt);
  if (!prompt || hasRiskyPrompt(prompt)) {
    return null;
  }

  const id = `wallpaper-${hash(`${raw.filename || index}:${prompt}`)}`;
  const publicFile = findPublicFile(raw.public_filename || raw.filename, publicFiles);
  if (!publicFile && publicFiles.size > 0) {
    return null;
  }

  const safeFile = publicFile || cleanText(raw.public_filename || raw.filename || `${id}.jpg`);
  const dimensions = publicFile ? await imageDimensions(path.join(publicGalleryDir, publicFile)) : {};
  const thumbFile = safeFile.replace(/(\.[a-z0-9]+)$/i, "-thumb$1");
  const thumbExists = publicFiles.has(thumbFile.toLowerCase());
  const aspectRatio = inferAspectRatio(raw, prompt, dimensions);
  const tags = inferTags(prompt, aspectRatio);
  const title = cleanText(raw.title) || titleFromTags(tags, aspectRatio, index);
  const slug = slugify(`${title}-${id}`);
  const width = Number(raw.width || dimensions.width || (aspectRatio === "9:16" ? 2160 : 3840));
  const height = Number(raw.height || dimensions.height || (aspectRatio === "9:16" ? 3840 : 2160));

  return {
    id,
    slug,
    title,
    description:
      cleanText(raw.description) ||
      descriptionFromTags(tags, aspectRatio),
    imageUrl: cleanText(raw.image_url) || `/gallery/${safeFile}`,
    thumbUrl: cleanText(raw.thumb_url) || `/gallery/${thumbExists ? thumbFile : safeFile}`,
    width,
    height,
    aspectRatio,
    prompt,
    negativePrompt: cleanText(raw.negative_prompt),
    ...tags,
    createdAt: cleanText(raw.created_at) || new Date().toISOString().slice(0, 10)
  };
}

async function main() {
  const text = await readFile(inputPath, "utf8");
  const publicFiles = await publicFileLookup(publicGalleryDir);
  const items = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    const item = await toPublicItem(parsed, index, publicFiles);
    if (item) items.push(item);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const ts = [
    "import type { GalleryItem } from './gallery';",
    "",
    "export const generatedGalleryItems: GalleryItem[] = ",
    JSON.stringify(items, null, 2),
    ";",
    ""
  ].join("\n");
  await writeFile(outputPath, ts, "utf8");
  console.log(`Imported ${items.length} public gallery items -> ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
