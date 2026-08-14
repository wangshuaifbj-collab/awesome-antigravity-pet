"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { fetchStats, hasLikedPet, likePet } from "@/lib/stats";

type PetLikeButtonProps = {
  slug: string;
  initialLikes?: number;
  variant?: "badge" | "button";
};

function formatCount(value: number) {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}k`;
}

export function PetLikeButton({
  slug,
  initialLikes,
  variant = "badge",
}: PetLikeButtonProps) {
  const { t } = useLocale();
  const [likes, setLikes] = useState(initialLikes ?? 0);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLiked(hasLikedPet(slug));
  }, [slug]);

  useEffect(() => {
    if (initialLikes !== undefined) {
      setLikes(initialLikes);
      return;
    }

    const controller = new AbortController();
    void fetchStats(controller.signal)
      .then((payload) => setLikes(payload.pets[slug]?.likes ?? 0))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn(
            "Unable to load pet likes",
            error instanceof Error ? error.stack : String(error),
          );
        }
      });
    return () => controller.abort();
  }, [initialLikes, slug]);

  async function handleLike() {
    if (pending || liked) return;
    const previousLikes = likes;
    setPending(true);
    setLiked(true);
    setLikes((current) => current + 1);
    try {
      const result = await likePet(slug);
      setLikes(result.likes);
    } catch (error: unknown) {
      setLikes(previousLikes);
      setLiked(false);
      console.warn(
        "Unable to like pet",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      setPending(false);
    }
  }

  const label = liked
    ? t("likedPet", { count: likes })
    : t("likePet", { count: likes });

  return (
    <button
      className={
        variant === "badge"
          ? `inline-flex h-7 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-full border px-2 text-[11px] backdrop-blur transition-colors ${
              liked
                ? "border-accent/50 bg-accent-light text-accent"
                : "border-border bg-bg/85 text-text-secondary hover:border-border-hover hover:bg-bg-elevated"
            }`
          : `inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
              liked
                ? "border-accent/50 bg-accent-light text-accent"
                : "border-border bg-bg-elevated text-text hover:bg-surface"
            }`
      }
      type="button"
      disabled={pending}
      aria-pressed={liked}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void handleLike();
      }}
    >
      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
      <span>{formatCount(likes)}</span>
    </button>
  );
}
