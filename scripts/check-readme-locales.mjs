import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const petsDir = join(repoRoot, "pets");
const petCount = readdirSync(petsDir).filter((entry) =>
  existsSync(join(petsDir, entry, "submission.json")),
).length;
const readmes = [
  "README.md",
  "docs/zh-CN/README.md",
  "docs/ko/README.md",
  "docs/ja/README.md",
  "docs/es/README.md",
];
const languageLabels = ["English", "简体中文", "한국어", "日本語", "Español"];
const localeCodes = ["en", "zh", "ko", "ja", "es"];
const failures = [];

for (const relativePath of readmes) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) {
    failures.push(`${relativePath}: missing generated README`);
    continue;
  }
  const content = readFileSync(path, "utf8");
  if (!content.includes(`![pets: ${petCount}]`)) {
    failures.push(`${relativePath}: pet badge is not ${petCount}`);
  }
  const catalogEntries = content.match(/<table>/g)?.length ?? 0;
  if (catalogEntries !== petCount) {
    failures.push(
      `${relativePath}: contains ${catalogEntries} pet entries, expected ${petCount}`,
    );
  }
  for (const label of languageLabels) {
    if (!content.includes(label)) {
      failures.push(`${relativePath}: language navigation is missing ${label}`);
    }
  }
}

const collections = JSON.parse(
  readFileSync(join(repoRoot, "collections.json"), "utf8"),
);
for (const collection of collections) {
  for (const field of ["title", "description"]) {
    for (const locale of localeCodes) {
      if (!collection[field]?.[locale]?.trim()) {
        failures.push(
          `collections.json: ${collection.slug}.${field}.${locale} is missing`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Locale validation failed:\n- ${failures.join("\n- ")}`);
}

console.log(
  `Locale validation passed for ${readmes.length} languages, ${petCount} pets, and ${collections.length} collections.`,
);
