#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WIDGET_NAME = "awesome-codex-pet-requests";
const workerRoot = fileURLToPath(new URL("..", import.meta.url));
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken =
  process.env.TURNSTILE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const target = process.argv.includes("--remote") ? "--remote" : "--local";

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runWrangler(args, input) {
  const result = spawnSync(
    process.execPath,
    [resolve(workerRoot, "node_modules/wrangler/bin/wrangler.js"), ...args],
    { cwd: workerRoot, encoding: "utf8", input, maxBuffer: 4 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0) {
    throw new Error("Wrangler command failed", { cause: result.error });
  }
  return result.stdout;
}

function runD1(sql) {
  const output = runWrangler([
    "d1",
    "execute",
    "DB",
    target,
    "--command",
    sql,
    "--json",
  ]);
  const batches = JSON.parse(output);
  if (!Array.isArray(batches) || batches.some((batch) => !batch?.success)) {
    throw new Error("D1 returned an unsuccessful result");
  }
  return batches.flatMap((batch) => batch.results || []);
}

async function cloudflare(path, options = {}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    },
  );
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(`Cloudflare Turnstile API returned HTTP ${response.status}`);
  }
  return payload.result;
}

async function findOrCreateWidget() {
  const widgets = await cloudflare(
    `/challenges/widgets?filter=${encodeURIComponent(`name:${WIDGET_NAME}`)}&per_page=100`,
  );
  const existing = widgets.find((widget) => widget.name === WIDGET_NAME);
  if (existing) return { widget: existing, secret: "" };
  const widget = await cloudflare("/challenges/widgets", {
    method: "POST",
    body: JSON.stringify({
      name: WIDGET_NAME,
      domains: ["codexpet.top", "www.codexpet.top"],
      mode: "managed",
    }),
  });
  return { widget, secret: widget.secret };
}

function workerHasSecret(secretName) {
  const output = runWrangler(["secret", "list"]);
  return output.includes(`"name": "${secretName}"`);
}

async function ensureSecret(sitekey, initialSecret) {
  const configured = runD1(
    "SELECT config_value FROM app_config WHERE config_key = 'turnstile_secret_sitekey'",
  )[0]?.config_value;
  if (configured === sitekey && workerHasSecret("TURNSTILE_SECRET_KEY")) return;
  const secret =
    initialSecret ||
    (await cloudflare(`/challenges/widgets/${sitekey}/rotate_secret`, {
      method: "POST",
      body: JSON.stringify({ invalidate_immediately: false }),
    })).secret;
  runWrangler(["secret", "put", "TURNSTILE_SECRET_KEY"], `${secret}\n`);
}

async function main() {
  const existingSiteKey = runD1(
    "SELECT config_value FROM app_config WHERE config_key = 'turnstile_site_key'",
  )[0]?.config_value;
  if (existingSiteKey) {
    if (workerHasSecret("TURNSTILE_SECRET_KEY")) {
      console.log(`Turnstile already configured: ${existingSiteKey}`);
      return;
    }
    if (!accountId || !apiToken) {
      throw new Error(
        "Turnstile site key is stored but the worker secret is missing; " +
          "Cloudflare account credentials are required to restore it",
      );
    }
    const { widget, secret } = await findOrCreateWidget();
    if (widget.sitekey !== existingSiteKey) {
      throw new Error(
        `Stored site key ${existingSiteKey} does not match widget ${widget.sitekey}; ` +
          "re-run after reconciling app_config",
      );
    }
    await ensureSecret(widget.sitekey, secret);
    console.log(`Turnstile secret restored for: ${widget.sitekey}`);
    return;
  }
  if (!accountId || !apiToken) {
    throw new Error("Cloudflare account credentials are required");
  }
  const { widget, secret } = await findOrCreateWidget();
  await ensureSecret(widget.sitekey, secret);
  const timestamp = Date.now();
  const sitekey = sqlString(widget.sitekey);
  runD1(`INSERT INTO app_config (config_key, config_value, updated_at) VALUES
    ('turnstile_site_key', ${sitekey}, ${timestamp}),
    ('turnstile_secret_sitekey', ${sitekey}, ${timestamp})
    ON CONFLICT(config_key) DO UPDATE SET
      config_value = excluded.config_value,
      updated_at = excluded.updated_at`);
  console.log(`Turnstile widget ready: ${widget.sitekey}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
