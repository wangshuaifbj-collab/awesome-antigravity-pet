"use client";

import { usePathname, useRouter } from "next/navigation";

import { ActionDropdown } from "@/components/action-dropdown";
import { useLocale } from "@/components/locale-provider";
import {
  type Locale,
  localeConfig,
  localeFromPathname,
  localePath,
  supportedLocales,
} from "@/lib/i18n";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const routeLocale = localeFromPathname(pathname);
    const basePath = routeLocale
      ? pathname.replace(new RegExp(`^/${routeLocale}(?=/|$)`), "") || "/"
      : pathname;
    if (basePath === "/" || basePath === "/install" || basePath === "/request") {
      router.push(localePath(nextLocale, basePath));
    }
  }

  return (
    <ActionDropdown
      label="Language"
      menuWidth={164}
      triggerClassName="inline-flex h-9 w-[104px] cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-bg-elevated px-3 text-xs font-medium text-text transition-colors hover:border-border-hover hover:bg-bg-secondary"
      trigger={
        <>
          <span className="truncate">{localeConfig[locale].label}</span>
          <svg
            aria-hidden="true"
            className="size-3 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="m7 10 5 5 5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      }
    >
      <div className="p-1" role="none">
        {supportedLocales.map((item) => {
          const selected = item === locale;
          return (
            <button
              aria-checked={selected}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? "bg-surface text-text"
                  : "text-muted hover:bg-surface hover:text-text"
              }`}
              key={item}
              onClick={() => changeLocale(item)}
              role="menuitemradio"
              type="button"
            >
              <span>{localeConfig[item].label}</span>
              {selected ? (
                <svg
                  aria-hidden="true"
                  className="size-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.25}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </ActionDropdown>
  );
}
