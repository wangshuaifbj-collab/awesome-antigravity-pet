import type { Metadata } from "next";

import { RankingsPageContent } from "@/components/rankings-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { getLeaderboardData } from "@/lib/leaderboards";
import { getAllPets } from "@/lib/pets";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

const title = "Codex pet rankings / Codex 宠物排行榜";
const description =
  "Weekly and all-time Codex pet, creator, and collection rankings based on installs and likes. 查看按安装与点赞形成的热门 Codex 宠物、贡献者和系列榜单。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/rankings" },
  keywords: withSiteKeywords([
    "Codex pet rankings",
    "popular Codex pets",
    "trending Codex pets",
    "best Codex pets",
    "most installed Codex pets",
    "Codex pet creators",
    "Codex pet contributors",
    "Codex pet collections ranking",
    "Codex pet weekly ranking",
    "Codex pet all-time ranking",
    "most liked Codex pets",
    "community pet leaderboard",
    "Codex 宠物排行榜",
    "热门 Codex 宠物",
    "Codex 小宠物排行",
    "Codex 宠物周榜",
    "Codex 宠物总榜",
    "Codex 宠物安装排行",
    "Codex 宠物作者排行",
    "Codex 宠物贡献者",
    "Codex 宠物系列排行",
    "Codex 宠物点赞",
    "社区宠物排行榜",
  ]),
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/rankings`,
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

export default function RankingsPage() {
  const data = getLeaderboardData(getAllPets());
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteConfig.url}/rankings/#community-rankings`,
    name: title,
    alternateName: "Codex 宠物社区排行榜",
    description,
    url: `${siteConfig.url}/rankings`,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    inLanguage: ["en", "zh-CN"],
    keywords: metadata.keywords,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.pets.length,
      itemListElement: [...data.pets]
        .sort((a, b) => b.weeklyScore - a.weeklyScore)
        .slice(0, 20)
        .map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.pet.localizedNames.en ?? entry.pet.name,
          url: `${siteConfig.url}/pets/${entry.pet.slug}`,
        })),
    },
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Codex pet rankings"
        zh="Codex 宠物排行榜"
      />
      <RankingsPageContent data={data} />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}
