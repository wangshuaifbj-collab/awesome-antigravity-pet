"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import type { CommunityPulseData } from "@/lib/leaderboards";

export function CommunityPulse({ data }: { data: CommunityPulseData }) {
  const { locale, t } = useLocale();

  return (
    <section
      aria-labelledby="community-pulse-title"
      className="mb-16 border-y border-border py-7"
    >
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            {t("rankingWeekly")}
          </p>
          <h2
            className="mt-2 text-2xl font-semibold text-text"
            id="community-pulse-title"
          >
            {t("rankingsPageTitle")}
          </h2>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            href="/rankings?ref=home-weekly"
          >
            {t("rankings")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ol className="divide-y divide-border">
          {data.pets.map((entry, index) => (
            <li
              className="grid grid-cols-[1.5rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 py-2"
              key={entry.pet.slug}
            >
              <span className="font-mono text-xs font-bold text-muted">
                {index + 1}
              </span>
              <img
                alt=""
                className="size-10 object-contain [image-rendering:pixelated]"
                src={entry.pet.previewImage}
              />
              <Link
                className="truncate text-sm font-medium text-text hover:text-accent"
                href={`/pets/${entry.pet.slug}`}
              >
                {getLocalizedPetName(entry.pet, locale)}
              </Link>
              <span className="font-mono text-xs tabular-nums text-muted">
                {t("rankingWeeklyInstalls", { count: entry.installs7d })}
              </span>
            </li>
          ))}
        </ol>
        <ol className="divide-y divide-border">
          {data.contributors.map((entry, index) => (
            <li
              className="grid grid-cols-[1.5rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 py-2"
              key={entry.slug}
            >
              <span className="font-mono text-xs font-bold text-muted">
                {index + 1}
              </span>
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary">
                {entry.previewImage ? (
                  <img
                    alt=""
                    className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                    src={entry.previewImage}
                  />
                ) : (
                  <span className="text-xs font-semibold text-muted">
                    {entry.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <Link
                className="truncate text-sm font-medium text-text hover:text-accent"
                href={`/contributors/${entry.slug}`}
              >
                {entry.name}
              </Link>
              <span className="text-xs text-muted">
                {t("rankingPetCount", { count: entry.petCount })}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
