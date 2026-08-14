"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { RequestActions } from "@/components/request-actions";
import { RequestVisual } from "@/components/request-visual";
import {
  formatRequestDate,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  requestExcerpt,
} from "@/lib/request-display";
import type { PetRequest } from "@/lib/request-catalog";

const cardCopy = {
  en: { updated: "Updated ", completed: "View finished pet" },
  zh: { updated: "更新于 ", completed: "查看已完成宠物" },
  ko: { updated: "업데이트 ", completed: "완성된 펫 보기" },
  ja: { updated: "更新 ", completed: "完成したペットを見る" },
  es: { updated: "Actualizada ", completed: "Ver mascota terminada" },
} as const;

export function RequestCard({
  request,
  onFollowChange,
  compact = false,
}: {
  request: PetRequest;
  onFollowChange?: (number: number, following: boolean) => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const text = cardCopy[locale];
  const thumbnail =
    request.completedPet?.previewImage ?? request.referenceThumbnails?.[0];
  const legacyOriginalFallback =
    !request.completedPet && thumbnail ? request.referenceImages[0] : undefined;

  return (
    <article
      className={`group overflow-hidden rounded-lg border border-border bg-bg-elevated transition-colors hover:border-border-hover ${
        compact
          ? "grid h-60 min-w-[300px] grid-cols-[128px_minmax(0,1fr)]"
          : "flex h-[35rem] flex-col"
      }`}
    >
      <Link
        aria-label={request.character}
        className={compact ? "block h-full min-h-0" : "block h-56 shrink-0"}
        href={`/requests/${request.number}`}
      >
        <RequestVisual
          category={request.category}
          className={compact ? "h-full w-full" : "h-full w-full p-3"}
          fallbackImage={legacyOriginalFallback}
          image={thumbnail}
          name={request.character}
        />
      </Link>
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${compact ? "p-4" : "p-5"}`}
      >
        <div className="flex h-7 min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs">
          <span className="rounded-md bg-accent-light px-2 py-1 font-medium text-accent">
            {getRequestStatusLabel(request.status, locale)}
          </span>
          <span className="text-muted">
            {getRequestCategoryLabel(request.category, locale)}
          </span>
          {request.version ? (
            <span className="font-mono uppercase text-muted">
              {request.version}
            </span>
          ) : null}
        </div>
        <Link
          className={`block overflow-hidden font-semibold leading-snug text-text transition-colors group-hover:text-accent ${
            compact
              ? "mt-2 h-10 text-base [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              : "mt-3 h-12 text-lg [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
          }`}
          href={`/requests/${request.number}`}
        >
          {request.character}
        </Link>
        <p
          aria-hidden={request.franchise ? undefined : true}
          className="mt-1 h-5 truncate text-sm text-muted"
        >
          {request.franchise || "\u00a0"}
        </p>
        {!compact ? (
          <p
            aria-hidden={request.visualDirection ? undefined : true}
            className="mt-3 h-[4.5rem] overflow-hidden text-sm leading-6 text-text-secondary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
          >
            {request.visualDirection
              ? requestExcerpt(request.visualDirection)
              : "\u00a0"}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="mt-auto flex min-w-0 items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted">
          <span className="shrink-0">#{request.number}</span>
          <span className="truncate text-right">
            {text.updated}
            {formatRequestDate(request.updatedAt, locale)}
          </span>
        </div>
        <div className="mt-3">
          {request.completedPet ? (
            <Link
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-text px-4 text-sm font-medium text-bg transition-opacity hover:opacity-85"
              href={`/pets/${request.completedPet.slug}`}
            >
              {text.completed}
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <RequestActions
              compact={compact}
              disabled={request.status === "declined"}
              initialSupporters={request.reactions}
              number={request.number}
              onFollowChange={onFollowChange}
            />
          )}
        </div>
      </div>
    </article>
  );
}
