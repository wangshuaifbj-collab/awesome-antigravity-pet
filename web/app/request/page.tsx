import type { Metadata } from "next";

import { RequestPageContent } from "@/components/request-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { getAllPets } from "@/lib/pets";
import { languageAlternates } from "@/lib/localized-route-metadata";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

const title = "Request a Codex pet for free";
const description =
  "Request a V2 Codex pet for free with a short no-account form. Enter the character name and upload a reference image or use a public link; community contributors may volunteer to make it.";
const pageUrl = `${siteConfig.url}/request`;
const faq = [
  {
    question: "Does it cost money to request a Codex pet?",
    answer:
      "No. Opening a request is free. Community contributors may volunteer to create it, but completion and acceptance are not guaranteed.",
  },
  {
    question: "Can I request an anime or game character?",
    answer:
      "Yes. The character name and a reference image are required. The original work and visual preferences are optional; the online form accepts an upload or public link.",
  },
  {
    question: "Do I need to make the spritesheet myself?",
    answer:
      "No. A clear character or concept is enough for the V2 request queue.",
  },
] as const;

export const metadata: Metadata = {
  title,
  description,
  keywords: withSiteKeywords([
    "request Codex pet",
    "free Codex pet request",
    "ask community to make Codex pet",
    "anime Codex pet request",
    "game character Codex pet request",
    "custom Codex pet request",
    "申请 Codex 宠物",
    "免费申请 Codex 小宠物",
    "动漫角色 Codex 宠物申请",
    "游戏角色 Codex 宠物申请",
    "请社区制作 Codex 宠物",
    "定制 Codex 桌面宠物",
  ]),
  alternates: {
    canonical: "/request",
    languages: languageAlternates("/request"),
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "ko_KR", "ja_JP", "es_ES"],
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [siteConfig.ogImage],
  },
};

export default function RequestPage() {
  const pets = getAllPets();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#page`,
        name: title,
        description,
        url: pageUrl,
        inLanguage: "en",
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: [
          "Free community Codex pet requests",
          "Anime and game character Codex pets",
          "Volunteer-created desktop companions",
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${pageUrl}/#howto`,
        name: "How to request a Codex pet from the community",
        description,
        totalTime: "PT5M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Name the character",
            text: "Enter the character or concept. New requests use V2 automatically.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Add optional details",
            text: "Upload the required reference image or provide a public image link, then optionally add the original work and visual preferences.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Submit without an account",
            text: "Complete the human verification and submit the free community request.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}/#faq`,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
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
      <RequestPageContent locale="en" petCount={pets.length} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
