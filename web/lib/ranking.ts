import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Pet } from "@/lib/pets";

type RankingStats = {
  installs?: number;
  installs7d?: number;
  trendingScore?: number;
};

type StatsSnapshot = {
  pets?: Record<string, RankingStats>;
};

export function getTrendingPets(pets: Pet[], limit: number) {
  let stats: Record<string, RankingStats> = {};

  try {
    const snapshot = JSON.parse(
      readFileSync(join(process.cwd(), "public", "stats.json"), "utf8"),
    ) as StatsSnapshot;
    stats = snapshot.pets ?? {};
  } catch {
    // A missing snapshot is valid for a fresh local checkout.
  }

  return [...pets]
    .sort((a, b) => {
      const aStats = stats[a.slug];
      const bStats = stats[b.slug];
      return (
        (bStats?.trendingScore ?? 0) - (aStats?.trendingScore ?? 0) ||
        (bStats?.installs7d ?? 0) - (aStats?.installs7d ?? 0) ||
        (bStats?.installs ?? 0) - (aStats?.installs ?? 0) ||
        a.name.localeCompare(b.name)
      );
    })
    .slice(0, limit);
}
