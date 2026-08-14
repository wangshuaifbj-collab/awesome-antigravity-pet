#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  statSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  assertPetId,
  assertSha256,
  assertWebp,
  hashBuffer,
  MAX_PET_JSON_BYTES,
  MAX_SPRITESHEET_BYTES,
  assertNoSymlink,
  prepareInstallRoot,
  replaceInstallDirectory,
} from "./install-utils.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const petsDir = join(repoRoot, "pets");

function usage() {
  console.log(`Usage:
  npm run install:pet -- <pet-slug--author-slug>
  npx awesome-codex-pet <pet-slug--author-slug>

Options:
  --codex-home <path>  Install into a custom Codex home directory
  --force              Replace an existing installation atomically
  --no-stats           Skip the anonymous install counter
  --list               List available pets
  --help               Show this help

Environment:
  CODEX_HOME                 Defaults to ~/.codex when unset
  AWESOME_CODEX_PET_NO_STATS=1  Skip the anonymous install counter`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function listPets() {
  const pets = readdirSync(petsDir)
    .filter((entry) => !entry.startsWith("."))
    .filter((entry) => lstatSync(join(petsDir, entry)).isDirectory())
    .sort();

  if (pets.length === 0) {
    console.log("No pets found.");
    return;
  }

  for (const pet of pets) {
    const metadataPath = join(petsDir, pet, "submission.json");
    if (!existsSync(metadataPath)) {
      console.log(pet);
      continue;
    }

    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    const runtimePath = join(petsDir, pet, "pet.json");
    const runtime = existsSync(runtimePath)
      ? JSON.parse(readFileSync(runtimePath, "utf8"))
      : {};
    console.log(
      `${pet} - ${metadata.name ?? pet} (v${runtime.spriteVersionNumber ?? 1})`,
    );
  }
}

function parseArgs(rawArgs) {
  let codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  let petId = null;
  let force = false;
  let noStats = process.env.AWESOME_CODEX_PET_NO_STATS === "1";
  let list = false;
  const args = [...rawArgs];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      for (const positional of args.slice(index + 1)) {
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
    if (arg === "--codex-home") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--codex-home requires a path");
      }
      codexHome = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (petId) throw new Error(`Unexpected extra argument: ${arg}`);
    petId = arg;
  }

  if (list && petId) throw new Error("--list cannot be combined with a pet id");
  return { codexHome, force, help: false, list, noStats, petId };
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
if (options.list) {
  listPets();
  process.exit(0);
}
if (!options.petId) {
  usage();
  process.exit(1);
}

try {
  assertPetId(options.petId);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const petDir = join(petsDir, options.petId);
const petJsonPath = join(petDir, "pet.json");
const spritesheetPath = join(petDir, "spritesheet.webp");
const submissionPath = join(petDir, "submission.json");

if (!existsSync(petDir)) {
  fail(
    `Pet not found: ${options.petId}\nRun with --list to see available pets.`,
  );
}
try {
  assertNoSymlink(petDir, "Pet source directory");
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

for (const requiredPath of [petJsonPath, spritesheetPath]) {
  if (!existsSync(requiredPath)) fail(`Missing required file: ${requiredPath}`);
  try {
    assertNoSymlink(requiredPath, "Pet source file");
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

let pet;
try {
  if (statSync(petJsonPath).size > MAX_PET_JSON_BYTES) {
    throw new Error("pet.json exceeds the 64 KiB safety limit");
  }
  pet = JSON.parse(readFileSync(petJsonPath, "utf8"));
  if (pet?.id !== options.petId) {
    throw new Error("pet.json id must match the requested pet id");
  }
  assertPetId(pet.id);
  if (pet.spritesheetPath !== "spritesheet.webp") {
    throw new Error("pet.json spritesheetPath must be spritesheet.webp");
  }

  const spritesheet = readFileSync(spritesheetPath);
  if (spritesheet.length > MAX_SPRITESHEET_BYTES) {
    throw new Error("spritesheet.webp exceeds the 5 MB safety limit");
  }
  assertWebp(spritesheet);

  if (existsSync(submissionPath)) {
    const submission = JSON.parse(readFileSync(submissionPath, "utf8"));
    if (submission.spritesheet_sha256) {
      const expected = assertSha256(
        submission.spritesheet_sha256,
        "submission.json spritesheet_sha256",
      );
      if (hashBuffer(spritesheet) !== expected) {
        throw new Error("spritesheet.webp does not match submission.json hash");
      }
    }
  }
} catch (error) {
  fail(
    `Invalid pet package: ${error instanceof Error ? error.message : String(error)}`,
  );
}

const petsRoot = join(options.codexHome, "pets");
let stageDir;
try {
  prepareInstallRoot(petsRoot);
  stageDir = mkdtempSync(join(petsRoot, `.${options.petId}.tmp-`));
  copyFileSync(petJsonPath, join(stageDir, "pet.json"));
  copyFileSync(spritesheetPath, join(stageDir, "spritesheet.webp"));
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
