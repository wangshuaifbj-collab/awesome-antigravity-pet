import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, "../out");

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? findHtmlFiles(path)
        : Promise.resolve(entry.name.endsWith(".html") ? [path] : []);
    }),
  );
  return nested.flat();
}

const localeDirectories = {
  zh: "zh-CN",
  ko: "ko",
  ja: "ja",
  es: "es",
};

let localizedCount = 0;
for (const [directory, htmlLang] of Object.entries(localeDirectories)) {
  const pages = [
    join(outDir, `${directory}.html`),
    ...(await findHtmlFiles(join(outDir, directory))),
  ];
  for (const path of pages) {
    const html = await readFile(path, "utf8");
    const localized = html.replace(
      '<html lang="en">',
      `<html lang="${htmlLang}">`,
    );
    if (localized === html) {
      throw new Error(`${path}: expected an English root language to localize`);
    }
    await writeFile(path, localized, "utf8");
    localizedCount += 1;
  }
}

console.log(`Localized ${localizedCount} exported page(s).`);
