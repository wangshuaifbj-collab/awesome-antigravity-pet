import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const installerPath = fileURLToPath(
  new URL("../install-pet.mjs", import.meta.url),
);
const remoteInstallerPath = fileURLToPath(
  new URL("../install-pet-remote.mjs", import.meta.url),
);

test("rejects pet IDs that escape the catalog directory", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "awesome-codex-pet-"));

  try {
    const result = spawnSync(
      process.execPath,
      [
        installerPath,
        "../pets/firefly--lingxiaotian",
        "--codex-home",
        codexHome,
      ],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid pet id:/);
  } finally {
    rmSync(codexHome, { force: true, recursive: true });
  }
});

test("installs atomically and requires --force for replacement", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "awesome-codex-pet-"));

  try {
    const first = spawnSync(
      process.execPath,
      [installerPath, "firefly--lingxiaotian", "--codex-home", codexHome],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );
    assert.equal(first.status, 0, first.stderr);

    const target = join(codexHome, "pets", "firefly--lingxiaotian");
    assert.ok(existsSync(join(target, "pet.json")));
    assert.ok(existsSync(join(target, "spritesheet.webp")));
    assert.equal(
      JSON.parse(readFileSync(join(target, "pet.json"), "utf8")).id,
      "firefly--lingxiaotian",
    );

    const duplicate = spawnSync(
      process.execPath,
      [installerPath, "firefly--lingxiaotian", "--codex-home", codexHome],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /--force/);

    const replacement = spawnSync(
      process.execPath,
      [
        installerPath,
        "firefly--lingxiaotian",
        "--codex-home",
        codexHome,
        "--force",
      ],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );
    assert.equal(replacement.status, 0, replacement.stderr);
    assert.match(replacement.stdout, /Updated firefly--lingxiaotian/);
  } finally {
    rmSync(codexHome, { force: true, recursive: true });
  }
});

test("rejects a missing --codex-home value without a stack trace", () => {
  const result = spawnSync(
    process.execPath,
    [installerPath, "firefly--lingxiaotian", "--codex-home"],
    {
      encoding: "utf8",
      env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--codex-home requires a path/);
  assert.doesNotMatch(result.stderr, /TypeError|at file:/);
});

test("refuses a symbolic-link installation target", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "awesome-codex-pet-"));
  const outside = mkdtempSync(join(tmpdir(), "awesome-codex-pet-outside-"));

  try {
    const petsRoot = join(codexHome, "pets");
    mkdirSync(petsRoot, { recursive: true });
    symlinkSync(outside, join(petsRoot, "firefly--lingxiaotian"), "dir");

    const result = spawnSync(
      process.execPath,
      [installerPath, "firefly--lingxiaotian", "--codex-home", codexHome],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symbolic link/);
    assert.equal(existsSync(join(outside, "pet.json")), false);
  } finally {
    rmSync(codexHome, { force: true, recursive: true });
    rmSync(outside, { force: true, recursive: true });
  }
});

test("refuses to replace a package containing unmanaged files", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "awesome-codex-pet-"));

  try {
    const first = spawnSync(
      process.execPath,
      [installerPath, "firefly--lingxiaotian", "--codex-home", codexHome],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );
    assert.equal(first.status, 0, first.stderr);

    const target = join(codexHome, "pets", "firefly--lingxiaotian");
    const extraFile = join(target, "notes.txt");
    writeFileSync(extraFile, "keep me", "utf8");

    const replacement = spawnSync(
      process.execPath,
      [
        installerPath,
        "firefly--lingxiaotian",
        "--codex-home",
        codexHome,
        "--force",
      ],
      {
        encoding: "utf8",
        env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
      },
    );

    assert.notEqual(replacement.status, 0);
    assert.match(replacement.stderr, /unmanaged file/);
    assert.equal(readFileSync(extraFile, "utf8"), "keep me");
    assert.equal(
      JSON.parse(readFileSync(join(target, "pet.json"), "utf8")).id,
      "firefly--lingxiaotian",
    );
  } finally {
    rmSync(codexHome, { force: true, recursive: true });
  }
});

test("rejects insecure remote sources before downloading", () => {
  const result = spawnSync(
    process.execPath,
    [
      remoteInstallerPath,
      "--raw-base",
      "http://example.test",
      "firefly--lingxiaotian",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, AWESOME_CODEX_PET_NO_STATS: "1" },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use HTTPS/);
});
