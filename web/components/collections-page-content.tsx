"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";

import { CollectionCard } from "@/components/collection-card";
import { useLocale } from "@/components/locale-provider";
import type {
  CollectionCardData,
  CollectionKind,
} from "@/lib/collections";

type CollectionFilter = "all" | CollectionKind;

export function CollectionsPageContent({
  collections,
}: {
  collections: CollectionCardData[];
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<CollectionFilter>("all");
  const deferredQuery = useDeferredValue(query.trim().normalize("NFKC").toLocaleLowerCase());
  const filteredCollections = useMemo(
    () =>
      collections.filter(
        (collection) =>
          (kind === "all" || collection.kind === kind) &&
          (!deferredQuery || collection.searchText.includes(deferredQuery)),
      ),
    [collections, deferredQuery, kind],
  );
  const franchiseSeries = filteredCollections.filter(
    (collection) => collection.kind === "franchise",
  );
  const themeCollections = filteredCollections.filter(
    (collection) => collection.kind === "theme",
  );
  const filters: Array<{ value: CollectionFilter; label: string }> = [
    { value: "all", label: t("allCollections") },
    { value: "franchise", label: t("franchiseSeries") },
    { value: "theme", label: t("themeCollection") },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          {t("collections")}
        </p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("collectionsPageTitle")}
        </h1>
        <p className="text-lg leading-relaxed text-muted">{t("collectionsPageSubtitle")}</p>
      </header>
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            aria-label={t("collectionSearchPlaceholder")}
            className="h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-11 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-border-hover focus:ring-2 focus:ring-accent/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("collectionSearchPlaceholder")}
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label={t("clearCollectionSearch")}
              className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-text"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              title={t("clearCollectionSearch")}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
        <div
          aria-label={t("filterCollections")}
          className="grid h-11 grid-cols-3 rounded-lg border border-border bg-bg-secondary p-1 sm:w-auto"
          role="group"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={kind === filter.value}
              className={`min-w-0 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors sm:min-w-28 ${
                kind === filter.value
                  ? "bg-bg-elevated text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
              key={filter.value}
              onClick={() => setKind(filter.value)}
              type="button"
            >
              <span className="block truncate">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>
      {franchiseSeries.length > 0 ? (
        <section aria-labelledby="franchise-series-title" className="mb-16">
          <div className="mb-6 max-w-2xl">
            <h2 id="franchise-series-title" className="mb-2 text-2xl font-semibold">
              {t("franchiseSeriesTitle")}
            </h2>
            <p className="leading-relaxed text-muted">{t("franchiseSeriesDesc")}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {franchiseSeries.map((collection) => (
              <CollectionCard collection={collection} key={collection.slug} />
            ))}
          </div>
        </section>
      ) : null}

      {themeCollections.length > 0 ? (
        <section aria-labelledby="theme-collections-title">
          <div className="mb-6 max-w-2xl">
            <h2 id="theme-collections-title" className="mb-2 text-2xl font-semibold">
              {t("themeCollectionsTitle")}
            </h2>
            <p className="leading-relaxed text-muted">{t("themeCollectionsDesc")}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {themeCollections.map((collection) => (
              <CollectionCard collection={collection} key={collection.slug} />
            ))}
          </div>
        </section>
      ) : null}
      {filteredCollections.length === 0 ? (
        <div className="border-t border-border py-20 text-center" role="status">
          <h2 className="text-xl font-semibold text-text">{t("noCollectionsFound")}</h2>
          <p className="mt-2 text-sm text-muted">{t("noCollectionsFoundHint")}</p>
        </div>
      ) : null}
    </main>
  );
}
