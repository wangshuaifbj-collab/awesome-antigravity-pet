"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import type { GalleryPet } from "@/lib/pets";

type CollectionPetStageProps = {
  pets: GalleryPet[];
  variant?: "card" | "hero";
};

const cardLayout = [
  { left: 0, bottom: 8, width: 26, scale: 0.82, zIndex: 10 },
  { left: 17, bottom: 24, width: 29, scale: 1, zIndex: 30 },
  { left: 39, bottom: 4, width: 27, scale: 0.88, zIndex: 20 },
  { left: 59, bottom: 30, width: 30, scale: 1.04, zIndex: 40 },
  { left: 79, bottom: 10, width: 23, scale: 0.8, zIndex: 10 },
] as const;

const heroLayout = [
  { left: 0, bottom: 4, width: 28, scale: 0.82, zIndex: 10 },
  { left: 17, bottom: 22, width: 31, scale: 1, zIndex: 30 },
  { left: 40, bottom: 0, width: 29, scale: 0.9, zIndex: 20 },
  { left: 60, bottom: 26, width: 32, scale: 1.05, zIndex: 40 },
  { left: 80, bottom: 7, width: 24, scale: 0.8, zIndex: 10 },
] as const;

function getLayout(variant: CollectionPetStageProps["variant"], petCount: number) {
  const baseLayout = variant === "hero" ? heroLayout : cardLayout;
  if (petCount >= baseLayout.length) return baseLayout;

  const slotWidth = 100 / Math.max(petCount, 1);
  const maxWidth = variant === "hero" ? 38 : 34;
  const width = Math.min(maxWidth, slotWidth * 0.92);
  const bottoms = variant === "hero" ? [4, 22, 0, 26] : [8, 24, 4, 30];
  const scales = [0.9, 1.04, 0.88, 1];

  return Array.from({ length: petCount }, (_, index) => ({
    left: index * slotWidth + (slotWidth - width) / 2,
    bottom: bottoms[index % bottoms.length],
    width,
    scale: scales[index % scales.length],
    zIndex: index % 2 === 0 ? 20 : 30,
  }));
}

export function CollectionPetStage({
  pets,
  variant = "card",
}: CollectionPetStageProps) {
  const { locale } = useLocale();
  const layout = getLayout(variant, pets.length);

  return (
    <div className="relative h-full w-full overflow-hidden" aria-label="Collection characters">
      {pets.slice(0, layout.length).map((pet, index) => {
        const placement = layout[index];
        const localizedName = getLocalizedPetName(pet, locale);
        return (
          <Link
            className="group/pet absolute flex h-[82%] items-end justify-center transition-transform duration-200 hover:z-50 hover:-translate-y-1.5 focus-visible:z-50 focus-visible:-translate-y-1.5"
            href={`/pets/${pet.slug}`}
            key={pet.slug}
            aria-label={localizedName}
            style={{
              bottom: placement.bottom,
              left: `${placement.left}%`,
              width: `${placement.width}%`,
              zIndex: placement.zIndex,
            }}
          >
            <img
              className="max-h-full max-w-full object-contain [image-rendering:pixelated] transition-transform duration-200 group-hover/pet:scale-105"
              src={pet.previewImage}
              alt={localizedName}
              loading={variant === "card" ? "lazy" : undefined}
              style={{ transform: `scale(${placement.scale})`, transformOrigin: "bottom center" }}
            />
          </Link>
        );
      })}
    </div>
  );
}
