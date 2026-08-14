import type { Metadata } from "next";
import Link from "next/link";

import { CopyCommandButton } from "@/components/copy-command-button";
import {
  BASH_INSTALL_COMMAND,
  INSTALL_PLACEHOLDER,
  POWERSHELL_INSTALL_COMMAND,
} from "@/lib/install";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";
import { languageAlternates } from "@/lib/localized-route-metadata";

const title = "如何安装 Codex 小宠物";
const description =
  "Codex 小宠物中文安装教程：从 Awesome Codex Pet 画廊选择宠物，在 macOS、Linux 或 Windows 一键安装，并在 Codex 设置中启用和排查。";
const pageUrl = `${siteConfig.url}/zh/install`;

const faq = [
  {
    question: "Codex 小宠物会安装到哪里？",
    answer:
      "默认安装到 Codex 主目录下的 pets/<pet-id>/。macOS 和 Linux 的默认主目录是 ~/.codex，Windows 通常是 %USERPROFILE%\\.codex。",
  },
  {
    question: "为什么命令里的宠物标识符不能直接运行？",
    answer:
      "命令中的 <pet-slug--author-slug> 是占位符。请先打开宠物详情页，复制该宠物显示的完整标识符或已经替换好的安装命令。",
  },
  {
    question: "安装后为什么看不到 Codex 宠物？",
    answer:
      "确认宠物目录中同时存在 pet.json 和 spritesheet.webp，检查 pet.json.id 与文件夹名完全一致，然后彻底退出并重启 Codex，再打开“设置 → 宠物”。",
  },
  {
    question: "安装脚本会覆盖其他宠物吗？",
    answer:
      "不会。安装器只写入目标宠物自己的目录；不同 id 的 V1、V2 宠物可以同时存在。重新安装已有 id 时必须显式添加 --force（PowerShell 使用 -Force）。",
  },
] as const;

export const metadata: Metadata = {
  title: {
    absolute: `${title} · ${siteConfig.title}`,
  },
  description,
  keywords: withSiteKeywords([
    "如何安装 Codex 小宠物",
    "Codex 小宠物安装",
    "Codex 宠物安装教程",
    "Codex 宠物下载",
    "Codex 宠物不显示",
    "OpenAI Codex 自定义宠物",
    "macOS 安装 Codex 宠物",
    "Windows 安装 Codex 宠物",
    "Linux 安装 Codex 宠物",
    "Codex pets 文件夹",
    "Codex 设置宠物",
    "Codex pet install",
  ]),
  alternates: {
    canonical: "/zh/install",
    languages: languageAlternates("/install"),
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "article",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ko_KR", "ja_JP", "es_ES"],
    images: [
      {
        url: siteConfig.ogImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: "Awesome Codex Pet 安装指南",
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

export default function ChineseInstallPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "@id": `${pageUrl}/#howto`,
        name: title,
        description,
        url: pageUrl,
        inLanguage: "zh-CN",
        totalTime: "PT2M",
        tool: [
          {
            "@type": "HowToTool",
            name: "macOS/Linux 终端、Windows PowerShell 或 ChatGPT 中的 Codex",
          },
        ],
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "选择 Codex 宠物",
            text: "在 Awesome Codex Pet 画廊选择宠物，打开详情页并复制完整 pet id。",
            url: `${siteConfig.url}/#gallery`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "运行官方安装命令",
            text: "根据操作系统运行详情页提供的 Bash 或 PowerShell 命令。",
            url: `${pageUrl}#commands`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "重启并启用宠物",
            text: "彻底退出并重启 Codex，然后打开设置中的宠物页面选择新安装的宠物。",
            url: `${pageUrl}#enable`,
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
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Codex 小宠物中文指南",
            item: `${siteConfig.url}/zh`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <main
      className="mx-auto max-w-[1120px] px-6 pb-24 pt-14 sm:pt-20"
      lang="zh-CN"
    >
      <header className="border-b border-border pb-12">
        <nav className="mb-6 text-sm text-muted" aria-label="面包屑">
          <Link className="hover:text-accent" href="/zh">
            Codex 小宠物中文指南
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span>安装教程</span>
        </nav>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">
          Codex 宠物安装教程
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-6xl">
          如何安装 Codex 小宠物
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">
          最短答案：先在 Awesome Codex Pet
          画廊选择一只宠物，打开详情页复制完整安装命令；运行后彻底重启
          Codex，再到“设置 → 宠物”中启用。整个过程不需要克隆素材仓库。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            href="/#gallery"
          >
            选择 Codex 宠物
          </Link>
          <a
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-bg-elevated px-5 text-sm font-medium text-text transition-colors hover:bg-surface"
            href="#commands"
          >
            查看安装命令
          </a>
        </div>
      </header>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="steps"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            两分钟完成
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            安装 Codex 宠物的三个步骤
          </h2>
        </div>
        <ol className="divide-y divide-border border-y border-border">
          <InstallStep
            index="01"
            title="在画廊选择宠物"
            description="查看动作预览、作者、许可证和 V1/V2 版本，进入详情页后复制完整 pet id。"
          />
          <InstallStep
            index="02"
            title="运行详情页提供的命令"
            description="macOS 与 Linux 使用 Bash；Windows 使用 PowerShell。详情页中的命令已经替换好宠物标识符。"
          />
          <InstallStep
            index="03"
            title="重启 Codex 并启用"
            description="安装完成后彻底退出 Codex，重新打开“设置 → 宠物”，选择刚安装的自定义宠物。"
          />
        </ol>
      </section>

      <section className="border-b border-border py-14" id="commands">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            官方远程安装器
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            macOS、Linux 与 Windows 安装命令
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            下面展示命令格式。请把{" "}
            <code className="font-mono text-sm text-text">
              {INSTALL_PLACEHOLDER}
            </code>{" "}
            替换为详情页显示的完整宠物标识符；最稳妥的方式是直接复制详情页已经替换好的命令。
          </p>
        </div>
        <div className="mt-8 grid gap-8">
          <CommandBlock
            title="macOS / Linux（Bash）"
            command={BASH_INSTALL_COMMAND}
          />
          <CommandBlock
            title="Windows（PowerShell）"
            command={POWERSHELL_INSTALL_COMMAND}
          />
        </div>
      </section>

      <section
        className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.7fr_1.3fr]"
        id="enable"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            安装验证
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            如何确认安装成功
          </h2>
        </div>
        <ol className="list-decimal space-y-4 pl-5 text-base leading-8 text-text-secondary">
          <li>
            在{" "}
            <code className="font-mono text-sm text-text">
              ~/.codex/pets/&lt;pet-id&gt;/
            </code>{" "}
            中确认同时存在{" "}
            <code className="font-mono text-sm text-text">pet.json</code> 和{" "}
            <code className="font-mono text-sm text-text">
              spritesheet.webp
            </code>
            。
          </li>
          <li>
            确认{" "}
            <code className="font-mono text-sm text-text">pet.json.id</code>{" "}
            与宠物目录名称完全一致。
          </li>
          <li>彻底退出并重新启动 Codex，让自定义宠物目录重新载入。</li>
          <li>打开“设置 → 宠物”，选择新安装的宠物。</li>
        </ol>
      </section>

      <section className="py-14" id="faq">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          故障排查
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-text">
          Codex 宠物安装常见问题
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

function InstallStep({
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

function CommandBlock({ title, command }: { title: string; command: string }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <CopyCommandButton command={command} label="复制命令" grow={false} />
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-border bg-bg-secondary p-5 font-mono text-xs leading-6 text-text-secondary [overflow-wrap:anywhere] sm:text-sm">
        <code>{command}</code>
      </pre>
    </div>
  );
}
