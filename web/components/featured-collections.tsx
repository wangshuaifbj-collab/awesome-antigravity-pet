"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CollectionCard } from "@/components/collection-card";
import { useLocale } from "@/components/locale-provider";
import type { CollectionCardData } from "@/lib/collections";

export function FeaturedCollections({
  collections,
}: {
  collections: CollectionCardData[];
}) {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollPrevious(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    Array.from(track.children).forEach((child) =>
      resizeObserver.observe(child),
    );

    return () => resizeObserver.disconnect();
  }, [collections.length, updateScrollState]);

  function scrollByCard(direction: -1 | 1) {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild;
    if (!track || !(firstCard instanceof HTMLElement)) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: "smooth",
    });
  }

  return (
    <section aria-labelledby="featured-collections-title" className="mb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {t("featuredCollectionsEyebrow")}
          </p>
          <h2
            id="featured-collections-title"
            className="text-3xl font-semibold tracking-tight"
          >
            {t("featuredCollectionsTitle")}
          </h2>
        </div>
        <Link
          className="text-sm font-medium text-muted hover:text-text transition-colors"
          href="/collections"
        >
          {t("viewAllCollections")}
        </Link>
      </div>
      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={updateScrollState}
        >
          {collections.map((collection) => (
            <div
              className="min-w-0 basis-full shrink-0 snap-start md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] [&>article]:h-full"
              key={collection.slug}
            >
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>

        {collections.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated text-text shadow-lg transition hover:border-border-hover hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
              aria-label={t("previousCollections")}
              title={t("previousCollections")}
              disabled={!canScrollPrevious}
              onClick={() => scrollByCard(-1)}
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.25}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15 18-6-6 6-6"
                />
              </svg>
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated text-text shadow-lg transition hover:border-border-hover hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
              aria-label={t("nextCollections")}
              title={t("nextCollections")}
              disabled={!canScrollNext}
              onClick={() => scrollByCard(1)}
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.25}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 18 6-6-6-6"
                />
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
