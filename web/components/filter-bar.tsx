"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { getLocalizedCategoryLabel } from "@/lib/pet-localization";
import type { LocalizedCategoryLabel } from "@/lib/pets";

export type CategoryFilterOption = {
  name: string;
  label: LocalizedCategoryLabel;
  count: number;
};

type FilterBarProps = {
  categories: CategoryFilterOption[];
  onChange: (filters: { query: string; categories: string[] }) => void;
  onInteract?: () => void;
};

export function FilterBar({
  categories,
  onChange,
  onInteract,
}: FilterBarProps) {
  const { locale, t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    onChange({
      query: deferredQuery.trim(),
      categories: selectedCategories,
    });
  }, [deferredQuery, onChange, selectedCategories]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  return (
    <div className="mb-8 space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          className="h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-20 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-border-hover focus:ring-2 focus:ring-accent/20"
          type="search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(event) => {
            onInteract?.();
            setQuery(event.target.value);
          }}
          onFocus={onInteract}
          aria-label={t("searchPlaceholder")}
        />
        {query ? (
          <button
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-text"
            type="button"
            aria-label={t("clearSearch")}
            title={t("clearSearch")}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted sm:inline">
            /
          </kbd>
        )}
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t("filterCategories")}
      >
        <button
          className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors active:translate-y-px ${
            selectedCategories.length === 0
              ? "border-accent bg-accent text-white"
              : "border-border bg-bg-elevated text-text hover:border-border-hover hover:bg-surface"
          }`}
          type="button"
          aria-pressed={selectedCategories.length === 0}
          onClick={() => {
            onInteract?.();
            setSelectedCategories([]);
          }}
        >
          {t("allCategories")}
        </button>
        {categories.map((category) => {
          const selected = selectedCategories.includes(category.name);
          return (
            <button
              className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors active:translate-y-px ${
                selected
                  ? "border-accent bg-accent-light text-accent"
                  : "border-border bg-bg-elevated text-text hover:border-border-hover hover:bg-surface"
              }`}
              key={category.name}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onInteract?.();
                toggleCategory(category.name);
              }}
            >
              <span>{getLocalizedCategoryLabel(category.label, locale)}</span>
              <span className="tabular-nums text-[11px] text-muted">
                {category.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
