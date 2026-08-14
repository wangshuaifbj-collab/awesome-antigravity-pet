"use client";

import { useEffect } from "react";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

type LocalizedDocumentTitleProps = Record<"en" | "zh", string> &
  Partial<Record<Exclude<Locale, "en" | "zh">, string>>;

export function LocalizedDocumentTitle(props: LocalizedDocumentTitleProps) {
  const { locale } = useLocale();

  useEffect(() => {
    const localizedTitle = `${props[locale] ?? props.en} · ${siteConfig.title}`;
    const applyTitle = () => {
      if (document.title !== localizedTitle) {
        document.title = localizedTitle;
      }
    };

    applyTitle();

    // Next may stream route metadata after hydration, so keep the visible tab
    // title aligned with the active client-side locale.
    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale, props]);

  return null;
}
