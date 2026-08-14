#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  assertPetId,
  assertSha256,
  assertWebp,
  hashBuffer,
  MAX_PET_JSON_BYTES,
  MAX_SPRITESHEET_BYTES,
  prepareInstallRoot,
  replaceInstallDirectory,
} from "./install-utils.mjs";

const DEFAULT_RAW_BASE =
  "https://raw.githubusercontent.com/legeling/awesome-codex-pet/main";
const MAX_MANIFEST_BYTES = 1_000_000;

function usage() {
  console.log(`Usage:
  npx --yes awesome-codex-pet@<version> <pet-slug--author-slug>

Options:
  --codex-home <path>  Install into a custom Codex home directory
  --raw-base <url>     Use an explicit HTTPS repository ref
  --force              Replace an existing installation atomically
  --no-stats           Skip the anonymous install counter
  --list               List available pets
  --help               Show this help

Environment:
  CODEX_HOME                    Defaults to ~/.codex when unset
  AWESOME_CODEX_PET_RAW_BASE    Override the repository ref URL
  AWESOME_CODEX_PET_NO_STATS=1  Skip the anonymous install counter`);
}

function normalizeRawBase(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid raw base URL: ${value}`);
  }
  if (url.protocol !== "https:") {
    throw new Error("The raw base URL must use HTTPS");
  }
  return value.replace(/\/+$/, "");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(rawArgs) {
  let codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  let rawBase = normalizeRawBase(
    process.env.AWESOME_CODEX_PET_RAW_BASE || DEFAULT_RAW_BASE,
  );
  let petId = null;
  let force = false;
  let noStats = process.env.AWESOME_CODEX_PET_NO_STATS === "1";
  let list = false;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--") {
      for (const positional of rawArgs.slice(index + 1)) {
        if (petId) throw new Error(`Unexpected extra argument: ${positional}`);
        petId = positional;
      }
      break;
    }
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--list") {
      list = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--no-stats") {
      noStats = true;
      continue;
    }
    if (arg === "--codex-home" || arg === "--raw-base") {
      const value = rawArgs[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      if (arg === "--codex-home") codexHome = value;
      else rawBase = normalizeRawBase(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    if (petId) throw new Error(`Unexpected extra argument: ${arg}`);
    petId = arg;
  }

  if (list && petId) throw new Error("--list cannot be combined with a pet id");
  return { codexHome, force, help: false, list, noStats, petId, rawBase };
}

async function fetchBytes(url, maxBytes) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/octet-stream" },
    });
    if (!response.ok)
      throw new Error(`Download failed (${response.status}): ${url}`);
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(
        `Downloaded file exceeds the ${maxBytes}-byte safety limit`,
      );
    }
    if (!response.body) throw new Error(`Download returned no body: ${url}`);
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(
          `Downloaded file exceeds the ${maxBytes}-byte safety limit`,
        );
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, totalBytes);
  } finally {
    clearTimeout(timeout);
  }
}

async function readManifest(rawBase) {
  const bytes = await fetchBytes(
    `${rawBase}/install-manifest.json`,
    MAX_MANIFEST_BYTES,
  );
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Invalid install manifest: ${error.message}`);
  }
  if (
    manifest?.schemaVersion !== 1 ||
    typeof manifest.pets !== "object" ||
    manifest.pets === null
  ) {
    throw new Error("Invalid install manifest schema");
  }
  return manifest;
}

function validateRecord(record, petId) {
  if (!record || typeof record !== "object") {
    throw new Error(`Pet not found in install manifest: ${petId}`);
  }
  return {
    petJsonSha256: assertSha256(record.petJsonSha256, `${petId} pet.json hash`),
    petJsonBytes: Number(record.petJsonBytes),
    spritesheetSha256: assertSha256(
      record.spritesheetSha256,
      `${petId} spritesheet hash`,
    ),
    spritesheetBytes: Number(record.spritesheetBytes),
    name: record.name || petId,
    spriteVersionNumber: record.spriteVersionNumber ?? 1,
  };
}

function validateSize(actual, expected, label) {
  if (!Number.isSafeInteger(expected) || expected < 1 || actual !== expected) {
    throw new Error(`${label} size does not match the install manifest`);
  }
}

async function reportInstall(petId, noStats) {
  if (noStats) return;
  const statsApi =
    process.env.AWESOME_CODEX_PET_STATS_API || "https://api.codexpet.top";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(
      `${statsApi.replace(/\/$/, "")}/track/install?slug=${encodeURIComponent(petId)}`,
      {
        method: "POST",
        headers: { "X-Event-ID": randomUUID() },
        signal: controller.signal,
      },
    ).finally(() => clearTimeout(timeout));
  } catch (error) {
    console.warn(
      "Installed successfully, but anonymous install statistics could not be reported.",
      error instanceof Error ? error.message : String(error),
    );
  }
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (options.help) {
  usage();
  process.exit(0);
}

if (!options.list) {
  if (!options.petId) {
    usage();
    process.exit(1);
  }
  try {
    assertPetId(options.petId);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

let manifest;
try {
  manifest = await readManifest(options.rawBase);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (options.list) {
  for (const [petId, record] of Object.entries(manifest.pets).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    console.log(
      `${petId} - ${record.name ?? petId} (v${record.spriteVersionNumber ?? 1})`,
    );
  }
  process.exit(0);
}

let record;
try {
  record = validateRecord(manifest.pets[options.petId], options.petId);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

let petJsonBytes;
let spritesheetBytes;
try {
  petJsonBytes = await fetchBytes(
    `${options.rawBase}/pets/${options.petId}/pet.json`,
    MAX_PET_JSON_BYTES,
  );
  spritesheetBytes = await fetchBytes(
    `${options.rawBase}/pets/${options.petId}/spritesheet.webp`,
    MAX_SPRITESHEET_BYTES,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

try {
  validateSize(petJsonBytes.length, record.petJsonBytes, "pet.json");
  validateSize(
    spritesheetBytes.length,
    record.spritesheetBytes,
    "spritesheet.webp",
  );
  if (hashBuffer(petJsonBytes) !== record.petJsonSha256) {
    throw new Error("pet.json failed SHA-256 verification");
  }
  if (hashBuffer(spritesheetBytes) !== record.spritesheetSha256) {
    throw new Error("spritesheet.webp failed SHA-256 verification");
  }
  assertWebp(spritesheetBytes);

  const pet = JSON.parse(petJsonBytes.toString("utf8"));
  if (pet?.id !== options.petId) {
    throw new Error("pet.json id does not match the requested pet id");
  }
  if (pet.spritesheetPath !== "spritesheet.webp") {
    throw new Error("pet.json spritesheetPath must be spritesheet.webp");
  }
} catch (error) {
  fail(`Invalid downloaded pet package: ${error.message}`);
}

const petsRoot = join(options.codexHome, "pets");
let stageDir;
try {
  prepareInstallRoot(petsRoot);
  stageDir = mkdtempSync(join(petsRoot, `.${options.petId}.tmp-`));
  writeFileSync(join(stageDir, "pet.json"), petJsonBytes);
  writeFileSync(join(stageDir, "spritesheet.webp"), spritesheetBytes);
  const targetDir = replaceInstallDirectory({
    force: options.force,
    petId: options.petId,
    petsRoot,
    stageDir,
  });
  stageDir = null;
  console.log(
    `${options.force ? "Updated" : "Installed"} ${options.petId} to ${targetDir}`,
  );
  await reportInstall(options.petId, options.noStats);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  if (stageDir) rmSync(stageDir, { force: true, recursive: true });
}
