"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteLogo } from "@/components/site-logo";
import { SubmissionMenu } from "@/components/submission-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { localeFromPathname, localePath } from "@/lib/i18n";

export function SiteHeader() {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const routeLocale = localeFromPathname(pathname);
  const activePath = routeLocale
    ? pathname.replace(new RegExp(`^/${routeLocale}(?=/|$)`), "") || "/"
    : pathname;

  const navItems: { href: string; label: string; matchPrefix?: string }[] = [
    {
      href: localePath(locale, "/"),
      label: t("gallery"),
      matchPrefix: "/pets",
    },
    { href: "/collections", label: t("collections") },
    {
      href: "/rankings",
      label: t("rankings"),
      matchPrefix: "/contributors",
    },
    { href: localePath(locale, "/install"), label: t("install") },
    {
      href: "/requests",
      label: t("requestPlaza"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 px-6 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[1720px] items-center justify-between">
        <Link href={localePath(locale, "/")} className="flex items-center gap-2.5">
          <SiteLogo size={28} />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-text sm:hidden">
            Codex Pet
          </span>
          <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight text-text sm:inline">
            Awesome Codex Pet
          </span>
        </Link>

        <nav
          className="flex items-center gap-1 sm:gap-2"
          aria-label="Primary navigation"
        >
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                activePath ===
                  (routeLocale
                    ? item.href.replace(
                        new RegExp(`^/${routeLocale}(?=/|$)`),
                        "",
                      ) || "/"
                    : item.href) ||
                (item.matchPrefix
                  ? activePath.startsWith(item.matchPrefix)
                  : false) ||
                (item.href !== "/" && activePath.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? "text-text bg-surface"
                      : "text-muted hover:text-text hover:bg-surface/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <a
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-text rounded-md hover:bg-surface/70 transition-colors"
            href="https://github.com/legeling/awesome-codex-pet"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <svg
              className="size-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-sm">{t("github")}</span>
          </a>

          <ThemeToggle />

          <LocaleSwitcher />

          <SubmissionMenu />
        </nav>
      </div>
    </header>
  );
}
