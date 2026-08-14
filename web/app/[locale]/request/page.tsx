import type { Metadata } from "next";

import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { RequestPageContent } from "@/components/request-page-content";
import { localeConfig, localePath } from "@/lib/i18n";
import {
  additionalWebLocales,
  getLocalizedPageCopy,
  getLocalizedRouteMetadata,
  type AdditionalWebLocale,
} from "@/lib/localized-route-metadata";
import { getAllPets } from "@/lib/pets";
import { siteConfig } from "@/lib/site";

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
  return getLocalizedRouteMetadata(locale, "request");
}

export default async function LocalizedRequestPage({
  params,
}: {
  params: Promise<{ locale: AdditionalWebLocale }>;
}) {
  const { locale } = await params;
  const copy = getLocalizedPageCopy(locale, "request");
  const pageUrl = `${siteConfig.url}${localePath(locale, "/request")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}/#page`,
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    inLanguage: localeConfig[locale].htmlLang,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    isAccessibleForFree: true,
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Request a Codex pet for free"
        es="Pide gratis una mascota Codex"
        ja="Codex ペットを無料でリクエスト"
        ko="무료 Codex 펫 제작 요청"
        zh="免费申请 Codex 宠物"
      />
      <RequestPageContent locale={locale} petCount={getAllPets().length} />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
