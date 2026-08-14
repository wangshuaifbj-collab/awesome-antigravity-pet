import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://codexpet.top";
const INDEXNOW_KEY = "d687eb8cfb15d89e9bf7c9c00f0a8c20";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, "../out");
const failures = [];
const canonicalUrls = new Set();
const hreflangLocales = ["en", "zh-CN", "ko", "ja", "es", "x-default"];
const routeLanguages = {
  zh: "zh-CN",
  ko: "ko",
  ja: "ja",
  es: "es",
};

function requireMatch(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message);
}

function normalizeUrl(value) {
  const url = new URL(value);
  return url.pathname === "/" && !url.search ? url.origin : url.href;
}

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

function checkPage(filePath, html) {
  const outputPath = relative(outDir, filePath).replaceAll("\\", "/");
  if (outputPath === "404.html") return;
  const route =
    outputPath === "index.html"
      ? ""
      : outputPath.replace(/(?:\/index)?\.html$/, "");
  const expectedCanonical = `${SITE_URL}${route ? `/${route}` : ""}`;
  const routeLocale = outputPath.split(/[/.]/)[0];
  const expectedLanguage = routeLanguages[routeLocale] ?? "en";
  requireMatch(html, /<title>[^<]+<\/title>/, `${outputPath}: missing title`);
  requireMatch(
    html,
    /<meta name="description" content="[^"]+"/,
    `${outputPath}: missing description`,
  );
  requireMatch(
    html,
    new RegExp(`<html lang="${expectedLanguage}">`, "i"),
    `${outputPath}: expected html lang ${expectedLanguage}`,
  );
  const keywordContent = html.match(
    /<meta name="keywords" content="([^"]+)"/,
  )?.[1];
  if (!keywordContent) {
    failures.push(`${outputPath}: missing keywords`);
  } else {
    const keywords = keywordContent
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const uniqueKeywords = new Set(
      keywords.map((keyword) => keyword.normalize("NFKC").toLowerCase()),
    );
    if (uniqueKeywords.size < 12) {
      failures.push(
        `${outputPath}: only ${uniqueKeywords.size} unique keywords, expected at least 12`,
      );
    }
    if (uniqueKeywords.size > 64) {
      failures.push(
        `${outputPath}: ${uniqueKeywords.size} unique keywords exceeds the 64-keyword budget`,
      );
    }
    if (
      ![...uniqueKeywords].some((keyword) => /\p{Script=Han}/u.test(keyword))
    ) {
      failures.push(`${outputPath}: keywords have no Chinese search term`);
    }
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== expectedCanonical) {
    failures.push(
      `${outputPath}: canonical is ${canonical ?? "missing"}, expected ${expectedCanonical}`,
    );
  } else {
    canonicalUrls.add(normalizeUrl(canonical));
  }
  if (/noindex/i.test(html)) {
    failures.push(`${outputPath}: unexpectedly noindex`);
  }
  if (/pages\.dev|www\.codexpet\.top/.test(html)) {
    failures.push(
      `${outputPath}: contains a non-canonical production hostname`,
    );
  }
}

const htmlFiles = await findHtmlFiles(outDir);
const outputFiles = await readdir(outDir);
if (outputFiles.includes("_worker.js")) {
  failures.push(
    "_worker.js: static Pages deployments must not invoke a Function for every asset",
  );
}
const statsSnapshot = JSON.parse(
  await readFile(join(outDir, "stats.json"), "utf8"),
);
if (
  !statsSnapshot ||
  typeof statsSnapshot.generatedAt !== "number" ||
  !statsSnapshot.pets ||
  typeof statsSnapshot.pets !== "object" ||
  Array.isArray(statsSnapshot.pets)
) {
  failures.push("stats.json: invalid static statistics snapshot");
}
await Promise.all(
  htmlFiles.map(async (filePath) => {
    checkPage(filePath, await readFile(filePath, "utf8"));
  }),
);

const home = await readFile(join(outDir, "index.html"), "utf8");
for (const required of [
  "free Codex pet gallery and community",
  "Your free community",
  "Browse and install",
  "/request",
]) {
  if (!home.includes(required)) {
    failures.push(`index.html: missing community gallery signal ${required}`);
  }
}
for (const language of hreflangLocales) {
  requireMatch(
    home,
    new RegExp(`hreflang="${language}"`, "i"),
    `index.html: missing ${language} hreflang`,
  );
}

const chineseHome = await readFile(join(outDir, "zh.html"), "utf8");
for (const required of [
  "Codex 小宠物画廊：免费下载、安装与社区制作申请",
  "免费的 Codex",
  "/zh/request",
]) {
  if (!chineseHome.includes(required)) {
    failures.push(`zh.html: missing community gallery signal ${required}`);
  }
}

const rankings = await readFile(join(outDir, "rankings.html"), "utf8");
for (const required of [
  "Codex pet rankings / Codex 宠物排行榜",
  "热门 Codex 宠物",
  "Codex 宠物安装排行",
]) {
  if (!rankings.includes(required)) {
    failures.push(
      `rankings.html: missing bilingual ranking signal ${required}`,
    );
  }
}

const salaryCat = await readFile(
  join(outDir, "pets", "salary-cat--zuochunjie.html"),
  "utf8",
);
for (const required of [
  "月薪喵 Codex 小宠物",
  "月薪喵 Codex 宠物下载",
  "动物伙伴 Codex 宠物",
]) {
  if (!salaryCat.includes(required)) {
    failures.push(
      `salary-cat--zuochunjie.html: missing localized pet signal ${required}`,
    );
  }
}

const chineseInstall = await readFile(join(outDir, "zh/install.html"), "utf8");
for (const required of [
  "如何安装 Codex 小宠物",
  "install-pet.sh",
  "Install-CodexPet",
  "application/ld+json",
]) {
  if (!chineseInstall.includes(required)) {
    failures.push(`zh/install.html: missing ${required}`);
  }
}
for (const language of hreflangLocales) {
  requireMatch(
    chineseInstall,
    new RegExp(`hreflang="${language}"`, "i"),
    `zh/install.html: missing ${language} hreflang`,
  );
}

for (const [path, required] of [
  [
    "request.html",
    [
      "Request a Codex pet for a character you love",
      "Choose a character, upload a reference image or use a public link",
      "application/ld+json",
    ],
  ],
  [
    "zh/request.html",
    [
      "免费提交喜欢角色的 Codex 小宠物制作申请",
      "填写角色名称并上传参考图片或粘贴公开链接",
      "application/ld+json",
    ],
  ],
  [
    "ko/request.html",
    ["좋아하는 캐릭터의 Codex 펫을 요청하세요", "application/ld+json"],
  ],
  [
    "ja/request.html",
    ["好きなキャラクターの Codex ペットをリクエスト", "application/ld+json"],
  ],
  [
    "es/request.html",
    ["Pide una mascota Codex de tu personaje favorito", "application/ld+json"],
  ],
]) {
  const requestPage = await readFile(join(outDir, path), "utf8");
  for (const value of required) {
    if (!requestPage.includes(value)) {
      failures.push(`${path}: missing ${value}`);
    }
  }
  for (const language of hreflangLocales) {
    requireMatch(
      requestPage,
      new RegExp(`hreflang="${language}"`, "i"),
      `${path}: missing ${language} hreflang`,
    );
  }
}

const sitemap = await readFile(join(outDir, "sitemap.xml"), "utf8");
requireMatch(
  sitemap,
  /<loc>https:\/\/codexpet\.top\//,
  "sitemap: no canonical URLs",
);
if (/<lastmod>/.test(sitemap)) {
  failures.push(
    "sitemap: lastmod must be omitted until source dates are reliable",
  );
}
if (/pages\.dev|www\.codexpet\.top/.test(sitemap)) {
  failures.push("sitemap: contains a non-canonical production hostname");
}
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    normalizeUrl(match[1]),
  ),
);
for (const url of canonicalUrls) {
  if (!sitemapUrls.has(url)) {
    failures.push(`sitemap: missing ${url}`);
  }
}
for (const url of sitemapUrls) {
  if (!canonicalUrls.has(url)) failures.push(`sitemap: unknown URL ${url}`);
}

const robots = await readFile(join(outDir, "robots.txt"), "utf8");
requireMatch(
  robots,
  /Sitemap: https:\/\/codexpet\.top\/sitemap\.xml/,
  "robots.txt: missing canonical sitemap",
);
for (const agent of [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "PerplexityBot",
]) {
  requireMatch(
    robots,
    new RegExp(
      `^User-agent:[ \\t]*${agent}[ \\t]*\\r?$(?:(?!^User-agent:)[\\s\\S])*?^Allow:[ \\t]*/[ \\t]*\\r?$`,
      "m",
    ),
    `robots.txt: ${agent} is not explicitly allowed`,
  );
}
const llms = await readFile(join(outDir, "llms.txt"), "utf8");
for (const required of [
  `${SITE_URL}/zh/install`,
  `${SITE_URL}/request`,
  `${SITE_URL}/zh/request`,
  `${SITE_URL}/ko/install`,
  `${SITE_URL}/ko/request`,
  `${SITE_URL}/ja/install`,
  `${SITE_URL}/ja/request`,
  `${SITE_URL}/es/install`,
  `${SITE_URL}/es/request`,
  "how to install a Codex pet",
  "can the community make a missing character",
  "Opening the request is free",
  "install-pet.sh",
]) {
  if (!llms.includes(required)) failures.push(`llms.txt: missing ${required}`);
}
const indexNowKey = await readFile(join(outDir, `${INDEXNOW_KEY}.txt`), "utf8");
if (indexNowKey.trim() !== INDEXNOW_KEY) {
  failures.push("IndexNow ownership key is missing or invalid");
}

if (failures.length > 0) {
  throw new Error(`SEO validation failed:\n- ${failures.join("\n- ")}`);
}
console.log(
  `SEO validation passed for ${htmlFiles.length - 1} indexable pages.`,
);
