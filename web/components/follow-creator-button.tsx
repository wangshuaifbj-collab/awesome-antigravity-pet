"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { isFollowingCreator, setCreatorFollowing } from "@/lib/stats";

export function FollowCreatorButton({
  followers,
  onFollowersChange,
  slug,
}: {
  followers: number;
  onFollowersChange: (followers: number) => void;
  slug: string;
}) {
  const { t } = useLocale();
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFollowing(isFollowingCreator(slug));
  }, [slug]);

  async function toggleFollow() {
    if (pending) return;
    const nextFollowing = !following;
    const previousFollowers = followers;
    setPending(true);
    setFailed(false);
    setFollowing(nextFollowing);
    onFollowersChange(Math.max(0, followers + (nextFollowing ? 1 : -1)));

    try {
      const result = await setCreatorFollowing(slug, nextFollowing);
      onFollowersChange(result.followers);
      setFollowing(result.following);
    } catch (error: unknown) {
      onFollowersChange(previousFollowers);
      setFollowing(!nextFollowing);
      setFailed(true);
      console.warn(
        "Unable to update creator follow",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      setPending(false);
    }
  }

  const label = failed
    ? t("followCreatorRetry")
    : t(following ? "followingCreator" : "followCreator");

  return (
    <div className="inline-flex flex-col items-start">
      <button
        aria-pressed={following}
        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
          following
            ? "border-accent/50 bg-accent-light text-accent"
            : "border-border bg-bg-elevated text-text hover:border-border-hover hover:bg-surface"
        }`}
        disabled={pending}
        onClick={() => void toggleFollow()}
        type="button"
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
          {following ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <path d="M15 19c0-3-2.7-5-6-5s-6 2-6 5" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M16 11h6" />
            </>
          )}
        </svg>
        {label}
      </button>
      <span aria-live="polite" className="sr-only">
        {failed
          ? t("followCreatorFailed")
          : t("creatorFollowerCount", { count: followers })}
      </span>
    </div>
  );
}
