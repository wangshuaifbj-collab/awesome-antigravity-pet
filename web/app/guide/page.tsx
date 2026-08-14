import type { Metadata } from "next";

import { GuidePageContent } from "@/components/guide-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { getCategoryCatalog } from "@/lib/categories";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

const title = "Craft and submit a selected Codex pet";
const description =
  "A complete guide to Codex pet V1 and V2, action-by-action craft, transparent edge cleanup, packaging, review, submission, and community sharing.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guide" },
  keywords: withSiteKeywords([
    "create Codex pet",
    "submit Codex pet",
    "Codex pet V1",
    "Codex pet V2",
    "Codex spritesheet guide",
    "制作 Codex 宠物",
    "投稿 Codex 宠物",
    "Codex 宠物制作教程",
    "Codex 宠物 spritesheet",
    "Codex V2 宠物制作",
    "Codex 宠物动画",
    "Codex 宠物投稿指南",
  ]),
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/guide`,
    type: "article",
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

export default function GuidePage() {
  const categories = getCategoryCatalog();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${siteConfig.url}/guide/#article`,
    headline: title,
    description,
    url: `${siteConfig.url}/guide`,
    mainEntityOfPage: `${siteConfig.url}/guide`,
    author: {
      "@id": `${siteConfig.url}/#organization`,
    },
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    inLanguage: ["en", "zh-CN"],
    about: [
      "Codex pet V1 and V2 spritesheets",
      "animation action design",
      "transparent edge cleanup",
      "pet packaging and submission",
    ],
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Craft and submit a selected Codex pet"
        zh="制作与投稿 Codex 宠物"
      />
      <GuidePageContent categories={categories} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
