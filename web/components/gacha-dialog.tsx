"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PetInstallMenu } from "@/components/pet-install-menu";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import { drawGachaPets } from "@/lib/gacha";
import { getLocalizedCategoryLabel } from "@/lib/pet-localization";
import type { GalleryPet } from "@/lib/pets";

type GachaDialogProps = {
  pets: GalleryPet[];
  onOpenRequest?: () => Promise<unknown>;
};

type DrawCount = 1 | 3;

function DiceIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
    >
      <rect height="15" rx="2.5" width="15" x="4.5" y="4.5" />
      <circle cx="8.5" cy="8.5" fill="currentColor" r="1" stroke="none" />
      <circle cx="15.5" cy="15.5" fill="currentColor" r="1" stroke="none" />
      <circle cx="15.5" cy="8.5" fill="currentColor" r="1" stroke="none" />
      <circle cx="8.5" cy="15.5" fill="currentColor" r="1" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.4}
    >
      <path
        d="m5 12 4.5 4.5L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GachaMachine({
  pets,
  isDrawing,
  stageLabel,
}: {
  pets: GalleryPet[];
  isDrawing: boolean;
  stageLabel: string;
}) {
  return (
    <div
      className={`gacha-machine-stage ${isDrawing ? "gacha-machine-stage--drawing" : ""}`}
      aria-hidden="true"
    >
      <div className="gacha-machine-stage__header">
        <span className="gacha-machine-stage__status" />
        <span>{stageLabel}</span>
        <span className="gacha-machine-stage__count">
          {String(pets.length).padStart(3, "0")}
        </span>
      </div>
      <div className="gacha-machine-art">
        <img
          alt=""
          className="gacha-machine-art__image"
          draggable="false"
          src="/gacha/pet-discovery-machine.webp"
        />
      </div>
    </div>
  );
}

function ResultCard({ pet }: { pet: GalleryPet }) {
  const { locale, t } = useLocale();
  const name = getLocalizedPetName(pet, locale);
  return (
    <article className="gacha-result-card">
      <Link
        aria-label={`${t("view")} ${name}`}
        className="gacha-result-card__visual"
        href={`/pets/${pet.slug}`}
      >
        <img
          alt={`${name} preview`}
          className="gacha-result-card__image"
          src={pet.previewImage}
        />
      </Link>
      <div className="gacha-result-card__body">
        <div className="gacha-result-card__title-row">
          <Link className="gacha-result-card__name" href={`/pets/${pet.slug}`}>
            {name}
          </Link>
          <span className="gacha-result-card__category">
            {getLocalizedCategoryLabel(pet.categoryLabel, locale)}
          </span>
        </div>
        <p className="gacha-result-card__author">
          {t("by")} {pet.author_handle ?? pet.author}
        </p>
      </div>
      <div className="gacha-result-card__actions">
        <Link className="gacha-result-card__view" href={`/pets/${pet.slug}`}>
          {t("view")}
        </Link>
        <PetInstallMenu pet={pet} />
      </div>
    </article>
  );
}

export function GachaDialog({ pets, onOpenRequest }: GachaDialogProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [drawCount, setDrawCount] = useState<DrawCount>(1);
  const [results, setResults] = useState<GalleryPet[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const hasAvailablePets = useMemo(
    () => pets.some((pet) => pet.previewImage && pet.animatedPreviewImage),
    [pets],
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const previousSlugs = useRef<string[]>([]);
  const wasOpenRef = useRef(false);

  const close = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, open]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  function draw() {
    if (isDrawing || isPreparing || !hasAvailablePets) return;
    setIsDrawing(true);
    setResults([]);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const delay = reducedMotion ? 0 : 520;
    timerRef.current = window.setTimeout(() => {
      const nextResults = drawGachaPets(pets, drawCount, previousSlugs.current);
      previousSlugs.current = nextResults.map((pet) => pet.slug);
      setResults(nextResults);
      setIsDrawing(false);
      timerRef.current = null;
    }, delay);
  }

  function openDialog() {
    previousSlugs.current = [];
    setResults([]);
    setOpen(true);
    if (onOpenRequest) {
      setIsPreparing(true);
      void onOpenRequest()
        .catch(() => undefined)
        .finally(() => setIsPreparing(false));
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={t("gachaOpen")}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent-light px-3 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={openDialog}
        title={t("gachaOpen")}
        type="button"
      >
        <DiceIcon />
        <span className="hidden sm:inline">{t("gachaOpen")}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          role="presentation"
        >
          <div
            aria-describedby="gacha-description"
            aria-labelledby="gacha-title"
            className="gacha-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-t-lg border border-border bg-bg-elevated p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-lg sm:p-7"
            role="dialog"
            aria-modal="true"
          >
            <div className="gacha-dialog-header">
              <div className="min-w-0">
                <div className="gacha-dialog-eyebrow">
                  <span className="gacha-dialog-eyebrow__mark" />
                  {t("gachaStageLabel")}
                </div>
                <h2
                  className="mt-2 text-2xl font-semibold tracking-tight text-text"
                  id="gacha-title"
                >
                  {t("gachaTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted" id="gacha-description">
                  {t("gachaDescription")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="gacha-dialog-free">{t("gachaFreeNote")}</span>
                <button
                  ref={closeRef}
                  aria-label={t("gachaClose")}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  onClick={close}
                  title={t("gachaClose")}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {!results.length ? (
              <div className="gacha-dialog-content">
                <GachaMachine
                  pets={pets}
                  isDrawing={isDrawing}
                  stageLabel={t("gachaStageLabel")}
                />
                <div className="gacha-controls">
                  <div className="gacha-controls__label-row">
                    <span>{t("gachaDrawCountLabel")}</span>
                  </div>
                  <div className="gacha-count-selector">
                    {([1, 3] as const).map((value) => (
                      <button
                        aria-pressed={drawCount === value}
                        className={`gacha-count-option ${
                          drawCount === value
                            ? "gacha-count-option--active"
                            : ""
                        }`}
                        key={value}
                        onClick={() => setDrawCount(value)}
                        type="button"
                      >
                        <span className="gacha-count-option__number">
                          {String(value).padStart(2, "0")}
                        </span>
                        <span>
                          {t(value === 1 ? "gachaSingle" : "gachaTriple")}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    aria-live="polite"
                    className="gacha-start-button"
                    disabled={isDrawing || isPreparing || !hasAvailablePets}
                    onClick={draw}
                    type="button"
                  >
                    <DiceIcon />
                    <span>
                      {isDrawing ? t("gachaDrawing") : t("gachaStart")}
                    </span>
                    <svg
                      aria-hidden="true"
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M5 12h13m-5-5 5 5-5 5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="gacha-controls__note">
                    <CheckIcon />
                    <span>{t("gachaRuleNote")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div aria-live="polite" className="gacha-results-header">
                  <span className="gacha-results-header__icon">
                    <CheckIcon />
                  </span>
                  {t("gachaComplete", { count: results.length })}
                </div>
                <div className="gacha-results-grid">
                  {results.map((pet) => (
                    <ResultCard key={pet.slug} pet={pet} />
                  ))}
                </div>
                <button
                  className="gacha-again-button"
                  onClick={() => {
                    setResults([]);
                    setDrawCount(results.length === 3 ? 3 : 1);
                  }}
                  type="button"
                >
                  <DiceIcon />
                  <span>{t("gachaDrawAgain")}</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
