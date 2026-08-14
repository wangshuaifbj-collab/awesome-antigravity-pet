import type { Metadata } from "next";
import Link from "next/link";

import { getAllPets } from "@/lib/pets";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";
import { languageAlternates } from "@/lib/localized-route-metadata";

const title = "Codex 小宠物画廊：免费下载、安装与社区制作申请";
const description =
  "像逛免费宠物商店一样浏览精选 Codex 小宠物，预览动漫、游戏、吉祥物、动物与原创角色的完整动作并一键安装；没有想要的角色时，可免费提交社区制作申请。";

const faq = [
  {
    question: "Codex 小宠物有什么用？",
    answer:
      "Codex 宠物是会跟随任务状态切换动作的桌面伙伴。它可以在等待、运行、审查或失败等状态中播放不同动画，让 Codex 的工作状态更直观，也能用喜欢的动漫、游戏角色或原创形象个性化桌面。",
  },
  {
    question: "在哪里下载和安装 Codex 宠物？",
    answer:
      "先在 Awesome Codex Pet 画廊预览完整动作，再从宠物详情页交给 ChatGPT 中的 Codex 安装，或复制 macOS、Linux、Windows 对应命令。安装不需要克隆整个素材仓库。",
  },
  {
    question: "Codex 宠物安装后不显示怎么办？",
    answer:
      "确认宠物目录中同时存在 pet.json 与 spritesheet.webp，检查 pet.json.id 是否与文件夹名一致，然后重启 Codex 并重新打开“设置 → 宠物”。",
  },
  {
    question: "没有喜欢的角色，可以申请社区制作吗？",
    answer:
      "可以。提交角色名称和公开参考图即可免费创建申请，所属作品与制作偏好可以补充，不要求自己制作 spritesheet。社区贡献者可能会志愿认领并免费制作，但申请不代表承诺交付或完成时间。",
  },
  {
    question: "这是 Codex pets 官方网站吗？",
    answer:
      "Awesome Codex Pet 是独立的开源社区宠物画廊，不是 OpenAI 官方产品。网站保留作者、来源和许可证信息，并提供公开仓库、校验脚本与投稿记录。",
  },
] as const;

export const metadata: Metadata = {
  title: {
    absolute: `${title} · ${siteConfig.title}`,
  },
  description,
  keywords: withSiteKeywords([
    "Codex 小宠物",
    "Codex 宠物",
    "Codex 宠物网站",
    "Codex 宠物社区",
    "Codex 宠物下载",
    "Codex 宠物安装",
    "Codex 小宠物商店",
    "免费 Codex 宠物",
    "Codex 宠物制作申请",
    "免费申请 Codex 小宠物",
    "请社区制作 Codex 宠物",
    "Codex 宠物制作",
    "Codex 小宠物制作",
    "Codex 宠物自定义",
    "Codex 宠物不显示",
    "Codex 宠物有什么用",
    "Codex 宠物 skill",
    "Hatch Pet skill",
    "ChatGPT 桌面宠物",
    "动漫 Codex 宠物",
    "游戏角色 Codex 宠物",
    "像素 Codex 宠物",
    "Codex 桌面伙伴",
    "Codex 宠物排行榜",
    "Codex 宠物合集",
    "热门 Codex 小宠物",
  ]),
  alternates: {
    canonical: "/zh",
    languages: languageAlternates("/"),
  },
  openGraph: {
    title,
    description,
    url: `${siteConfig.url}/zh`,
    type: "article",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ko_KR", "ja_JP", "es_ES"],
    images: [
      {
        url: siteConfig.ogImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: "Awesome Codex Pet 精选宠物画廊",
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

export default function ChineseCodexPetsPage() {
  const pets = getAllPets();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${siteConfig.url}/zh/#article`,
        headline: title,
        description,
        url: `${siteConfig.url}/zh`,
        inLanguage: "zh-CN",
        author: {
          "@id": `${siteConfig.url}/#organization`,
        },
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        about: [
          "Codex 小宠物",
          "Codex 宠物社区画廊",
          "Codex 宠物安装",
          "免费 Codex 宠物制作申请",
          "动漫和游戏人物 Codex 宠物",
          "Codex 宠物故障排查",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/zh/#faq`,
        inLanguage: "zh-CN",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main
      className="mx-auto max-w-[1200px] px-6 pb-24 pt-14 sm:pt-20"
      lang="zh-CN"
    >
      <header className="border-b border-border pb-12">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">
          Codex Pets 中文入口
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-6xl">
          Codex 小宠物画廊：免费下载、安装与社区制作申请
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
          Awesome Codex Pet 是开放的社区小宠物画廊，使用方式就像免费的 Codex
          宠物商店。这里已收录 {pets.length} 只宠物，可以预览 V1、V2
          完整动画并一键安装动漫角色、游戏人物、动物、机器人或原创伙伴；找不到喜欢的角色时，还可以免费提交社区制作申请。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            href="/#gallery"
          >
            浏览 {pets.length} 只 Codex 宠物
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-bg-elevated px-5 text-sm font-medium text-text transition-colors hover:bg-surface"
            href="/zh/install"
          >
            查看安装方法
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-bg-elevated px-5 text-sm font-medium text-text transition-colors hover:bg-surface"
            href="/zh/request"
          >
            免费申请喜欢的角色
          </Link>
        </div>
      </header>

      <nav
        className="grid border-b border-border py-8 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Codex 宠物中文指南章节"
      >
        {[
          ["#what", "什么是 Codex 宠物"],
          ["#install", "下载与安装"],
          ["#request", "免费制作申请"],
          ["#troubleshoot", "宠物不显示"],
        ].map(([href, label]) => (
          <a
            key={href}
            className="border-b border-border px-0 py-4 text-sm font-medium text-text transition-colors hover:text-accent sm:px-5 lg:border-b-0 lg:border-l"
            href={href}
          >
            {label}
            <span className="ml-2 text-accent" aria-hidden="true">
              ↓
            </span>
          </a>
        ))}
      </nav>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="what"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            认识 Codex pets
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            什么是 Codex 小宠物？
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-text-secondary">
          <p>
            Codex 宠物是 OpenAI Codex 桌面端中的像素动画伙伴。它们会随着 Codex
            的待机、运行、等待、审查和失败等状态切换动作；V2
            宠物还能根据拖动方向播放环视动画。
          </p>
          <p>
            这里的使用体验类似小宠物商店，但不是付费素材市场，而是公开的 Codex
            宠物社区画廊。每只宠物都有独立详情页、动作预览、作者信息、许可证和安装入口。
            你可以浏览
            <Link
              className="mx-1 font-medium text-accent hover:underline"
              href="/collections"
            >
              作品系列与主题合集
            </Link>
            ，也可以搜索具体动漫或游戏角色。
          </p>
        </div>
      </section>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="install"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Codex 宠物下载与安装
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            不用克隆仓库，一条命令即可安装
          </h2>
        </div>
        <ol className="divide-y divide-border border-y border-border">
          <ChineseStep
            index="01"
            title="在画廊选择宠物"
            description="先看完整动作和 V1 / V2 版本，再确认作者、来源与许可证。"
          />
          <ChineseStep
            index="02"
            title="选择适合自己的安装方式"
            description="可以交给 ChatGPT 中的 Codex 安装，也可以复制 Bash 或 PowerShell 命令。"
          />
          <ChineseStep
            index="03"
            title="在 Codex 中启用"
            description="安装完成后重启 Codex，打开“设置 → 宠物”，选择刚安装的自定义宠物。"
          />
          <li className="py-5">
            <Link
              className="font-medium text-accent hover:underline"
              href="/zh/install"
            >
              打开完整的 Codex 宠物安装指南 →
            </Link>
          </li>
        </ol>
      </section>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="request"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            免费社区制作申请
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            没有喜欢的角色，就请社区帮你做
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-text-secondary">
          <p>
            申请人不需要会画画、写代码或自己准备
            spritesheet。只要告诉社区角色名称、所属作品，提供公开可访问的参考图，并说明希望保留的外观与动作特点，就可以免费发布制作申请。
          </p>
          <p>
            社区贡献者可能会志愿认领并免费制作，完成后宠物会进入公开画廊，所有人都能预览和安装。申请本身不收费，但不代表一定会被认领，也不承诺完成时间。
          </p>
          <Link
            className="inline-block font-medium text-accent hover:underline"
            href="/zh/request"
          >
            免费提交喜欢角色的制作申请 →
          </Link>
          <p className="text-sm text-muted">
            想亲自制作或投稿现有宠物的贡献者，仍可阅读{" "}
            <Link className="text-accent hover:underline" href="/guide">
              制作与投稿指南
            </Link>
            。
          </p>
        </div>
      </section>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="troubleshoot"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Codex 宠物不显示
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            安装后找不到宠物，先检查这四项
          </h2>
        </div>
        <ol className="list-decimal space-y-4 pl-5 text-base leading-8 text-text-secondary">
          <li>
            确认 macOS / Linux 的{" "}
            <code className="font-mono text-sm text-text">~/.codex/pets/</code>
            ，或 Windows 的{" "}
            <code className="font-mono text-sm text-text">
              %USERPROFILE%\.codex\pets\
            </code>
            中已经出现宠物目录。
          </li>
          <li>
            目录中必须同时存在{" "}
            <code className="font-mono text-sm text-text">pet.json</code> 和{" "}
            <code className="font-mono text-sm text-text">
              spritesheet.webp
            </code>
            。
          </li>
          <li>
            检查{" "}
            <code className="font-mono text-sm text-text">pet.json.id</code>
            是否与文件夹名称完全一致。
          </li>
          <li>
            重启 Codex，再打开“设置 → 宠物”。如果使用命令面板，也可重新尝试
            <code className="ml-1 font-mono text-sm text-text">/pet</code>。
          </li>
        </ol>
      </section>

      <section className="py-14" id="faq">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          常见搜索问题
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-text">
          关于 Codex 宠物的常见问题
        </h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faq.map((item) => (
            <details className="group py-5" key={item.question}>
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-text">
                {item.question}
                <span
                  className="float-right text-accent group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

function ChineseStep({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <li className="grid gap-3 py-5 sm:grid-cols-[48px_1fr]">
      <span className="font-mono text-xs font-semibold text-accent">
        {index}
      </span>
      <div>
        <h3 className="font-semibold text-text">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-muted">{description}</p>
      </div>
    </li>
  );
}
