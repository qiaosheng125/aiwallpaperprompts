import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const galleryDir = process.argv[2] || "public/gallery";
const maxWidth = Number(process.argv[3] || 960);
const quality = Number(process.argv[4] || 82);

function thumbName(file) {
  const parsed = path.parse(file);
  return `${parsed.name}-thumb${parsed.ext}`;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(galleryDir, { recursive: true });
  const files = (await readdir(galleryDir)).filter((file) =>
    /\.(jpe?g|png|webp)$/i.test(file) && !/-thumb\.(jpe?g|png|webp)$/i.test(file)
  );

  let generated = 0;
  for (const file of files) {
    const input = path.join(galleryDir, file);
    const output = path.join(galleryDir, thumbName(file));
    if (await exists(output)) continue;

    await sharp(input)
      .rotate()
      .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toFile(output);

    generated += 1;
  }

  console.log(`Generated ${generated} thumbnails in ${galleryDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
