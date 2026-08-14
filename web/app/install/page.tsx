import type { Metadata } from "next";

import { InstallPageContent } from "@/components/install-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { languageAlternates } from "@/lib/localized-route-metadata";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

const title = "Install a Codex pet in seconds";
const description =
  "One-command installer for Codex pets on macOS, Linux, and Windows. Pick a pet from the gallery, copy the script, and your spritesheet pet is ready in ~/.codex/pets/.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/install",
    languages: languageAlternates("/install"),
  },
  keywords: withSiteKeywords([
    "install Codex pet",
    "how to install Codex pet",
    "Codex pet download",
    "Codex pet not showing",
    "Codex /pet not working",
    "refresh custom Codex pets",
    "OpenAI Codex custom pet",
    "Codex pet macOS",
    "Codex pet Windows",
    "Codex pet Linux",
    "安装 Codex 宠物",
    "下载 Codex 小宠物",
    "Codex 宠物安装教程",
    "Codex 自定义宠物安装",
    "macOS 安装 Codex 宠物",
    "Windows 安装 Codex 宠物",
    "Linux 安装 Codex 宠物",
    "Codex 宠物不显示",
  ]),
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/install`,
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN", "ko_KR", "ja_JP", "es_ES"],
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

export default function InstallPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${siteConfig.url}/install/#howto`,
        name: title,
        description,
        url: `${siteConfig.url}/install`,
        inLanguage: ["en", "zh-CN"],
        totalTime: "PT2M",
        tool: [
          {
            "@type": "HowToTool",
            name: "ChatGPT with Codex, Bash, or PowerShell",
          },
        ],
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Choose a Codex pet",
            text: "Open the gallery, choose a pet, and preview its complete animation set.",
            url: `${siteConfig.url}/#gallery`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Install the pet",
            text: "Open the prepared task in ChatGPT or run the Bash or PowerShell command from the pet page.",
            url: `${siteConfig.url}/install`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Enable it in Codex",
            text: "Restart Codex, open Settings, choose Pets, and activate the installed custom pet.",
            url: `${siteConfig.url}/install`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/install/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Where are custom Codex pets installed?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each pet is installed under pets/<pet-id>/ in the Codex home directory, which is ~/.codex by default.",
            },
          },
          {
            "@type": "Question",
            name: "Why is my Codex pet not showing after installation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Confirm that pet.json and spritesheet.webp exist, make sure pet.json.id matches the folder name, restart Codex, and reopen Settings → Pets. Reinstalling an existing pet id requires --force (or -Force in PowerShell).",
            },
          },
          {
            "@type": "Question",
            name: "Can Codex V1 and V2 pets be installed together?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The sprite version belongs to each pet package, so pets with different ids can coexist.",
            },
          },
        ],
      },
    ],
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
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
