#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workerRoot = fileURLToPath(new URL("..", import.meta.url));
const repository = process.env.GITHUB_REPOSITORY || "legeling/awesome-codex-pet";
const token = process.env.GITHUB_TOKEN;
const target = process.argv.includes("--remote") ? "--remote" : "--local";

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runD1(sql) {
  const result = spawnSync(
    process.execPath,
    [
      resolve(workerRoot, "node_modules/wrangler/bin/wrangler.js"),
      "d1",
      "execute",
      "DB",
      target,
      "--command",
      sql,
      "--json",
    ],
    { cwd: workerRoot, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr || "Wrangler D1 command failed", {
      cause: result.error,
    });
  }
  const batches = JSON.parse(result.stdout);
  if (!Array.isArray(batches) || batches.some((batch) => !batch?.success)) {
    throw new Error("D1 returned an unsuccessful result");
  }
  return batches.flatMap((batch) => batch.results || []);
}

export function buildIssueBody(request) {
  const reference = request.reference_url || "No reference supplied yet.";
  const notes = request.notes || "Let the community maker decide.";
  return `<!-- pet-flow: request -->
<!-- manual-request-id: ${request.id} -->

> Submitted through the no-account form at codexpet.top. Runtime defaults to V2. Community production is voluntary and completion is not guaranteed.

### Character or concept

${request.character}

### Original work or franchise

${request.franchise || "Not provided"}

### Preferred primary category

Others

### Preferred pet runtime version

v2 - standard animations plus 16 look directions

### Request type

Create a new community interpretation

### Reference image

${reference}

### Visual and animation direction

${notes}

### Name language support

Let the maker decide

### Author, source, and non-commercial usage notes

Submitted without a GitHub account. Reference and attribution details should be confirmed during triage. Non-commercial use only.

### Similar pets already checked

Repository automation or a maintainer should complete the duplicate check during triage.
`;
}

async function createIssue(request) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "awesome-codex-pet-manual-request-sync",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `[Request]: ${request.character}`,
        body: buildIssueBody(request),
        labels: [
          "type: request",
          "status: triage",
          "version: v2",
          "category: other",
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub issue creation returned HTTP ${response.status}`);
  }
  return response.json();
}

function markSynced(id, issueNumber) {
  runD1(`UPDATE manual_requests
    SET status = 'synced', issue_number = ${issueNumber},
        attempts = attempts + 1, last_error = '', synced_at = ${Date.now()}
    WHERE id = ${id}`);
}

function markFailedAttempt(id, error) {
  const message = error instanceof Error ? error.message : String(error);
  runD1(`UPDATE manual_requests
    SET attempts = attempts + 1,
        status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'pending' END,
        last_error = ${sqlString(message.slice(0, 500))}
    WHERE id = ${id}`);
}

async function main() {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const pending = runD1(`SELECT id, character, franchise, reference_url, notes, locale
    FROM manual_requests
    WHERE status = 'pending' AND attempts < 5
    ORDER BY created_at ASC
    LIMIT 20`);
  for (const request of pending) {
    try {
      const issue = await createIssue(request);
      markSynced(Number(request.id), Number(issue.number));
      console.log(`Synced manual request ${request.id} to issue #${issue.number}.`);
    } catch (error) {
      markFailedAttempt(Number(request.id), error);
      console.error(`Manual request ${request.id} could not be synced.`);
    }
  }
  console.log(`Processed ${pending.length} pending manual request(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  });
}
