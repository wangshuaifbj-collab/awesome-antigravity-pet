"use client";

import Link from "next/link";

import { CollectionPetStage } from "@/components/collection-pet-stage";
import { ChatGPTIcon } from "@/components/chatgpt-icon";
import { PetGallery } from "@/components/pet-gallery";
import { ShareMenu } from "@/components/share-menu";
import { useLocale } from "@/components/locale-provider";
import { buildChatGPTUrl, getCollectionInstallPrompt } from "@/lib/codex-links";
import {
  getCollectionCoverPets,
  getLocalizedCollectionText,
  type PetCollection,
} from "@/lib/collections";
import { siteConfig } from "@/lib/site";

export function CollectionDetailContent({
  collection,
}: {
  collection: PetCollection;
}) {
  const { locale, t } = useLocale();
  const title = getLocalizedCollectionText(collection.title, locale);
  const coverPets = getCollectionCoverPets(collection);
  const categories = Array.from(
    new Map(
      collection.pets.map((pet) => [
        pet.primary_category,
        { name: pet.primary_category, label: pet.categoryLabel },
      ]),
    ).values(),
  );

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-24">
      <div className="py-6">
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
          href="/collections"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("backToCollections")}
        </Link>
      </div>

      <header className="mb-16 overflow-visible rounded-lg border border-border bg-bg-secondary">
        <div className="grid min-h-64 items-center gap-8 p-7 md:grid-cols-[minmax(0,0.8fr)_minmax(360px,1.2fr)] md:p-10">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
              {t(
                collection.kind === "franchise"
                  ? "franchiseSeries"
                  : "themeCollection",
              )}
              {" · "}
              {t("collectionPetCount", { count: collection.pets.length })}
            </p>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-muted">
              {getLocalizedCollectionText(collection.description, locale)}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
                href={buildChatGPTUrl(
                  getCollectionInstallPrompt(
                    title,
                    collection.pets.map((pet) => pet.slug),
                    locale,
                  ),
                )}
                target="_blank"
                rel="noreferrer"
              >
                <ChatGPTIcon className="size-6" />
                {t("openCollectionInCodex")}
              </a>
              <ShareMenu
                title={title}
                url={`${siteConfig.url}/collections/${collection.slug}`}
              />
            </div>
          </div>
          <div className="h-48 overflow-hidden sm:h-56 md:h-64">
            <CollectionPetStage pets={coverPets} variant="hero" />
          </div>
        </div>
      </header>

      <PetGallery pets={collection.pets} categories={categories} />
    </main>
  );
}
