import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getCollections } from "@/lib/collection-catalog";
import {
  toCollectionCardData,
  type CollectionCardData,
} from "@/lib/collections";
import { toGalleryPet, type GalleryPet, type Pet } from "@/lib/pets";
import type { PetStats } from "@/lib/stats";

type RawStatsSnapshot = {
  pets?: Record<string, Partial<PetStats>>;
  creators?: Record<string, { followers?: number }>;
  generatedAt?: number;
};

export type RankingWindow = "weekly" | "all";

export type RankedPet = {
  pet: GalleryPet;
  stats: PetStats;
  weeklyScore: number;
  allScore: number;
};

export type RankedContributor = {
  slug: string;
  name: string;
  handle: string;
  url: string;
  petCount: number;
  pets: GalleryPet[];
  installs: number;
  installs7d: number;
  likes: number;
  likes7d: number;
  followers: number;
  weeklyScore: number;
  allScore: number;
};

export type RankedCollection = {
  collection: CollectionCardData;
  installs: number;
  installs7d: number;
  likes: number;
  likes7d: number;
  weeklyScore: number;
  allScore: number;
};

export type LeaderboardData = {
  pets: RankedPet[];
  contributors: RankedContributor[];
  collections: RankedCollection[];
  generatedAt: number;
};

export type CommunityPulseData = {
  pets: Array<{
    pet: Pick<
      GalleryPet,
      "slug" | "name" | "localizedNames" | "displayName" | "previewImage"
    >;
    installs7d: number;
  }>;
  contributors: Array<{
    slug: string;
    name: string;
    petCount: number;
    previewImage: string | null;
  }>;
};

const emptyPetStats = (): PetStats => ({
  installs: 0,
  likes: 0,
  installs7d: 0,
  likes7d: 0,
  trendingScore: 0,
  dailyRank: 0,
  updatedAt: 0,
});

function nonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function loadStatsSnapshot() {
  let snapshot: RawStatsSnapshot = {};
  try {
    snapshot = JSON.parse(
      readFileSync(join(process.cwd(), "public", "stats.json"), "utf8"),
    ) as RawStatsSnapshot;
  } catch {
    // A fresh checkout can build with an empty ranking snapshot.
  }

  const generatedAt = nonNegative(snapshot.generatedAt);
  return {
    pets: snapshot.pets ?? {},
    creators: snapshot.creators ?? {},
    generatedAt,
  };
}

let statsSnapshotCache: ReturnType<typeof loadStatsSnapshot> | undefined;

function readStatsSnapshot() {
  statsSnapshotCache ??= loadStatsSnapshot();
  return statsSnapshotCache;
}

function petStats(
  snapshot: ReturnType<typeof readStatsSnapshot>,
  slug: string,
): PetStats {
  const raw = snapshot.pets[slug] ?? {};
  return {
    installs: nonNegative(raw.installs),
    likes: nonNegative(raw.likes),
    installs7d: nonNegative(raw.installs7d),
    likes7d: nonNegative(raw.likes7d),
    trendingScore: nonNegative(raw.trendingScore),
    dailyRank: nonNegative(raw.dailyRank),
    updatedAt: nonNegative(raw.updatedAt),
  };
}

function scorePet(stats: PetStats) {
  return {
    weekly:
      Math.log1p(stats.installs7d) * 65 +
      Math.log1p(stats.likes7d) * 35,
    all: Math.log1p(stats.installs) * 60 + Math.log1p(stats.likes) * 40,
  };
}

function sortByScore<T extends { weeklyScore: number; allScore: number }>(
  entries: T[],
  rankingWindow: RankingWindow,
) {
  const score = rankingWindow === "weekly" ? "weeklyScore" : "allScore";
  return [...entries].sort((a, b) => b[score] - a[score]);
}

function buildRankedPets(
  pets: Pet[],
  snapshot: ReturnType<typeof readStatsSnapshot>,
) {
  return pets.map((pet) => {
    const stats = petStats(snapshot, pet.slug);
    const scores = scorePet(stats);
    return {
      pet: toGalleryPet(pet),
      stats,
      weeklyScore: scores.weekly,
      allScore: scores.all,
    };
  });
}

function buildContributors(
  rankedPets: RankedPet[],
  snapshot: ReturnType<typeof readStatsSnapshot>,
) {
  const groups = new Map<string, RankedPet[]>();
  for (const pet of rankedPets) {
    const entries = groups.get(pet.pet.author_slug) ?? [];
    entries.push(pet);
    groups.set(pet.pet.author_slug, entries);
  }

  return [...groups.entries()].map(([slug, entries]) => {
    const stableEntries = [...entries].sort((a, b) =>
      a.pet.slug.localeCompare(b.pet.slug),
    );
    const representative = stableEntries[0].pet;
    const topWeekly = sortByScore(stableEntries, "weekly").slice(0, 3);
    const topAll = sortByScore(stableEntries, "all").slice(0, 3);
    const contributionBonus = Math.sqrt(stableEntries.length) * 8;
    const followers = nonNegative(snapshot.creators[slug]?.followers);
    return {
      slug,
      name: representative.author,
      handle: representative.author_handle || representative.author,
      url: representative.author_url || "",
      petCount: stableEntries.length,
      pets: topAll.slice(0, 4).map((entry) => entry.pet),
      installs: stableEntries.reduce(
        (total, entry) => total + entry.stats.installs,
        0,
      ),
      installs7d: stableEntries.reduce(
        (total, entry) => total + entry.stats.installs7d,
        0,
      ),
      likes: stableEntries.reduce(
        (total, entry) => total + entry.stats.likes,
        0,
      ),
      likes7d: stableEntries.reduce(
        (total, entry) => total + entry.stats.likes7d,
        0,
      ),
      followers,
      weeklyScore:
        topWeekly.reduce((total, entry) => total + entry.weeklyScore, 0) +
        contributionBonus,
      allScore:
        topAll.reduce((total, entry) => total + entry.allScore, 0) +
        contributionBonus +
        Math.log1p(followers) * 20,
    };
  });
}

function buildCollections(pets: Pet[], rankedPets: RankedPet[]) {
  const rankedBySlug = new Map(
    rankedPets.map((entry) => [entry.pet.slug, entry]),
  );
  return getCollections(pets).map((collection) => {
    const entries = collection.pets
      .map((pet) => rankedBySlug.get(pet.slug))
      .filter((entry): entry is RankedPet => entry !== undefined);
    const topWeekly = sortByScore(entries, "weekly").slice(0, 5);
    const topAll = sortByScore(entries, "all").slice(0, 5);
    const sizeBonus = Math.sqrt(entries.length) * 4;
    return {
      collection: toCollectionCardData(collection),
      installs: entries.reduce(
        (total, entry) => total + entry.stats.installs,
        0,
      ),
      installs7d: entries.reduce(
        (total, entry) => total + entry.stats.installs7d,
        0,
      ),
      likes: entries.reduce((total, entry) => total + entry.stats.likes, 0),
      likes7d: entries.reduce(
        (total, entry) => total + entry.stats.likes7d,
        0,
      ),
      weeklyScore:
        topWeekly.reduce((total, entry) => total + entry.weeklyScore, 0) /
          Math.max(1, topWeekly.length) +
        sizeBonus,
      allScore:
        topAll.reduce((total, entry) => total + entry.allScore, 0) /
          Math.max(1, topAll.length) +
        sizeBonus,
    };
  });
}

let leaderboardCache: LeaderboardData | undefined;

export function getLeaderboardData(pets: Pet[]): LeaderboardData {
  if (leaderboardCache) return leaderboardCache;
  const snapshot = readStatsSnapshot();
  const rankedPets = buildRankedPets(pets, snapshot);
  leaderboardCache = {
    pets: rankedPets,
    contributors: buildContributors(rankedPets, snapshot),
    collections: buildCollections(pets, rankedPets),
    generatedAt: snapshot.generatedAt,
  };
  return leaderboardCache;
}

export function getCommunityPulseData(
  leaderboard: LeaderboardData,
): CommunityPulseData {
  const homeRankingLimit = 5;
  return {
    pets: sortByScore(leaderboard.pets, "weekly")
      .slice(0, homeRankingLimit)
      .map((entry) => ({
        pet: {
          slug: entry.pet.slug,
          name: entry.pet.name,
          localizedNames: entry.pet.localizedNames,
          displayName: entry.pet.displayName,
          previewImage: entry.pet.previewImage,
        },
        installs7d: entry.stats.installs7d,
      })),
    contributors: sortByScore(leaderboard.contributors, "weekly")
      .slice(0, homeRankingLimit)
      .map((entry) => ({
        slug: entry.slug,
        name: entry.name,
        petCount: entry.petCount,
        previewImage: entry.pets[0]?.previewImage ?? null,
      })),
  };
}

export function getContributorBySlug(pets: Pet[], slug: string) {
  const leaderboard = getLeaderboardData(pets);
  const contributor = leaderboard.contributors.find(
    (entry) => entry.slug === slug,
  );
  if (!contributor) return null;
  const contributorPets = leaderboard.pets.filter(
    (entry) => entry.pet.author_slug === slug,
  );
  return { contributor, pets: contributorPets };
}

export function getContributorSlugs(pets: Pet[]) {
  return getLeaderboardData(pets).contributors.map(
    (contributor) => contributor.slug,
  );
}

export function rankEntries<
  T extends { weeklyScore: number; allScore: number },
>(entries: T[], rankingWindow: RankingWindow) {
  return sortByScore(entries, rankingWindow);
}
