#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { serializeStatsRows } from "../src/index.js";

const workerRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = resolve(workerRoot, "..");
const defaultOutput = resolve(repoRoot, "web/public/stats.json");

function parseArgs(args) {
  const target = args.includes("--remote") ? "--remote" : "--local";
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 ? args[outputIndex + 1] : defaultOutput;
  const persistIndex = args.indexOf("--persist-to");
  const persistTo = persistIndex >= 0 ? args[persistIndex + 1] : null;
  if (!output) {
    throw new Error("--output requires a file path");
  }
  if (persistIndex >= 0 && !persistTo) {
    throw new Error("--persist-to requires a directory");
  }
  return {
    target,
    output: resolve(process.cwd(), output),
    persistTo: persistTo ? resolve(process.cwd(), persistTo) : null,
  };
}

function runQuery(target, sql, persistTo) {
  const result = spawnSync(
    process.execPath,
    [
      resolve(workerRoot, "node_modules/wrangler/bin/wrangler.js"),
      "d1",
      "execute",
      "DB",
      target,
      ...(persistTo ? ["--persist-to", persistTo] : []),
      "--command",
      sql,
      "--json",
    ],
    {
      cwd: workerRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "inherit"],
      timeout: 60_000,
    },
  );
  if (result.error) {
    throw new Error("Failed to run Wrangler D1 export", {
      cause: result.error,
    });
  }
  if (result.status !== 0) {
    throw new Error(`Wrangler exited with status ${result.status}`);
  }

  const batches = JSON.parse(result.stdout);
  if (!Array.isArray(batches) || batches.some((batch) => !batch?.success)) {
    throw new Error("D1 returned an invalid or unsuccessful export result");
  }
  return batches.flatMap((batch) =>
    Array.isArray(batch.results) ? batch.results : [],
  );
}

async function queryRows(target, timestamp, persistTo) {
  const cutoffDay = new Date(timestamp - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const likesCutoff = timestamp - 7 * 24 * 60 * 60 * 1000;
  const petSql = `WITH recent AS (
    SELECT slug, SUM(installs) AS installs_7d
    FROM pet_daily
    WHERE day >= '${cutoffDay}'
    GROUP BY slug
  ),
  recent_likes AS (
    SELECT slug, COUNT(*) AS likes_7d
    FROM pet_likes
    WHERE created_at >= ${likesCutoff}
    GROUP BY slug
  )
  SELECT
    stats.slug,
    stats.installs,
    stats.likes,
    stats.updated_at,
    COALESCE(recent.installs_7d, 0) AS installs_7d,
    COALESCE(recent_likes.likes_7d, 0) AS likes_7d
  FROM pet_stats AS stats
  LEFT JOIN recent ON recent.slug = stats.slug
  LEFT JOIN recent_likes ON recent_likes.slug = stats.slug
  WHERE stats.active = 1
  ORDER BY stats.slug ASC`;
  const creatorSql = `SELECT
    slug,
    followers
  FROM creator_stats
  WHERE active = 1
  ORDER BY slug ASC`;
  const creatorTableSql = `SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND name = 'creator_stats'`;
  const requestSql = `SELECT
    issue_number,
    supporters,
    updated_at
  FROM request_stats
  WHERE active = 1
  ORDER BY issue_number ASC`;
  const requestTableSql = `SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND name = 'request_stats'`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const creatorTable = runQuery(target, creatorTableSql, persistTo);
      const requestTable = runQuery(target, requestTableSql, persistTo);
      return {
        pets: runQuery(target, petSql, persistTo),
        creators:
          creatorTable.length > 0
            ? runQuery(target, creatorSql, persistTo)
            : [],
        requests:
          requestTable.length > 0
            ? runQuery(target, requestSql, persistTo)
            : [],
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await delay(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const timestamp = Date.now();
  const rows = await queryRows(options.target, timestamp, options.persistTo);
  const payload = serializeStatsRows(
    rows.pets,
    timestamp,
    rows.creators,
    rows.requests,
  );
  const temporaryOutput = `${options.output}.${process.pid}.tmp`;

  mkdirSync(dirname(options.output), { recursive: true });
  try {
    writeFileSync(temporaryOutput, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    renameSync(temporaryOutput, options.output);
  } finally {
    rmSync(temporaryOutput, { force: true });
  }

  console.log(
    `Exported ${rows.pets.length} pet, ${rows.creators.length} creator, and ${rows.requests.length} request statistics to ${options.output} (${options.target.slice(2)}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
