import type { Metadata } from "next";

import { RequestPageContent } from "@/components/request-page-content";
import { getAllPets } from "@/lib/pets";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";
import { languageAlternates } from "@/lib/localized-route-metadata";

const title = "免费申请制作喜欢角色的 Codex 小宠物";
const description =
  "无需账号，通过简短表单免费提交 V2 Codex 小宠物制作申请。请填写角色名称并上传参考图片或粘贴公开链接，社区贡献者可能会志愿认领并免费制作。";
const pageUrl = `${siteConfig.url}/zh/request`;
const faq = [
  {
    question: "申请制作 Codex 小宠物收费吗？",
    answer:
      "不收费。创建申请完全免费，社区贡献者可能志愿制作，但项目不承诺一定收录或完成时间。",
  },
  {
    question: "可以申请动漫或游戏人物吗？",
    answer:
      "可以。角色名称和参考图片为必填；在线表单支持直接上传图片或使用公开链接，所属作品和外观偏好可选。",
  },
  {
    question: "申请人需要自己制作 spritesheet 吗？",
    answer:
      "不需要。申请阶段只需提供角色信息和公开参考图片，新申请默认使用 V2。",
  },
] as const;

export const metadata: Metadata = {
  title,
  description,
  keywords: withSiteKeywords([
    "免费申请 Codex 小宠物",
    "Codex 宠物制作申请",
    "请社区制作 Codex 宠物",
    "动漫 Codex 宠物申请",
    "游戏人物 Codex 宠物申请",
    "定制 Codex 小宠物",
    "免费制作 Codex 宠物",
    "原创角色 Codex 宠物",
    "吉祥物 Codex 宠物申请",
    "动物 Codex 宠物申请",
    "Codex 桌面宠物定制",
  ]),
  alternates: {
    canonical: "/zh/request",
    languages: languageAlternates("/request"),
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ko_KR", "ja_JP", "es_ES"],
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [siteConfig.ogImage],
  },
};

export default function ChineseRequestPage() {
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
        inLanguage: "zh-CN",
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: [
          "免费社区 Codex 小宠物制作申请",
          "动漫和游戏人物 Codex 宠物",
          "社区志愿制作桌面伙伴",
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${pageUrl}/#howto`,
        name: "如何向社区申请制作 Codex 小宠物",
        description,
        totalTime: "PT5M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "填写角色名称",
            text: "填写角色或概念名称，新申请自动使用 V2。",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "按需补充资料",
            text: "上传参考图片或提供公开图片链接，再按需补充所属作品和外观偏好。",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "无需账号提交",
            text: "完成人机验证后直接提交免费社区制作申请。",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}/#faq`,
        inLanguage: "zh-CN",
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
      <RequestPageContent locale="zh" petCount={pets.length} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
