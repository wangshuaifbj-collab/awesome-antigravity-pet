import type { Locale } from "@/lib/i18n";

export type CategoryLabel = {
  en: string;
  zh: string;
  ko?: string;
  ja?: string;
  es?: string;
};

export function getLocalizedCategoryLabel(
  label: CategoryLabel,
  locale: Locale,
) {
  return label[locale] ?? label.en;
}
