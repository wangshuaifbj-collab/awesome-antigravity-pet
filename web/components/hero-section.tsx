"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import { localePath } from "@/lib/i18n";
import type { GalleryPet } from "@/lib/pets";

type HeroSectionProps = {
  petCount: number;
  categoryCount: number;
  featured: GalleryPet[];
};

export function HeroSection({
  petCount,
  categoryCount,
  featured,
}: HeroSectionProps) {
  const { t, locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const hotPets = featured.slice(0, 6);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative isolate overflow-hidden pt-20 pb-24 px-6">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div className="mx-auto max-w-[1720px]">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg/80 backdrop-blur border border-border text-accent text-xs font-medium mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {t("heroBadge", { count: petCount })}
          </div>

          {/* Title */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {t("heroTitle1")}
            <br />
            <span className="text-accent">{t("heroTitle2")}</span>
          </h1>

          {/* Description */}
          <p
            className={`text-lg sm:text-xl text-muted leading-relaxed max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {t("heroDesc")}
          </p>

          {/* Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Link
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all shadow-sm hover:shadow-md"
              href="#gallery"
            >
              {t("heroExplore")}
              <svg
                className="size-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Link>
            <Link
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-bg/60 backdrop-blur text-sm font-medium text-text hover:bg-surface transition-colors"
              href={localePath(locale, "/request")}
            >
              {t("heroSubmit")}
              <svg
                className="size-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>

          {/* Stats strip */}
          <div
            className={`mt-14 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto transition-all duration-700 delay-[400ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <StatCard value={petCount.toString()} label={t("heroStatPets")} />
            <StatCard
              value={categoryCount.toString()}
              label={t("heroStatCategories")}
            />
            <StatCard
              value={t("heroStatLicenseValue")}
              label={t("heroStatLicense")}
              compact
            />
          </div>
        </div>

        {/* Featured pets */}
        {hotPets.length > 0 ? (
          <div
            className={`mt-20 transition-all duration-1000 delay-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="mx-auto grid max-w-6xl grid-cols-4 items-end gap-3 sm:gap-7 md:grid-cols-5 lg:grid-cols-6">
              {hotPets.map((pet, i) => (
                <Link
                  key={pet.slug}
                  href={`/pets/${pet.slug}`}
                  className={`group min-w-0 flex-col items-center gap-2 ${
                    i === 4 ? "hidden md:flex" : i === 5 ? "hidden lg:flex" : ""
                  } ${i < 4 ? "flex" : ""}`}
                >
                  <div className="hero-pet-frame relative flex h-24 w-20 items-end justify-center overflow-hidden rounded-lg border border-border bg-bg-elevated px-1 pb-2 pt-1 shadow-sm transition-[border-color,box-shadow] duration-300 group-hover:border-border-hover group-hover:shadow-xl sm:h-36 sm:w-28 lg:h-44 lg:w-36">
                    <div
                      className="hero-pet-float flex size-full items-end justify-center"
                      style={{
                        animationDelay: `${i * 0.45}s`,
                      }}
                    >
                      <img
                        className="hero-pet-character max-h-full max-w-full object-contain [image-rendering:pixelated]"
                        src={pet.animatedPreviewImage}
                        alt={getLocalizedPetName(pet, locale)}
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <span className="max-w-full truncate text-xs font-medium text-muted transition-colors group-hover:text-text">
                    {getLocalizedPetName(pet, locale)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg/60 backdrop-blur px-4 py-3 sm:py-4">
      <div
        className={`font-semibold tracking-tight text-text ${
          compact ? "text-sm sm:text-base" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] sm:text-xs text-muted mt-0.5 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
