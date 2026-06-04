import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2];
const selectionPath = process.argv[3];
const outputPath = process.argv[4];

if (!manifestPath || !selectionPath || !outputPath) {
  console.error("Usage: node scripts/filter-manifest-for-batch.mjs <manifest> <selectionJson> <outputJsonl>");
  process.exit(1);
}

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function keysForName(value) {
  const name = clean(value);
  if (!name) return [];
  return [name, clean(path.parse(name).name)];
}

const selection = JSON.parse(await readFile(selectionPath, "utf8"));
const wanted = new Set();
for (const item of selection.files || []) {
  for (const key of keysForName(item.file)) wanted.add(key);
}

const output = [];
const lines = (await readFile(manifestPath, "utf8")).split(/\r?\n/).filter((line) => line.trim());
for (const line of lines) {
  const raw = JSON.parse(line);
  const keys = [
    ...keysForName(raw.public_filename),
    ...keysForName(raw.filename)
  ];
  if (keys.some((key) => wanted.has(key))) {
    output.push(line);
  }
}

await writeFile(outputPath, `${output.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ selected: selection.files?.length || 0, manifestLines: output.length }, null, 2));
