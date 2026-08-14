"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FollowCreatorButton } from "@/components/follow-creator-button";
import { useLocale } from "@/components/locale-provider";
import { PetCard } from "@/components/pet-card";
import type { RankedContributor, RankedPet } from "@/lib/leaderboards";

function formatCount(value: number) {
  if (value < 1_000) return value.toString();
  if (value < 1_000_000) {
    return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  }
  return `${(value / 1_000_000).toFixed(1)}m`;
}

export function ContributorPageContent({
  contributor,
  pets,
}: {
  contributor: RankedContributor;
  pets: RankedPet[];
}) {
  const { t } = useLocale();
  const [followers, setFollowers] = useState(contributor.followers);

  useEffect(() => {
    setFollowers(contributor.followers);
  }, [contributor.followers, contributor.slug]);

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-12 sm:pt-16">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text"
        href="/rankings"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("contributorBack")}
      </Link>

      <header className="mt-8 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase text-accent">
            {t("contributorRoleLabel")}
          </p>
          <h1 className="text-4xl font-semibold text-text sm:text-5xl">
            {contributor.name}
          </h1>
          <p className="mt-3 text-sm text-muted">@{contributor.handle}</p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
            {t("contributorPageSubtitle", {
              name: contributor.name,
              count: contributor.petCount,
            })}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FollowCreatorButton
              followers={followers}
              onFollowersChange={setFollowers}
              slug={contributor.slug}
            />
            {contributor.url ? (
              <a
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-text transition-colors hover:border-border-hover hover:bg-surface"
                href={contributor.url}
                rel="noreferrer"
                target="_blank"
              >
                {t("contributorExternalProfile")}
                <svg
                  aria-hidden="true"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M14 5h5v5M10 14 19 5M19 13v6H5V5h6" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-4 divide-x divide-border border-y border-border">
          {[
            [t("rankingPets"), contributor.petCount],
            [t("rankingFollowers"), followers],
            [t("rankingInstalls"), contributor.installs],
            [t("rankingLikes"), contributor.likes],
          ].map(([label, value]) => (
            <div
              className="min-w-14 px-2 py-3 text-center sm:min-w-20 sm:px-3"
              key={label}
            >
              <dd className="font-mono text-lg font-semibold tabular-nums text-text">
                {formatCount(Number(value))}
              </dd>
              <dt className="mt-1 text-[10px] uppercase text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <section className="pt-10">
        <h2 className="mb-6 text-2xl font-semibold text-text">
          {t("contributorPageTitle", { name: contributor.name })}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pets
            .sort((a, b) => b.allScore - a.allScore)
            .map((entry) => (
              <PetCard
                installs={entry.stats.installs}
                key={entry.pet.slug}
                likes={entry.stats.likes}
                pet={entry.pet}
              />
            ))}
        </div>
      </section>
    </main>
  );
}
