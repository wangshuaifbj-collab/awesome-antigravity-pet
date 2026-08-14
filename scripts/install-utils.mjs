import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";

export const PET_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_PET_JSON_BYTES = 64 * 1024;
export const MAX_SPRITESHEET_BYTES = 5_000_000;

export function assertPetId(petId) {
  if (!PET_ID_PATTERN.test(petId)) {
    throw new Error(
      `Invalid pet id: ${petId}. Expected format: pet-slug--author-slug`,
    );
  }
}

export function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function assertSha256(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest`);
  }
  return value.toLowerCase();
}

export function assertWebp(buffer, label = "spritesheet.webp") {
  if (
    buffer.length < 12 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error(`${label} is not a WebP image`);
  }
}

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function assertNoSymlink(path, label) {
  if (!pathExists(path)) return;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) {
    throw new Error(`${label} must not be a symbolic link: ${path}`);
  }
}

function assertNoSymlinkTree(path, label) {
  assertNoSymlink(path, label);
  if (!pathExists(path)) return;

  const stat = lstatSync(path);
  if (!stat.isDirectory()) {
    throw new Error(`${label} must be a directory: ${path}`);
  }

  const pending = [path];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current)) {
      const childPath = join(current, entry);
      const childStat = lstatSync(childPath);
      if (childStat.isSymbolicLink()) {
        throw new Error(
          `Existing pet package contains a symbolic link: ${childPath}`,
        );
      }
      if (childStat.isDirectory()) {
        pending.push(childPath);
      }
    }
  }
}

function assertManagedPackage(path) {
  assertNoSymlinkTree(path, "Existing pet package");
  const allowed = new Set(["pet.json", "spritesheet.webp"]);
  for (const entry of readdirSync(path)) {
    if (!allowed.has(entry)) {
      throw new Error(
        `Existing pet package contains an unmanaged file; refusing to replace it: ${join(path, entry)}`,
      );
    }
    if (!lstatSync(join(path, entry)).isFile()) {
      throw new Error(
        `Existing pet package entry is not a file: ${join(path, entry)}`,
      );
    }
  }
}

export function prepareInstallRoot(petsRoot) {
  assertNoSymlink(petsRoot, "Codex pets directory");
  mkdirSync(petsRoot, { recursive: true });
  assertNoSymlink(petsRoot, "Codex pets directory");
  if (!lstatSync(petsRoot).isDirectory()) {
    throw new Error(`Codex pets path is not a directory: ${petsRoot}`);
  }
}

/**
 * Replace one package directory in the same filesystem. The lock prevents
 * concurrent installers from swapping the same package at the same time.
 */
export function replaceInstallDirectory({
  stageDir,
  petsRoot,
  petId,
  force = false,
}) {
  const targetDir = join(petsRoot, petId);
  const lockDir = join(petsRoot, `.${petId}.lock`);
  let backupDir = null;

  try {
    mkdirSync(lockDir);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`Another installation is already updating ${petId}`);
    }
    throw error;
  }

  try {
    assertNoSymlink(petsRoot, "Codex pets directory");

    if (pathExists(targetDir)) {
      assertManagedPackage(targetDir);
      if (!force) {
        throw new Error(
          `${petId} is already installed; rerun with --force to replace it`,
        );
      }

      const targetStat = lstatSync(targetDir);
      if (!targetStat.isDirectory()) {
        throw new Error(`Existing pet target is not a directory: ${targetDir}`);
      }

      backupDir = join(petsRoot, `.${petId}.backup-${randomUUID()}`);
      renameSync(targetDir, backupDir);
    }

    try {
      renameSync(stageDir, targetDir);
    } catch (error) {
      if (backupDir && pathExists(backupDir) && !pathExists(targetDir)) {
        renameSync(backupDir, targetDir);
      }
      throw error;
    }

    if (backupDir) rmSync(backupDir, { force: true, recursive: true });
  } finally {
    rmSync(lockDir, { force: true, recursive: true });
  }

  return targetDir;
}
