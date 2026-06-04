import { mkdir, readdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const imageDir = process.argv[2];
const batchDir = process.argv[3];
const targetCount = Number(process.argv[4] || 20);

if (!imageDir || !batchDir || !Number.isFinite(targetCount) || targetCount <= 0) {
  console.error("Usage: node scripts/select-upload-batch.mjs <imageDir> <batchDir> [count]");
  process.exit(1);
}

function ratioKey(width, height) {
  if (!width || !height) return "unknown";
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.04) return `${width}x${height} 16:9`;
  if (Math.abs(ratio - 9 / 16) < 0.04) return `${width}x${height} 9:16`;
  return `${width}x${height}`;
}

function allocate(groups, total) {
  const entries = [...groups.entries()].map(([key, files]) => ({
    key,
    files,
    count: files.length,
    exact: (files.length / [...groups.values()].reduce((sum, item) => sum + item.length, 0)) * total
  }));

  for (const entry of entries) {
    entry.take = Math.min(entry.count, Math.floor(entry.exact));
    entry.remainder = entry.exact - entry.take;
  }

  let remaining = total - entries.reduce((sum, entry) => sum + entry.take, 0);
  for (const entry of entries.sort((a, b) => b.remainder - a.remainder || b.count - a.count)) {
    if (remaining <= 0) break;
    if (entry.take < entry.count) {
      entry.take += 1;
      remaining -= 1;
    }
  }

  while (remaining > 0) {
    const entry = entries.find((item) => item.take < item.count);
    if (!entry) break;
    entry.take += 1;
    remaining -= 1;
  }

  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

const allFiles = (await readdir(imageDir))
  .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

const groups = new Map();
const fileMeta = [];

for (const file of allFiles) {
  const fullPath = path.join(imageDir, file);
  const meta = await sharp(fullPath).metadata();
  const key = ratioKey(meta.width, meta.height);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(file);
  fileMeta.push({ file, width: meta.width, height: meta.height, group: key });
}

const allocations = allocate(groups, Math.min(targetCount, allFiles.length));
const selected = [];

for (const allocation of allocations) {
  selected.push(...allocation.files.slice(0, allocation.take).map((file) => ({
    file,
    group: allocation.key
  })));
}

await mkdir(batchDir, { recursive: true });
for (const item of selected) {
  await copyFile(path.join(imageDir, item.file), path.join(batchDir, item.file));
}

const report = {
  sourceDir: imageDir,
  batchDir,
  requested: targetCount,
  available: allFiles.length,
  selected: selected.length,
  distribution: allocations.map((item) => ({
    group: item.key,
    available: item.count,
    selected: item.take
  })),
  files: selected.map((item) => {
    const meta = fileMeta.find((entry) => entry.file === item.file);
    return {
      file: item.file,
      width: meta?.width,
      height: meta?.height,
      group: item.group
    };
  })
};

await writeFile(path.join(batchDir, "selected-upload-batch.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
