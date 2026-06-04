import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = process.argv[2] || "src/data/generated-gallery.ts";
const publicGalleryDir = process.argv[3] || "public/gallery";
const registryPath = process.argv[4] || "data/private/uploaded-gallery-registry.json";

function cleanEnv(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

const r2Config = {
  accountId: cleanEnv(process.env.R2_ACCOUNT_ID),
  bucket: cleanEnv(process.env.R2_BUCKET),
  accessKeyId: cleanEnv(process.env.R2_ACCESS_KEY_ID),
  secretAccessKey: cleanEnv(process.env.R2_SECRET_ACCESS_KEY),
  publicBaseUrl: cleanEnv(process.env.R2_PUBLIC_BASE_URL)
};

function assertR2Config() {
  const missing = Object.entries(r2Config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing R2 config: ${missing.join(", ")}`);
  }
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

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function publicUrl(key) {
  return `${r2Config.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function fileFromGalleryUrl(url) {
  const prefix = "/gallery/";
  if (!String(url).startsWith(prefix)) return "";
  return decodeURIComponent(String(url).slice(prefix.length));
}

function safeAssetName(rawFilename, prompt, suffix) {
  const ext = path.extname(rawFilename).toLowerCase() || ".jpg";
  return `${hash(`${rawFilename}:${prompt || ""}`)}${suffix}${ext === ".jpeg" ? ".jpg" : ext}`;
}

function r2Key(kind, file) {
  return `gallery/${kind}/${file}`;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function upload(client, key, filePath) {
  await client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucket,
      Key: key,
      Body: await readFile(filePath),
      ContentType: contentTypeFor(filePath),
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
}

async function readItems() {
  const text = await readFile(outputPath, "utf8");
  const match = text.match(/export const generatedGalleryItems:\s*GalleryItem\[\]\s*=\s*(\[[\s\S]*\])\s*;/);
  if (!match) throw new Error(`Could not parse ${outputPath}`);
  return JSON.parse(match[1]);
}

async function writeItems(items) {
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

async function readRegistry() {
  try {
    return JSON.parse(await readFile(registryPath, "utf8"));
  } catch {
    return { uploaded: [] };
  }
}

async function writeRegistry(registry) {
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function main() {
  assertR2Config();
  const client = r2Client();
  const items = await readItems();
  const registry = await readRegistry();
  const registryByItemId = new Map(registry.uploaded.map((entry) => [entry.itemId, entry]));
  let migrated = 0;
  const missing = [];

  for (const item of items) {
    const imageFile = fileFromGalleryUrl(item.imageUrl);
    const thumbFile = fileFromGalleryUrl(item.thumbUrl);

    if (!imageFile && !thumbFile) continue;

    const registryEntry = registryByItemId.get(item.id) || { itemId: item.id };

    if (imageFile) {
      const imagePath = path.join(publicGalleryDir, imageFile);
      if (await exists(imagePath)) {
        const key = r2Key("originals", safeAssetName(imageFile, item.prompt, ""));
        await upload(client, key, imagePath);
        item.imageUrl = publicUrl(key);
        registryEntry.imageKey = key;
        registryEntry.publicFile = imageFile;
      } else {
        missing.push({ itemId: item.id, file: imageFile });
      }
    }

    if (thumbFile) {
      const thumbPath = path.join(publicGalleryDir, thumbFile);
      if (await exists(thumbPath)) {
        const key = r2Key("thumbs", safeAssetName(imageFile || thumbFile, item.prompt, "-thumb"));
        await upload(client, key, thumbPath);
        item.thumbUrl = publicUrl(key);
        registryEntry.thumbKey = key;
        registryEntry.thumbFile = thumbFile;
      } else {
        missing.push({ itemId: item.id, file: thumbFile });
      }
    }

    registryEntry.storage = "cloudflare-r2";
    registryEntry.migratedAt = new Date().toISOString();
    if (!registryByItemId.has(item.id)) registry.uploaded.push(registryEntry);
    migrated += 1;
  }

  await writeItems(items);
  await writeRegistry(registry);
  console.log(JSON.stringify({ migrated, missing }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
