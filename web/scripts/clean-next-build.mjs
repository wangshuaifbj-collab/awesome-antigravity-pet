import { existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nextDir = resolve(scriptDir, "../.next");

if (existsSync(nextDir)) {
  for (const entry of readdirSync(nextDir)) {
    if (entry === "cache") continue;
    rmSync(join(nextDir, entry), { recursive: true, force: true });
  }
}
