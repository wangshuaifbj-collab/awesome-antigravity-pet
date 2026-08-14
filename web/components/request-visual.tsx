"use client";

import { useEffect, useState } from "react";

const categoryStyle: Record<string, string> = {
  animal: "bg-[#f2e8dc] text-[#76543d]",
  anime: "bg-[#e8edf8] text-[#445b8b]",
  game: "bg-[#e7f2ec] text-[#356650]",
  mascot: "bg-[#f5e9ef] text-[#7c4862]",
  other: "bg-bg-tertiary text-muted",
};

const categoryPlaceholder: Record<string, string> = {
  animal: "animal",
  anime: "anime",
  game: "game",
  mascot: "other",
  meme: "other",
  object: "other",
  original: "other",
  other: "other",
  robot: "other",
};

export function RequestVisual({
  name,
  category,
  image,
  fallbackImage,
  className = "",
}: {
  name: string;
  category: string;
  image?: string;
  fallbackImage?: string;
  className?: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const placeholder = `/assets/request-placeholders/${
    categoryPlaceholder[category] ?? "other"
  }.webp`;
  const sources = [image, fallbackImage].filter(
    (source, index, values): source is string =>
      Boolean(source) && values.indexOf(source) === index,
  );
  const activeSource = sources[sourceIndex];
  const showReference = Boolean(activeSource);

  useEffect(() => {
    setSourceIndex(0);
    setPlaceholderFailed(false);
  }, [fallbackImage, image]);

  return (
    <div
      className={`relative flex min-h-0 items-center justify-center overflow-hidden ${categoryStyle[category] ?? categoryStyle.other} ${className}`}
    >
      {!placeholderFailed ? (
        <img
          alt={showReference ? `${name} reference` : ""}
          className="h-full w-full object-contain"
          decoding="async"
          loading="lazy"
          onError={() => {
            if (showReference) setSourceIndex((current) => current + 1);
            else setPlaceholderFailed(true);
          }}
          src={showReference ? activeSource : placeholder}
        />
      ) : (
        <>
          <span
            className="absolute inset-0 opacity-30 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:18px_18px]"
            aria-hidden="true"
          />
          <span className="relative text-4xl font-semibold uppercase">
            {name.trim().slice(0, 1) || "?"}
          </span>
        </>
      )}
    </div>
  );
}
