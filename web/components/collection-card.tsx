"use client";

import Link from "next/link";

import { CollectionPetStage } from "@/components/collection-pet-stage";
import { ShareMenu } from "@/components/share-menu";
import { useLocale } from "@/components/locale-provider";
import {
  getLocalizedCollectionText,
  type CollectionCardData,
} from "@/lib/collections";
import { siteConfig } from "@/lib/site";

export function CollectionCard({
  collection,
}: {
  collection: CollectionCardData;
}) {
  const { locale, t } = useLocale();
  const title = getLocalizedCollectionText(collection.title, locale);
  const href = `/collections/${collection.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-lg border border-border bg-bg-elevated transition-colors hover:border-border-hover">
      <div className="relative h-52 rounded-t-lg bg-bg-secondary px-5 pt-5">
        <CollectionPetStage pets={collection.coverPets} />
        <div className="absolute right-3 top-3">
          <ShareMenu
            compact
            title={title}
            url={`${siteConfig.url}${href}`}
          />
        </div>
      </div>

      <Link className="relative z-10 block flex-1 bg-bg-elevated p-5" href={href}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
          {t(collection.kind === "franchise" ? "franchiseSeries" : "themeCollection")}
        </p>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-text">{title}</h3>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted">
            {t("collectionPetCount", { count: collection.petSlugs.length })}
          </span>
        </div>
        <p className="min-h-10 text-sm leading-relaxed text-muted">
          {getLocalizedCollectionText(collection.description, locale)}
        </p>
      </Link>
    </article>
  );
}
