import { rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(repoRoot, "requests.json");
const temporaryPath = `${outputPath}.tmp`;
const repository = process.env.GITHUB_REPOSITORY || "legeling/awesome-codex-pet";
const pageLimit = 5;
const pageSize = 100;
const fetchAttempts = 3;

const fieldAliases = new Map([
  ["character or concept", "character"],
  ["角色或概念", "character"],
  ["original work or franchise", "franchise"],
  ["作品或系列", "franchise"],
  ["preferred primary category", "category"],
  ["首选主分类", "category"],
  ["preferred pet runtime version", "version"],
  ["首选宠物运行时版本", "version"],
  ["request type", "requestType"],
  ["申请类型", "requestType"],
  ["reference availability", "referenceStatus"],
  ["参考资料情况", "referenceStatus"],
  ["reference image", "references"],
  ["public reference image", "references"],
  ["参考图片", "references"],
  ["references", "references"],
  ["参考资料", "references"],
  ["visual and animation direction", "visualDirection"],
  ["视觉与动画方向", "visualDirection"],
  ["name language support", "nameLanguages"],
  ["名称语言支持", "nameLanguages"],
  ["author, source, and non-commercial notes", "attribution"],
  ["author, source, and non-commercial usage notes", "attribution"],
  ["作者、来源与非商业说明", "attribution"],
  ["similar pets checked", "duplicateCheck"],
  ["similar pets already checked", "duplicateCheck"],
  ["已检查相似宠物", "duplicateCheck"],
]);

function cleanField(value, maxLength = 12_000) {
  const normalized = String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 — $2")
    .replace(/^[-*]\s+\[[ xX]\]\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/_{1,3}|`{1,3}|\*{1,3}/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter(
      (line) =>
        !/user-attachments\/assets|<img\b|\bsrc\s*=|^:?\/\/github\.com\//i.test(
          line,
        ),
    )
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (/^no response$/i.test(normalized) || normalized === "无响应") return "";
  return normalized.slice(0, maxLength);
}

function normalizedHeading(value) {
  return value
    .toLowerCase()
    .replace(/[：:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIssueForm(body) {
  const fields = {};
  const headings = [];
  const headingPattern = /^#{2,4}\s+(.+?)\s*$/gm;
  let match;

  while ((match = headingPattern.exec(body))) {
    headings.push({
      title: match[1],
      contentStart: headingPattern.lastIndex,
      headingStart: match.index,
    });
  }

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const fieldName = fieldAliases.get(normalizedHeading(heading.title));
    if (!fieldName) continue;
    const contentEnd = headings[index + 1]?.headingStart ?? body.length;
    fields[fieldName] = cleanField(
      body.slice(heading.contentStart, contentEnd),
    );
  }

  return fields;
}

function extractUrls(value) {
  const matches = String(value ?? "").match(/https?:\/\/[^\s<>"']+/g) ?? [];
  return [
    ...new Set(
      matches.map((url) =>
        url
          .replace(/[.,;:!?]+$/, "")
          .replace(/\]$/, "")
          .replace(/\)$/, (suffix) => {
            const opens = (url.match(/\(/g) ?? []).length;
            const closes = (url.match(/\)/g) ?? []).length;
            return closes > opens ? "" : suffix;
          }),
      ),
    ),
  ];
}

function extractReferenceImages(body) {
  const htmlSources = [...body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter(Boolean);
  const markdownSources = [
    ...body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/gi),
  ].map((match) => match[1]);
  const attachmentSources =
    body.match(
      /https:\/\/github\.com\/user-attachments\/assets\/[A-Za-z0-9-]+/g,
    ) ?? [];
  const directSources =
    body.match(
      /https:\/\/(?:raw\.githubusercontent\.com|github\.com\/[^/\s]+\/[^/\s]+\/raw\/)[^\s<>"')]+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\s<>"')]*)?/gi,
    ) ?? [];
  const publicImageSources = extractUrls(body).filter((url) => {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === "https:" &&
        /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(parsed.pathname)
      );
    } catch {
      return false;
    }
  });

  return [
    ...new Set([
      ...htmlSources,
      ...markdownSources,
      ...attachmentSources,
      ...directSources,
      ...publicImageSources,
    ]),
  ].filter((url) => {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === "https:" &&
        (new Set([
          "github.com",
          "raw.githubusercontent.com",
          "user-images.githubusercontent.com",
        ]).has(parsed.hostname) ||
          /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(parsed.pathname))
      );
    } catch {
      return false;
    }
  });
}

function referenceThumbnailUrl(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(
      /^\/uploads\/reference\/references\/([a-f0-9]{64})\.(?:png|jpe?g|webp)$/i,
    );
    if (parsed.hostname !== "api.codexpet.top" || !match) return null;
    parsed.pathname = `/uploads/reference/thumbnails/${match[1].toLowerCase()}.webp`;
    parsed.search = "";
    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

function labelNames(issue) {
  return issue.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function labelValue(labels, prefix) {
  return labels
    .find((label) => label.toLowerCase().startsWith(`${prefix}:`))
    ?.slice(prefix.length + 1)
    .trim();
}

function requestStatus(issue, labels) {
  const explicit = labelValue(labels, "status")?.toLowerCase();
  if (
    issue.state === "closed" &&
    !/(declined|blocked|wontfix|invalid)/.test(explicit || "")
  ) {
    return "completed";
  }
  if (explicit) {
    if (/(complete|done|published|merged)/.test(explicit)) return "completed";
    if (/(review|qa)/.test(explicit)) return "review";
    if (/(progress|claimed|making|assigned)/.test(explicit))
      return "in-progress";
    if (/(declined|blocked|wontfix|invalid)/.test(explicit)) return "declined";
    if (/(ready|open|approved)/.test(explicit)) return "open";
    if (/(triage|pending|needs)/.test(explicit)) return "triage";
  }
  return issue.state === "closed" ? "completed" : "open";
}

function reactionCount(issue) {
  const reactions = issue.reactions;
  if (!reactions || typeof reactions !== "object") return 0;
  return [
    "+1",
    "heart",
    "hooray",
    "rocket",
    "eyes",
  ].reduce((total, key) => total + (Number(reactions[key]) || 0), 0);
}

function normalizeCategory(value, labels) {
  const labelCategory = labelValue(labels, "category");
  const source = labelCategory || value || "other";
  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeVersion(value, labels) {
  const source = labelValue(labels, "version") || value || "";
  const match = source.match(/\bv?([12])\b/i);
  return match ? `v${match[1]}` : "";
}

function toCatalogItem(issue) {
  const body = String(issue.body ?? "");
  const fields = parseIssueForm(body);
  const labels = labelNames(issue);
  const referenceImages = extractReferenceImages(body);
  const referenceThumbnails = referenceImages
    .map(referenceThumbnailUrl)
    .filter(Boolean);
  const characterDetails =
    fields.character ||
    issue.title.replace(/^\s*\[request\]\s*:?\s*/i, "").trim() ||
    `Request #${issue.number}`;
  const issueTitle = issue.title
    .replace(/^\s*\[request\]\s*:?\s*/i, "")
    .trim();
  const characterSummary =
    (issueTitle || characterDetails)
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean)
      ?.replace(/[。；;:]$/, "") || `Request #${issue.number}`;
  const references = fields.references || "";

  return {
    number: issue.number,
    character: cleanField(characterSummary, 160),
    characterDetails: cleanField(characterDetails, 2_000),
    franchise: cleanField(fields.franchise, 200),
    category: normalizeCategory(fields.category, labels),
    version: normalizeVersion(fields.version, labels),
    requestType: cleanField(fields.requestType, 300),
    referenceStatus: cleanField(fields.referenceStatus, 500),
    references,
    referenceUrls: extractUrls(references),
    referenceImages,
    referenceThumbnails,
    visualDirection: fields.visualDirection || "",
    nameLanguages: fields.nameLanguages || "",
    attribution: fields.attribution || "",
    duplicateCheck: fields.duplicateCheck || "",
    state: issue.state,
    status: requestStatus(issue, labels),
    labels,
    author: {
      login: issue.user?.login || "unknown",
      avatarUrl: issue.user?.avatar_url || "",
      url: issue.user?.html_url || "",
    },
    assignees: (issue.assignees ?? []).map((assignee) => ({
      login: assignee.login,
      avatarUrl: assignee.avatar_url,
      url: assignee.html_url,
    })),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    comments: Number(issue.comments) || 0,
    reactions: reactionCount(issue),
    githubUrl: issue.html_url,
  };
}

async function fetchIssues() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "awesome-codex-pet-request-catalog",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const issues = [];
  for (let page = 1; page <= pageLimit; page += 1) {
    const url = new URL(`https://api.github.com/repos/${repository}/issues`);
    url.searchParams.set("state", "all");
    url.searchParams.set("labels", "type: request");
    url.searchParams.set("per_page", String(pageSize));
    url.searchParams.set("page", String(page));

    let response;
    let lastError;
    for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
      try {
        response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(30_000),
        });
        break;
      } catch (error) {
        lastError = error;
        if (attempt < fetchAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * 2 ** (attempt - 1)),
          );
        }
      }
    }
    if (!response) {
      throw new Error(
        `GitHub request catalog fetch failed after ${fetchAttempts} attempts`,
        { cause: lastError },
      );
    }
    if (!response.ok) {
      throw new Error(
        `GitHub request catalog fetch failed: HTTP ${response.status} ${response.statusText}`,
      );
    }
    const pageItems = await response.json();
    if (!Array.isArray(pageItems)) {
      throw new Error("GitHub request catalog response was not an array");
    }
    issues.push(...pageItems.filter((issue) => !issue.pull_request));
    if (pageItems.length < pageSize) break;
  }
  return issues;
}

const statusOrder = new Map([
  ["in-progress", 0],
  ["review", 1],
  ["open", 2],
  ["triage", 3],
  ["completed", 4],
  ["declined", 5],
]);

const catalog = (await fetchIssues())
  .map(toCatalogItem)
  .sort((left, right) => {
    const stateDelta = Number(left.state === "closed") - Number(right.state === "closed");
    if (stateDelta !== 0) return stateDelta;
    const statusDelta =
      (statusOrder.get(left.status) ?? 99) -
      (statusOrder.get(right.status) ?? 99);
    if (statusDelta !== 0) return statusDelta;
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });

const formattedCatalog = await format(JSON.stringify(catalog), {
  parser: "json",
});
await writeFile(temporaryPath, formattedCatalog, "utf8");
await rename(temporaryPath, outputPath);
console.log(`Wrote ${catalog.length} request(s) to requests.json`);
