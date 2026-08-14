import type { Metadata } from "next";

import { InstallPageContent } from "@/components/install-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { localeConfig, localePath } from "@/lib/i18n";
import {
  additionalWebLocales,
  getLocalizedPageCopy,
  getLocalizedRouteMetadata,
  type AdditionalWebLocale,
} from "@/lib/localized-route-metadata";
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
  return getLocalizedRouteMetadata(locale, "install");
}

export default async function LocalizedInstallPage({
  params,
}: {
  params: Promise<{ locale: AdditionalWebLocale }>;
}) {
  const { locale } = await params;
  const copy = getLocalizedPageCopy(locale, "install");
  const pageUrl = `${siteConfig.url}${localePath(locale, "/install")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${pageUrl}/#howto`,
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    inLanguage: localeConfig[locale].htmlLang,
    totalTime: "PT2M",
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Install a Codex pet in seconds"
        es="Cómo instalar una mascota Codex"
        ja="Codex ペットのインストール方法"
        ko="Codex 펫 설치 방법"
        zh="快速安装 Codex 宠物"
      />
      <InstallPageContent />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
