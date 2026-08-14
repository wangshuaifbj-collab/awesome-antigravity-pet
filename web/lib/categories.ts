import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { LocalizedCategoryLabel } from "@/lib/pets";

export type CategoryDefinition = {
  slug: string;
  name: string;
  label: LocalizedCategoryLabel;
  description: LocalizedCategoryLabel;
  discoverable?: boolean;
};

export function getCategoryCatalog(): CategoryDefinition[] {
  const path = join(process.cwd(), ".generated", "categories.generated.json");
  return JSON.parse(readFileSync(path, "utf8")) as CategoryDefinition[];
}
