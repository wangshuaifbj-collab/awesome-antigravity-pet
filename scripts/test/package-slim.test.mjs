import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("npm package contains only the lightweight installer", () => {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const [pack] = JSON.parse(output);
  assert.ok(pack, "npm pack did not return package metadata");
  assert.ok(
    pack.files.some((file) => file.path === "scripts/install-pet-remote.mjs"),
  );
  assert.ok(
    pack.files.some((file) => file.path === "scripts/install-utils.mjs"),
  );
  assert.ok(
    pack.files.every(
      (file) =>
        !file.path.startsWith("pets/") && !file.path.startsWith("assets/"),
    ),
    "npm package must not include the pet catalog or generated assets",
  );
  assert.ok(
    pack.unpackedSize < 500_000,
    `npm package is too large: ${pack.unpackedSize} bytes unpacked`,
  );
});
