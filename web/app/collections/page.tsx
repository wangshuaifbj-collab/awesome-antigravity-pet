import type { Metadata } from "next";

import { CollectionsPageContent } from "@/components/collections-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { getCollections } from "@/lib/collection-catalog";
import { toCollectionCardData } from "@/lib/collections";
import { getAllPets } from "@/lib/pets";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

const title = "Codex pet series and themed collections";
const description =
  "Browse franchise series and themed Codex pet collections, including Genshin Impact, Honkai: Star Rail, ONIMAI, and community animal companions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/collections" },
  keywords: withSiteKeywords([
    "Codex pet collections",
    "Codex pet series",
    "Codex character collections",
    "Codex franchise pets",
    "anime Codex pets",
    "game character Codex pets",
    "Codex 宠物合集",
    "Codex 宠物系列",
    "Codex 角色合集",
    "Codex 作品系列",
    "动漫 Codex 宠物",
    "游戏角色 Codex 宠物",
  ]),
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/collections`,
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    images: [
      {
        url: siteConfig.ogImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [siteConfig.ogImage],
  },
};

export default function CollectionsPage() {
  const collections = getCollections(getAllPets());
  const collectionCards = collections.map(toCollectionCardData);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteConfig.url}/collections/#collections`,
    name: title,
    description,
    url: `${siteConfig.url}/collections`,
    isPartOf: {
      "@id": `${siteConfig.url}/#website`,
    },
    inLanguage: ["en", "zh-CN"],
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: collections.length,
      itemListElement: collections.map((collection, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${collection.title.en} / ${collection.title.zh}`,
        url: `${siteConfig.url}/collections/${collection.slug}`,
      })),
    },
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Codex pet series and themed collections"
        zh="Codex 宠物系列与主题合集"
      />
      <CollectionsPageContent collections={collectionCards} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
