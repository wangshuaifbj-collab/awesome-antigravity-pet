import type { Metadata } from "next";

import HomePage from "@/app/page";
import {
  additionalWebLocales,
  getLocalizedRouteMetadata,
  type AdditionalWebLocale,
} from "@/lib/localized-route-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return additionalWebLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AdditionalWebLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getLocalizedRouteMetadata(locale, "home");
}

export default HomePage;
