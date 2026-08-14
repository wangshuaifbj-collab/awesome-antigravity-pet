import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, "../out");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

function previewFilePath(webPath) {
  return join(outDir, webPath.split("?", 1)[0].replace(/^\/+/, ""));
}

const files = await listFiles(outDir);
const forbidden = files.filter(
  (path) =>
    path.includes("/assets/previews/") &&
    (path.includes("/gifs/") || path.endsWith("/contact-sheet.png")),
);
if (forbidden.length > 0) {
  throw new Error(
    `Pages bundle contains ${forbidden.length} QA-only preview file(s), starting with ${forbidden[0]}`,
  );
}

const pets = JSON.parse(await readFile(join(outDir, "pets.json"), "utf8"));
const referenced = new Set(
  pets.flatMap((pet) => [
    pet.previewImage,
    pet.animatedPreviewImage,
    ...Object.values(pet.gifs ?? {}),
  ]),
);
const missing = [];
for (const webPath of referenced) {
  if (!webPath.startsWith("/assets/previews/")) continue;
  try {
    await stat(previewFilePath(webPath));
  } catch {
    missing.push(webPath);
  }
}
if (missing.length > 0) {
  throw new Error(
    `Pages bundle is missing ${missing.length} referenced preview(s), starting with ${missing[0]}`,
  );
}

const sizes = await Promise.all(
  files.map(async (path) => (await stat(path)).size),
);
const totalBytes = sizes.reduce((total, size) => total + size, 0);
const previewFiles = files.filter((path) => path.includes("/assets/previews/"));
const previewSizes = await Promise.all(
  previewFiles.map(async (path) => (await stat(path)).size),
);
const previewBytes = previewSizes.reduce((total, size) => total + size, 0);
const homeBytes = (await stat(join(outDir, "index.html"))).size;
const headers = await readFile(join(outDir, "_headers"), "utf8");
const requiredCacheRules = [
  {
    path: "/_next/static/*",
    value: "Cache-Control: public, max-age=31536000, immutable",
  },
  {
    path: "/assets/previews/*",
    value:
      "Cache-Control: public, max-age=604800, stale-while-revalidate=86400",
  },
  {
    path: "/*.json",
    value: "Cache-Control: public, max-age=300, stale-while-revalidate=3600",
  },
  {
    path: "/*.json",
    value:
      "CDN-Cache-Control: public, max-age=600, stale-while-revalidate=3600",
  },
];
for (const rule of requiredCacheRules) {
  const hasRule = headers
    .split(/\n(?=\/)/)
    .some(
      (block) =>
        block.trimStart().startsWith(`${rule.path}\n`) &&
        block.includes(`  ${rule.value}`),
    );
  if (!hasRule) {
    throw new Error(`Pages bundle is missing cache rule ${rule.path}`);
  }
}

console.log(
  `Bundle check passed: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB total; ` +
    `${previewFiles.length} previews, ${(previewBytes / 1024 / 1024).toFixed(1)} MiB; ` +
    `${homeBytes.toLocaleString("en-US")} B home HTML.`,
);
