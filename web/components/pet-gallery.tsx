"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FilterBar, type CategoryFilterOption } from "@/components/filter-bar";
import { ActionDropdown } from "@/components/action-dropdown";
import { GachaDialog } from "@/components/gacha-dialog";
import { PetCard } from "@/components/pet-card";
import { useLocale } from "@/components/locale-provider";
import { fetchStats, type StatsMap } from "@/lib/stats";
import type { GalleryPet } from "@/lib/pets";
import { parseGalleryCatalog } from "@/lib/gallery-catalog";
import { getTagSearchTerms } from "@/lib/tag-localization";

type PetGalleryProps = {
  pets: GalleryPet[];
  categories: Array<{
    name: string;
    label: GalleryPet["categoryLabel"];
    count?: number;
  }>;
  catalogUrl?: string;
  totalPetCount?: number;
};

type SortKey = "random" | "trending" | "downloads" | "likes" | "name";

const INITIAL_BATCH_SIZE = 18;
const LOAD_MORE_BATCH_SIZE = 18;

type StatsState =
  | { status: "loading"; pets: StatsMap; generatedAt: number }
  | { status: "ready"; pets: StatsMap; generatedAt: number }
  | { status: "error"; pets: StatsMap; generatedAt: number };

function normalizeSortText(value: string) {
  return value.normalize("NFKD").toLowerCase();
}

function comparePetsByName(a: GalleryPet, b: GalleryPet) {
  const aName = normalizeSortText(a.name);
  const bName = normalizeSortText(b.name);

  if (aName < bName) return -1;
  if (aName > bName) return 1;
  if (a.slug < b.slug) return -1;
  if (a.slug > b.slug) return 1;
  return 0;
}

function createPetRanks(pets: GalleryPet[], shuffle = false) {
  const slugs = pets.map((pet) => pet.slug);

  if (shuffle) {
    for (let index = slugs.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [slugs[index], slugs[swapIndex]] = [slugs[swapIndex], slugs[index]];
    }
  }

  return new Map(slugs.map((slug, index) => [slug, index]));
}

function appendRandomRanks(current: Map<string, number>, pets: GalleryPet[]) {
  const missing = pets
    .map((pet) => pet.slug)
    .filter((slug) => !current.has(slug));
  for (let index = missing.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [missing[index], missing[swapIndex]] = [missing[swapIndex], missing[index]];
  }
  if (missing.length === 0) return current;
  const next = new Map(current);
  const start = next.size;
  missing.forEach((slug, index) => next.set(slug, start + index));
  return next;
}

export function PetGallery({
  pets,
  categories,
  catalogUrl,
  totalPetCount = pets.length,
}: PetGalleryProps) {
  const { t } = useLocale();
  const [filters, setFilters] = useState({
    query: "",
    categories: [] as string[],
  });
  const [sort, setSort] = useState<SortKey>("random");
  const [catalogPets, setCatalogPets] = useState(pets);
  const [catalogStatus, setCatalogStatus] = useState<
    "partial" | "loading" | "ready" | "error"
  >(catalogUrl && pets.length < totalPetCount ? "partial" : "ready");
  const [randomRanks, setRandomRanks] = useState(() => createPetRanks(pets));
  const [renderCount, setRenderCount] = useState(INITIAL_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const catalogRequestRef = useRef<Promise<GalleryPet[]> | null>(null);
  const catalogAbortRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);
  const [statsState, setStatsState] = useState<StatsState>({
    status: "loading",
    pets: {},
    generatedAt: 0,
  });

  useEffect(() => {
    setRandomRanks(createPetRanks(pets, true));
  }, [pets]);

  const loadCompleteCatalog = useCallback(() => {
    if (!catalogUrl || catalogStatus === "ready") {
      return Promise.resolve(catalogPets);
    }
    if (catalogRequestRef.current) return catalogRequestRef.current;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    catalogAbortRef.current = controller;
    setCatalogStatus("loading");
    const request = fetch(catalogUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Gallery catalog returned HTTP ${response.status}`);
        }
        const complete = parseGalleryCatalog(await response.json());
        setCatalogPets((current) => {
          const known = new Set(current.map((pet) => pet.slug));
          return [
            ...current,
            ...complete.filter((pet) => !known.has(pet.slug)),
          ];
        });
        setRandomRanks((current) => appendRandomRanks(current, complete));
        setCatalogStatus("ready");
        return complete;
      })
      .catch((error: unknown) => {
        if (!disposedRef.current) {
          console.warn(
            "Unable to load the complete gallery catalog",
            error instanceof Error ? error.stack : String(error),
          );
          setCatalogStatus("error");
        }
        throw error;
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        catalogAbortRef.current = null;
        catalogRequestRef.current = null;
      });
    catalogRequestRef.current = request;
    return request;
  }, [catalogPets, catalogStatus, catalogUrl]);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      catalogAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchStats(controller.signal)
      .then((payload) => {
        setStatsState({
          status: "ready",
          pets: payload.pets,
          generatedAt: payload.generatedAt,
        });
      })
      .catch((error: unknown) => {
        console.warn(
          "Unable to load pet statistics",
          error instanceof Error ? error.stack : String(error),
        );
        if (!controller.signal.aborted) {
          setStatsState({ status: "error", pets: {}, generatedAt: 0 });
        }
      });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    const queryTerms = normalizeSortText(filters.query)
      .split(/\s+/)
      .filter(Boolean);

    const filtered = catalogPets.filter((pet) => {
      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(pet.primary_category);
      if (!matchesCategory) return false;
      if (queryTerms.length === 0) return true;

      const haystack = normalizeSortText(
        [
          pet.name,
          pet.localizedNames?.en,
          pet.localizedNames?.zh,
          pet.author,
          pet.author_handle,
          pet.primary_category,
          pet.description,
          pet.runtimeDescription,
          pet.displayName,
          pet.categoryLabel.en,
          pet.categoryLabel.zh,
          ...pet.tags.flatMap(getTagSearchTerms),
        ]
          .filter(Boolean)
          .join(" "),
      );

      return queryTerms.every((term) => haystack.includes(term));
    });

    const withStats = filtered.map((pet, originalIndex) => ({
      pet,
      originalIndex,
      installs: statsState.pets[pet.slug]?.installs ?? 0,
      likes: statsState.pets[pet.slug]?.likes ?? 0,
      installs7d: statsState.pets[pet.slug]?.installs7d ?? 0,
      trendingScore: statsState.pets[pet.slug]?.trendingScore ?? 0,
      dailyRank: statsState.pets[pet.slug]?.dailyRank ?? 0,
      randomRank: randomRanks.get(pet.slug) ?? originalIndex,
    }));

    withStats.sort((a, b) => {
      if (
        sort !== "name" &&
        sort !== "random" &&
        statsState.status !== "ready"
      ) {
        return a.originalIndex - b.originalIndex;
      }

      switch (sort) {
        case "random":
          return a.randomRank - b.randomRank;
        case "downloads":
          return (
            b.installs - a.installs ||
            b.likes - a.likes ||
            comparePetsByName(a.pet, b.pet)
          );
        case "likes":
          return (
            b.likes - a.likes ||
            b.installs - a.installs ||
            comparePetsByName(a.pet, b.pet)
          );
        case "name":
          return comparePetsByName(a.pet, b.pet);
        case "trending":
        default:
          return (
            b.trendingScore - a.trendingScore ||
            b.installs7d - a.installs7d ||
            b.installs - a.installs ||
            b.likes - a.likes ||
            b.dailyRank - a.dailyRank ||
            comparePetsByName(a.pet, b.pet)
          );
      }
    });

    return withStats;
  }, [catalogPets, filters, randomRanks, sort, statsState]);

  useEffect(() => {
    setRenderCount(INITIAL_BATCH_SIZE);
  }, [filters.categories, filters.query, sort]);

  const categoryOptions = useMemo<CategoryFilterOption[]>(() => {
    const countByCategory = new Map<string, number>();
    for (const pet of catalogPets) {
      countByCategory.set(
        pet.primary_category,
        (countByCategory.get(pet.primary_category) ?? 0) + 1,
      );
    }
    return categories
      .map((category) => ({
        ...category,
        count: category.count ?? countByCategory.get(category.name) ?? 0,
      }))
      .filter((category) => category.count > 0);
  }, [categories, catalogPets]);

  const rendered = visible.slice(0, renderCount);
  const hasMore = rendered.length < visible.length;
  const displayedPetCount =
    filters.query || filters.categories.length > 0 || catalogStatus === "ready"
      ? visible.length
      : totalPetCount;
  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "random", label: t("sortRandom") },
    { value: "downloads", label: t("sortDownloads") },
    { value: "likes", label: t("sortLikes") },
    { value: "trending", label: t("sortPopular") },
    { value: "name", label: t("sortName") },
  ];
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ??
    t("sortRandom");

  function selectSort(nextSort: SortKey) {
    if (nextSort === "random") {
      setRandomRanks(createPetRanks(catalogPets, true));
      setRenderCount(INITIAL_BATCH_SIZE);
    } else {
      void loadCompleteCatalog().catch(() => undefined);
    }
    setSort(nextSort);
  }

  useEffect(() => {
    const target = loadMoreRef.current;
    const mayHaveUnloadedPets =
      catalogStatus !== "ready" && catalogPets.length < totalPetCount;
    if (
      (!hasMore && !mayHaveUnloadedPets) ||
      !target ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (mayHaveUnloadedPets) {
          void loadCompleteCatalog().catch(() => undefined);
        }
        setRenderCount((current) =>
          Math.min(current + LOAD_MORE_BATCH_SIZE, visible.length),
        );
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    catalogPets.length,
    catalogStatus,
    hasMore,
    loadCompleteCatalog,
    totalPetCount,
    visible.length,
  ]);

  return (
    <section id="gallery" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("galleryTitle")}
          </h2>
          <p className="text-muted text-sm mt-1">
            {t("petsAvailable", { count: displayedPetCount })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <span className="text-xs text-muted" aria-live="polite">
            {statsState.status === "loading"
              ? t("statsLoading")
              : statsState.status === "error"
                ? t("statsUnavailable")
                : t("statsUpdated")}
          </span>
          <div className="flex items-center gap-2">
            <GachaDialog
              pets={catalogPets}
              onOpenRequest={loadCompleteCatalog}
            />
            <span className="hidden sm:inline text-muted">
              {t("sortLabel")}
            </span>
            <ActionDropdown
              label={t("sortLabel")}
              menuWidth={196}
              triggerClassName="inline-flex h-10 min-w-36 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-bg-elevated px-3.5 text-sm font-medium text-text shadow-sm transition-colors hover:border-border-hover hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              trigger={
                <>
                  <span>{selectedSortLabel}</span>
                  <svg
                    className="size-4 shrink-0 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </>
              }
            >
              <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase text-muted">
                {t("sortLabel")}
              </div>
              {sortOptions.map((option) => {
                const selected = option.value === sort;
                return (
                  <button
                    key={option.value}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface ${
                      selected ? "bg-accent-light text-accent" : "text-text"
                    }`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => selectSort(option.value)}
                  >
                    <span className="font-medium">{option.label}</span>
                    <svg
                      className={`size-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </ActionDropdown>
          </div>
        </div>
      </div>

      <FilterBar
        categories={categoryOptions}
        onChange={setFilters}
        onInteract={() => {
          void loadCompleteCatalog().catch(() => undefined);
        }}
      />

      {visible.length === 0 && catalogStatus === "loading" ? (
        <div className="py-20 text-center text-sm text-muted">
          {t("statsLoading")}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg">{t("noResults")}</p>
          <p className="text-sm mt-1">{t("noResultsHint")}</p>
        </div>
      ) : (
        <>
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            }}
          >
            {rendered.map(({ pet, installs, likes }, i) => (
              <div
                key={pet.slug}
                className="h-full animate-fade-in-up"
                style={{
                  animationDelay: `${(i % LOAD_MORE_BATCH_SIZE) * 30}ms`,
                }}
              >
                <PetCard pet={pet} installs={installs} likes={likes} />
              </div>
            ))}
          </div>
          <div
            ref={loadMoreRef}
            className="flex min-h-20 flex-col items-center justify-center gap-2 pt-6"
            aria-live="polite"
          >
            <span className="text-xs text-muted">
              {t("showingPets", { count: rendered.length })}
            </span>
            {hasMore ? (
              <button
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:border-border-hover hover:bg-surface"
                type="button"
                onClick={() =>
                  setRenderCount((current) =>
                    Math.min(current + LOAD_MORE_BATCH_SIZE, visible.length),
                  )
                }
              >
                {t("loadMorePets")}
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
