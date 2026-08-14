"use client";

import { useLocale } from "@/components/locale-provider";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const nextLabel =
    theme === "dark" ? t("switchToLightMode") : t("switchToDarkMode");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-bg-elevated text-muted transition-colors hover:border-border-hover hover:bg-bg-secondary hover:text-text cursor-pointer"
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === "dark" ? (
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.114 6.364-1.59-1.59M7.476 7.476l-1.59-1.59m12.228 0-1.59 1.59M7.476 16.524l-1.59 1.59M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3c-.022.149-.033.301-.033.455A7.5 7.5 0 0018.545 10.8c.154 0 .306-.011.455-.033z"
          />
        </svg>
      )}
    </button>
  );
}
