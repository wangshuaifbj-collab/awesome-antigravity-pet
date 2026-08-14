import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repository =
  process.env.GITHUB_REPOSITORY ?? "legeling/awesome-codex-pet";
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(repoRoot, "assets", "community", "star-history.svg");
const apiBase = "https://api.github.com";
const maxPages = 100;

if (!token) {
  throw new Error(
    "Set GITHUB_TOKEN or GH_TOKEN to a token that can read this repository.",
  );
}

async function githubJson(path) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: "application/vnd.github.star+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "awesome-codex-pet-star-history",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed (${response.status} ${response.statusText}) for ${path}`,
    );
  }

  return response.json();
}

async function loadStargazers() {
  const stargazers = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await githubJson(
      `/repos/${repository}/stargazers?per_page=100&page=${page}`,
    );

    stargazers.push(...batch);
    if (batch.length < 100) return stargazers;
  }

  throw new Error(
    `Stargazer history exceeded the ${maxPages}-page safety cap.`,
  );
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function niceMaximum(value) {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const multiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

function shortDate(timestamp) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function longDate(timestamp) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function makeHistory(stargazers) {
  const countsByDay = new Map();

  for (const entry of stargazers) {
    if (!entry.starred_at) continue;
    const day = entry.starred_at.slice(0, 10);
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  let total = 0;
  return [...countsByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => {
      total += count;
      return {
        timestamp: Date.parse(`${day}T00:00:00Z`),
        total,
      };
    });
}

function renderSvg(history) {
  const width = 1000;
  const height = 440;
  const plot = { left: 72, top: 82, right: 34, bottom: 62 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const firstTimestamp = history[0]?.timestamp ?? Date.now();
  const lastTimestamp =
    history.at(-1)?.timestamp ?? firstTimestamp + 86_400_000;
  const timeSpan = Math.max(lastTimestamp - firstTimestamp, 86_400_000);
  const starCount = history.at(-1)?.total ?? 0;
  const yMaximum = niceMaximum(starCount);
  const x = (timestamp) =>
    plot.left + ((timestamp - firstTimestamp) / timeSpan) * plotWidth;
  const y = (value) => plot.top + plotHeight - (value / yMaximum) * plotHeight;

  const chartPoints =
    history.length > 0
      ? [
          `${plot.left},${plot.top + plotHeight}`,
          ...history.map(
            (point) =>
              `${x(point.timestamp).toFixed(2)},${y(point.total).toFixed(2)}`,
          ),
        ]
      : [`${plot.left},${plot.top + plotHeight}`];
  const linePoints = chartPoints.join(" ");
  const areaPoints = [
    ...chartPoints,
    `${x(lastTimestamp).toFixed(2)},${plot.top + plotHeight}`,
  ].join(" ");
  const yTicks = Array.from({ length: 6 }, (_, index) => {
    const value = (yMaximum / 5) * index;
    const position = y(value);
    return `
      <line x1="${plot.left}" y1="${position}" x2="${width - plot.right}" y2="${position}" stroke="#e5e7eb" stroke-width="1" />
      <text x="${plot.left - 14}" y="${position + 5}" text-anchor="end" class="axis">${Math.round(value)}</text>`;
  }).join("");
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const timestamp = firstTimestamp + (timeSpan * index) / 4;
    const position = x(timestamp);
    const anchor = index === 0 ? "start" : index === 4 ? "end" : "middle";
    return `<text x="${position}" y="${height - 25}" text-anchor="${anchor}" class="axis">${xml(shortDate(timestamp))}</text>`;
  }).join("");
  const dateRange =
    history.length > 0
      ? `${longDate(firstTimestamp)} – ${longDate(lastTimestamp)}`
      : "No stars recorded yet";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Awesome Codex Pet GitHub star history</title>
  <desc id="description">${xml(`${starCount} stars from ${dateRange}`)}</desc>
  <defs>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.02" />
    </linearGradient>
    <style>
      .axis { fill: #6b7280; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .title { fill: #111827; font: 700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .subtitle { fill: #6b7280; font: 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .count { fill: #059669; font: 700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    </style>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="#ffffff" stroke="#e5e7eb" />
  <text x="${plot.left}" y="39" class="title">GitHub Star History</text>
  <text x="${plot.left}" y="64" class="subtitle">${xml(repository)} · ${xml(dateRange)}</text>
  <text x="${width - plot.right}" y="45" text-anchor="end" class="count">${starCount} stars</text>
  ${yTicks}
  ${xTicks}
  <polygon points="${areaPoints}" fill="url(#area)" />
  <polyline points="${linePoints}" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  ${
    history.length > 0
      ? `<circle cx="${x(lastTimestamp).toFixed(2)}" cy="${y(starCount).toFixed(2)}" r="6" fill="#ffffff" stroke="#10b981" stroke-width="4" />`
      : ""
  }
</svg>
`;
}

const history = makeHistory(await loadStargazers());
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderSvg(history), "utf8");
console.log(
  `generated ${outputPath} from ${history.at(-1)?.total ?? 0} stargazer event(s)`,
);
