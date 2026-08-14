"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { SiteLogo } from "@/components/site-logo";
import { localeConfig, localePath } from "@/lib/i18n";

export function SiteFooter() {
  const { locale, t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-bg-secondary/40 px-6">
      <div className="mx-auto max-w-[1720px] py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <SiteLogo size={26} />
              <span className="text-sm font-semibold text-text">
                Awesome Codex Pet
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-sm">
              {t("footerTagline")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text mb-3">
              {t("footerLinksTitle")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/collections"
                >
                  {t("collections")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/"
                >
                  {t("gallery")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/rankings"
                >
                  {t("rankings")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href={localePath(locale, "/install")}
                >
                  {t("install")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/requests"
                >
                  {t("requestPlaza")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href={localePath(locale, "/request")}
                >
                  {t("requestPet")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href={localePath(locale, "/")}
                  hrefLang={localeConfig[locale].htmlLang}
                >
                  {localeConfig[locale].label} · Awesome Codex Pet
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text mb-3">
              {t("footerCommunityTitle")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="text-muted hover:text-text transition-colors"
                  href="https://github.com/legeling/awesome-codex-pet"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("github")}
                </a>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/guide"
                >
                  {t("guide")}
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-text transition-colors"
                  href="/guide"
                >
                  {t("contributing")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-muted">© {year} Awesome Codex Pet</p>
          <p className="text-xs text-muted">{t("footerLicenseLine")}</p>
        </div>
      </div>
    </footer>
  );
}
