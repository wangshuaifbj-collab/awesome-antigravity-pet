#!/usr/bin/env node

const apiBase = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME || "codexpet.top";
const ruleDescription = "Awesome Codex Pet static JSON catalogs";
const catalogPaths = [
  "/categories.json",
  "/collections.json",
  "/gallery.json",
  "/pets.json",
  "/requests.json",
  "/stats.json",
];

if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required");

async function cloudflare(path, init = {}, allowedStatuses = [200]) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!allowedStatuses.includes(response.status)) {
    const detail = (await response.text()).slice(0, 1_000);
    throw new Error(
      `Cloudflare API ${init.method || "GET"} ${path} returned HTTP ${response.status}: ${detail}`,
    );
  }
  if (response.status === 404) return null;
  const payload = await response.json();
  if (!payload.success) throw new Error(`Cloudflare API rejected ${path}`);
  return payload.result;
}

async function resolveZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID;
  const query = new URLSearchParams({ name: zoneName });
  if (accountId) query.set("account.id", accountId);
  const zones = await cloudflare(`/zones?${query}`);
  if (!Array.isArray(zones) || zones.length !== 1) {
    throw new Error(
      `Unable to resolve exactly one Cloudflare zone for ${zoneName}`,
    );
  }
  return zones[0].id;
}

function cacheRule() {
  const hosts = [zoneName, `www.${zoneName}`]
    .map((host) => `"${host}"`)
    .join(" ");
  const paths = catalogPaths.map((path) => `"${path}"`).join(" ");
  return {
    description: ruleDescription,
    expression: `(http.request.method eq "GET" and http.host in {${hosts}} and http.request.uri.path in {${paths}})`,
    action: "set_cache_settings",
    action_parameters: { cache: true },
    enabled: true,
  };
}

const zoneId = await resolveZoneId();
const entrypointPath = `/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`;
const ruleset = await cloudflare(entrypointPath, {}, [200, 404]);
const rule = cacheRule();

if (!ruleset) {
  await cloudflare(`/zones/${zoneId}/rulesets`, {
    method: "POST",
    body: JSON.stringify({
      name: "Awesome Codex Pet cache rules",
      description: "Repository-managed cache rules for codexpet.top",
      kind: "zone",
      phase: "http_request_cache_settings",
      rules: [rule],
    }),
  });
  console.log(`Created ${ruleDescription}.`);
} else {
  const existing = ruleset.rules?.find(
    (candidate) => candidate.description === ruleDescription,
  );
  if (existing) {
    await cloudflare(
      `/zones/${zoneId}/rulesets/${ruleset.id}/rules/${existing.id}`,
      { method: "PATCH", body: JSON.stringify(rule) },
    );
    console.log(`Updated ${ruleDescription}.`);
  } else {
    await cloudflare(`/zones/${zoneId}/rulesets/${ruleset.id}/rules`, {
      method: "POST",
      body: JSON.stringify(rule),
    });
    console.log(`Added ${ruleDescription}.`);
  }
}
