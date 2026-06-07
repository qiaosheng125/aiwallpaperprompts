import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const sourceManifest = process.argv[2] || "E:\\程序\\2k4k\\image_manifest.jsonl";
const sourceImageDir = process.argv[3] || "E:\\程序\\2k4k\\网站图片";
const publicGalleryDir = process.argv[4] || "public/gallery";
const outputPath = process.argv[5] || "src/data/generated-gallery.ts";
const registryPath = process.argv[6] || "data/private/uploaded-gallery-registry.json";

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
const thumbWidth = 960;
const thumbQuality = 82;
const r2Config = {
  accountId: cleanEnv(process.env.R2_ACCOUNT_ID),
  bucket: cleanEnv(process.env.R2_BUCKET),
  accessKeyId: cleanEnv(process.env.R2_ACCESS_KEY_ID),
  secretAccessKey: cleanEnv(process.env.R2_SECRET_ACCESS_KEY),
  publicBaseUrl: cleanEnv(process.env.R2_PUBLIC_BASE_URL)
};

function cleanEnv(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function r2Enabled() {
  return (
    r2Config.accountId &&
    r2Config.bucket &&
    r2Config.accessKeyId &&
    r2Config.secretAccessKey &&
    r2Config.publicBaseUrl
  );
}

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey
    }
  });
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRiskyPrompt(prompt) {
  if (/[\u300a\u300b]/.test(prompt)) return true;
  return riskyTerms.some((term) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`, "i").test(prompt));
}

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function sourceImageLookup(directory) {
  const files = await readdir(directory);
  const map = new Map();
  for (const file of files) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
    map.set(file.toLowerCase(), file);
    map.set(path.parse(file).name.toLowerCase(), file);
  }
  return map;
}

function findSourceFile(rawFilename, sourceFiles) {
  const cleanName = cleanText(rawFilename);
  if (!cleanName) return "";
  return sourceFiles.get(cleanName.toLowerCase()) || sourceFiles.get(path.parse(cleanName).name.toLowerCase()) || "";
}

function thumbName(file) {
  const parsed = path.parse(file);
  return `${parsed.name}-thumb${parsed.ext}`;
}

function safeAssetName(rawFilename, prompt, suffix) {
  const ext = path.extname(rawFilename).toLowerCase() || ".jpg";
  return `${hash(`${rawFilename}:${prompt}`)}${suffix}${ext === ".jpeg" ? ".jpg" : ext}`;
}

function r2Key(kind, file) {
  return `gallery/${kind}/${file}`;
}

function publicUrl(key) {
  return `${r2Config.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function ensureThumbnail(publicFile) {
  const input = path.join(publicGalleryDir, publicFile);
  const output = path.join(publicGalleryDir, thumbName(publicFile));
  if (await exists(output)) return thumbName(publicFile);

  await sharp(input)
    .rotate()
    .resize({ width: thumbWidth, height: thumbWidth, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: thumbQuality, mozjpeg: true })
    .toFile(output);

  return thumbName(publicFile);
}

async function uploadR2Asset(client, key, filePath, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucket,
      Key: key,
      Body: await readFile(filePath),
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
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

async function readExistingItems() {
  try {
    const text = await readFile(outputPath, "utf8");
    const match = text.match(/export const generatedGalleryItems:\s*GalleryItem\[\]\s*=\s*(\[[\s\S]*\])\s*;/);
    return match ? JSON.parse(match[1]) : [];
  } catch {
    return [];
  }
}

async function writeItems(items) {
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
}

function publicKey(raw, prompt) {
  return cleanText(raw.prompt_id) || hash(`${raw.filename || ""}:${prompt}`);
}

function toPublicItem(raw, index, imageUrl, thumbUrl, dimensions = {}) {
  const cleaned = { ...raw };
  for (const key of bannedKeys) delete cleaned[key];

  const prompt = cleanText(cleaned.final_prompt || cleaned.prompt || cleaned.submitted_prompt);
  if (!prompt || hasRiskyPrompt(prompt)) return null;

  const id = `wallpaper-${hash(`${cleaned.filename || index}:${prompt}`)}`;
  const aspectRatio = inferAspectRatio(cleaned, prompt, dimensions);
  const tags = inferTags(prompt, aspectRatio);
  const title = cleanText(cleaned.title) || titleFromTags(tags, aspectRatio, index);
  const slug = slugify(`${title}-${id}`);

  return {
    id,
    slug,
    title,
    description:
      cleanText(cleaned.description) ||
      descriptionFromTags(tags, aspectRatio),
    imageUrl,
    thumbUrl,
    width: Number(cleaned.width || dimensions.width || (aspectRatio === "9:16" ? 2160 : 3840)),
    height: Number(cleaned.height || dimensions.height || (aspectRatio === "9:16" ? 3840 : 2160)),
    aspectRatio,
    prompt,
    negativePrompt: cleanText(cleaned.negative_prompt),
    ...tags,
    createdAt: cleanText(cleaned.created_at) || new Date().toISOString().slice(0, 10)
  };
}

async function main() {
  await mkdir(publicGalleryDir, { recursive: true });

  const registry = await readJson(registryPath, { uploaded: [] });
  const uploadedKeys = new Set(registry.uploaded.map((entry) => entry.key));
  const existingItems = await readExistingItems();
  const existingIds = new Set(existingItems.map((item) => item.id));
  const sourceFiles = await sourceImageLookup(sourceImageDir);
  const lines = (await readFile(sourceManifest, "utf8")).split(/\r?\n/).filter((line) => line.trim());
  const useR2 = r2Enabled();
  const client = useR2 ? r2Client() : null;

  const added = [];
  const skipped = [];
  const missing = [];

  for (const [index, line] of lines.entries()) {
    const raw = JSON.parse(line);
    const prompt = cleanText(raw.final_prompt || raw.prompt || raw.submitted_prompt);
    const key = publicKey(raw, prompt);

    if (uploadedKeys.has(key)) {
      skipped.push({ key, reason: "already uploaded" });
      continue;
    }

    if (!prompt || hasRiskyPrompt(prompt)) {
      skipped.push({ key, filename: raw.filename, reason: "filtered by prompt safety" });
      continue;
    }

    const sourceFile = findSourceFile(raw.public_filename || raw.filename, sourceFiles);
    if (!sourceFile) {
      missing.push({ key, filename: raw.filename, reason: "image file not found" });
      continue;
    }

    const publicFile = useR2 ? safeAssetName(sourceFile, prompt, "") : sourceFile;
    const thumbFile = useR2 ? safeAssetName(sourceFile, prompt, "-thumb") : thumbName(publicFile);
    const localOriginal = path.join(publicGalleryDir, publicFile);
    const localThumb = path.join(publicGalleryDir, thumbFile);

    await copyFile(path.join(sourceImageDir, sourceFile), localOriginal);
    const imageMeta = await sharp(localOriginal).metadata();
    const dimensions = { width: imageMeta.width, height: imageMeta.height };
    const generatedThumb = await ensureThumbnail(publicFile);

    let imageUrl = `/gallery/${publicFile}`;
    let thumbUrl = `/gallery/${generatedThumb}`;
    let storage = "vercel-public";
    let imageKey = "";
    let thumbKey = "";

    if (client) {
      imageKey = r2Key("originals", publicFile);
      thumbKey = r2Key("thumbs", thumbFile);
      await uploadR2Asset(client, imageKey, localOriginal, contentTypeFor(publicFile));
      await uploadR2Asset(client, thumbKey, localThumb, contentTypeFor(thumbFile));
      imageUrl = publicUrl(imageKey);
      thumbUrl = publicUrl(thumbKey);
      storage = "cloudflare-r2";
    }

    const item = toPublicItem(raw, existingItems.length + added.length + index, imageUrl, thumbUrl, dimensions);

    if (!item) {
      skipped.push({ key, filename: raw.filename, reason: "filtered by prompt safety" });
      continue;
    }

    if (existingIds.has(item.id)) {
      skipped.push({ key, filename: raw.filename, reason: "item already exists" });
      uploadedKeys.add(key);
      registry.uploaded.push({
        key,
        itemId: item.id,
        sourceFilename: raw.filename,
        publicFile,
        thumbFile,
        storage,
        imageKey,
        thumbKey,
        uploadedAt: new Date().toISOString(),
        status: "already existed"
      });
      continue;
    }

    added.push(item);
    existingIds.add(item.id);
    uploadedKeys.add(key);
    registry.uploaded.push({
      key,
      itemId: item.id,
      slug: item.slug,
      sourceFilename: raw.filename,
      publicFile,
      thumbFile,
      storage,
      imageKey,
      thumbKey,
      uploadedAt: new Date().toISOString(),
      status: "published"
    });
  }

  const merged = [...existingItems, ...added].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  await writeItems(merged);
  await writeJson(registryPath, registry);

  console.log(
    JSON.stringify(
      {
        added: added.length,
        skipped: skipped.length,
        missing: missing.length,
        totalPublicItems: merged.length,
        storage: useR2 ? "cloudflare-r2" : "vercel-public",
        skippedItems: skipped,
        missingItems: missing
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
