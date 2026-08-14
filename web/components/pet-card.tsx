"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";

import { getLocalizedCategoryLabel } from "@/lib/pet-localization";
import type { GalleryPet } from "@/lib/pets";
import { PetInstallMenu } from "@/components/pet-install-menu";
import { PetLikeButton } from "@/components/pet-like-button";
import { ShareMenu } from "@/components/share-menu";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import { siteConfig } from "@/lib/site";

type PetCardProps = {
  pet: GalleryPet;
  installs?: number;
  likes?: number;
};

function formatCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return `${(n / 1000000).toFixed(1)}m`;
}

export function PetCard({ pet, installs = 0, likes = 0 }: PetCardProps) {
  const { t, locale } = useLocale();
  const detailHref = `/pets/${pet.slug}`;
  const localizedName = getLocalizedPetName(pet, locale);
  const cardRef = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  function updateCardTilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const card = cardRef.current;
    if (
      !card ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--pet-rotate-x", `${(-y * 6).toFixed(2)}deg`);
    card.style.setProperty("--pet-rotate-y", `${(x * 8).toFixed(2)}deg`);
    card.style.setProperty("--pet-shift-x", `${(x * 10).toFixed(2)}px`);
    card.style.setProperty("--pet-shift-y", `${(y * 7).toFixed(2)}px`);
  }

  function resetCardTilt() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--pet-rotate-x", "0deg");
    card.style.setProperty("--pet-rotate-y", "0deg");
    card.style.setProperty("--pet-shift-x", "0px");
    card.style.setProperty("--pet-shift-y", "0px");
  }

  return (
    <article
      ref={cardRef}
      className="pet-card group relative z-0 flex h-full flex-col rounded-lg border border-border bg-bg-elevated hover:z-20 hover:border-border-hover hover:shadow-xl focus-within:z-30"
      onPointerMove={updateCardTilt}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setIsAnimating(true);
      }}
      onPointerLeave={() => {
        setIsAnimating(false);
        resetCardTilt();
      }}
      onFocus={() => setIsAnimating(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsAnimating(false);
          resetCardTilt();
        }
      }}
    >
      {/* Visual area */}
      <div className="pet-card__visual relative flex h-56 items-center justify-center overflow-hidden rounded-t-lg bg-bg-secondary p-4 xl:h-60">
        <Link
          className="absolute inset-0 z-10 rounded-t-lg focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
          href={detailHref}
          aria-label={`${t("view")} ${localizedName}`}
        />
        <div className="pet-card__character-stage pointer-events-none flex size-full items-center justify-center">
          <img
            className="pet-card__character relative h-full w-auto max-w-full object-contain [image-rendering:pixelated]"
            src={isAnimating ? pet.animatedPreviewImage : pet.previewImage}
            alt={`${localizedName} preview`}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute left-3 top-3 z-20">
          <PetLikeButton slug={pet.slug} initialLikes={likes} />
        </div>
        {installs > 0 ? (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg/85 backdrop-blur border border-border text-[11px] text-text-secondary"
              title={t("statsInstalls", { count: installs })}
            >
              <svg
                className="size-3 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              {formatCount(installs)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="pet-card__body flex flex-grow flex-col rounded-b-lg border-t border-border p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="min-w-0 truncate text-base font-semibold leading-tight text-text">
            <Link className="hover:underline" href={detailHref}>
              {localizedName}
            </Link>
          </h2>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-bg-secondary text-muted border border-border">
            {getLocalizedCategoryLabel(pet.categoryLabel, locale)}
          </span>
        </div>

        <p className="text-sm text-muted mb-1">
          {t("by")}{" "}
          <Link
            className="relative z-20 text-accent hover:underline"
            href={`/contributors/${pet.author_slug}`}
          >
            {pet.author_handle ?? pet.author}
          </Link>
        </p>

        <p className="text-sm text-muted leading-relaxed mt-2 mb-4 flex-grow line-clamp-2">
          {pet.description ?? pet.runtimeDescription ?? t("defaultDesc")}
        </p>

        <div className="relative z-20 mt-auto flex gap-2">
          <Link
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-bg-secondary px-3 text-sm font-medium text-text transition-colors hover:border-border-hover hover:bg-surface"
            href={detailHref}
          >
            {t("view")}
          </Link>
          <PetInstallMenu pet={pet} />
          <ShareMenu
            compact
            title={localizedName}
            url={`${siteConfig.url}${detailHref}`}
          />
        </div>
      </div>
    </article>
  );
}
