"use client";

import Link from "next/link";
import { useState } from "react";

import { ChatGPTIcon } from "@/components/chatgpt-icon";
import { CopyCommandButton } from "@/components/copy-command-button";
import { useLocale } from "@/components/locale-provider";
import { buildChatGPTUrl, getInstallGuidePrompt } from "@/lib/codex-links";
import {
  BASH_INSTALL_COMMAND,
  LOCAL_INSTALL_COMMAND,
  POWERSHELL_INSTALL_COMMAND,
} from "@/lib/install";

type InstallMethod = "bash" | "powershell" | "local";

export function InstallPageContent() {
  const { locale, t } = useLocale();
  const [method, setMethod] = useState<InstallMethod>("bash");
  const methods = [
    {
      id: "bash" as const,
      marker: ">_",
      label: t("installBashLabel"),
      tip: t("installBashTip"),
      command: BASH_INSTALL_COMMAND,
      copyLabel: t("copyBashInstall"),
      recommended: true,
    },
    {
      id: "powershell" as const,
      marker: "PS",
      label: t("installPwshLabel"),
      tip: t("installPwshTip"),
      command: POWERSHELL_INSTALL_COMMAND,
      copyLabel: t("copyPowerShell"),
      recommended: false,
    },
    {
      id: "local" as const,
      marker: "JS",
      label: t("installNodeLabel"),
      tip: t("installNodeTip"),
      command: LOCAL_INSTALL_COMMAND,
      copyLabel: t("installNodeLabel"),
      recommended: false,
    },
  ];
  const activeMethod = methods.find((item) => item.id === method) ?? methods[0];

  return (
    <main className="mx-auto max-w-[1320px] px-6 pb-24">
      <header className="grid gap-12 border-b border-border py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-end">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">
            {t("installPageEyebrow")}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text sm:text-6xl">
            {t("installPageTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t("installPageSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              href="/#gallery"
            >
              {t("installBrowsePets")}
              <span aria-hidden="true">→</span>
            </Link>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:border-border-hover hover:bg-surface"
              href={buildChatGPTUrl(getInstallGuidePrompt(locale))}
              target="_blank"
              rel="noreferrer"
            >
              <ChatGPTIcon className="size-6" />
              {t("installCodexAssist")}
            </a>
          </div>
        </div>

        <div className="border-l border-border pl-6 sm:pl-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {t("installQuickTitle")}
          </p>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            {t("installQuickDesc")}
          </p>
          <ol className="divide-y divide-border border-y border-border">
            <GuideStep
              title={t("installStep1Title")}
              description={t("installStep1Desc")}
            />
            <GuideStep
              title={t("installStep2Title")}
              description={t("installStep2Desc")}
            />
            <GuideStep
              title={t("installStep3Title")}
              description={t("installStep3Desc")}
            />
          </ol>
        </div>
      </header>

      <section className="border-b border-border py-14">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("installMethodTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {t("installMethodDesc")}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1"
            role="tablist"
            aria-label={t("installMethodTitle")}
          >
            {methods.map((item) => {
              const selected = item.id === activeMethod.id;
              return (
                <button
                  className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-accent bg-accent-light"
                      : "border-border bg-bg-elevated hover:border-border-hover hover:bg-surface"
                  }`}
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setMethod(item.id)}
                >
                  <span className="w-7 shrink-0 text-center font-mono text-xs font-semibold text-muted">
                    {item.marker}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
                      {item.label}
                      {item.recommended ? (
                        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {t("installRecommended")}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {item.tip}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="rounded-lg border border-border bg-bg-elevated p-5 sm:p-7"
            role="tabpanel"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">
                  {activeMethod.label}
                </p>
                <p className="mt-1 text-xs text-muted">{activeMethod.tip}</p>
              </div>
              <CopyCommandButton
                command={activeMethod.command}
                label={activeMethod.copyLabel}
                grow={false}
              />
            </div>
            <pre className="min-h-24 whitespace-pre-wrap rounded-lg border border-border bg-bg-secondary p-4 font-mono text-xs leading-6 text-text-secondary [overflow-wrap:anywhere] sm:text-sm">
              <code>{activeMethod.command}</code>
            </pre>

            <div className="mt-7 grid gap-6 border-t border-border pt-6 md:grid-cols-3">
              <MethodNote
                index="01"
                title={t("installMethodCheckTitle")}
                description={t("installMethodCheckDesc")}
              />
              <MethodNote
                index="02"
                title={t("installMethodRunTitle")}
                description={t("installMethodRunDesc")}
              />
              <MethodNote
                index="03"
                title={t("installMethodVerifyTitle")}
                description={t("installMethodVerifyDesc")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-14 border-b border-border py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("installActivateTitle")}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {t("installActivateDesc")}
          </p>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            <ActivationStep
              index="1"
              title={t("installActivateStep1Title")}
              description={t("installActivateStep1Desc")}
            />
            <ActivationStep
              index="2"
              title={t("installActivateStep2Title")}
              description={t("installActivateStep2Desc")}
            />
            <ActivationStep
              index="3"
              title={t("installActivateStep3Title")}
              description={t("installActivateStep3Desc")}
            />
          </ol>

          <div className="mt-8 border-l-2 border-accent bg-accent-light px-5 py-4">
            <h3 className="text-sm font-semibold text-text">
              {t("installVersionNoteTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {t("installVersionNoteDesc")}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("installManageTitle")}
          </h2>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            <ManageItem
              title={t("installManageLocationTitle")}
              description={t("installManageLocationDesc")}
            />
            <ManageItem
              title={t("installManageCustomTitle")}
              description={t("installManageCustomDesc")}
            />
            <ManageItem
              title={t("installManageUpdateTitle")}
              description={t("installManageUpdateDesc")}
            />
            <ManageItem
              title={t("installManageRemoveTitle")}
              description={t("installManageRemoveDesc")}
            />
            <ManageItem
              title={t("installManagePrivacyTitle")}
              description={t("installManagePrivacyDesc")}
            />
          </dl>
        </div>
      </section>

      <section className="py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("installFaqTitle")}
          </h2>
          <Link
            className="text-sm font-medium text-accent hover:underline"
            href="/#gallery"
          >
            {t("openGallery")} →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <FaqItem question={t("installFaqQ1")} answer={t("installFaqA1")} />
          <FaqItem question={t("installFaqQ2")} answer={t("installFaqA2")} />
          <FaqItem question={t("installFaqQ3")} answer={t("installFaqA3")} />
          <FaqItem question={t("installFaqQ4")} answer={t("installFaqA4")} />
          <FaqItem question={t("installFaqQ5")} answer={t("installFaqA5")} />
        </div>
      </section>
    </main>
  );
}

function GuideStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </li>
  );
}

function MethodNote({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="font-mono text-xs font-semibold text-accent">
        {index}
      </span>
      <h3 className="mt-2 text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function ActivationStep({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <li className="grid grid-cols-[32px_1fr] gap-3 py-5">
      <span className="flex size-7 items-center justify-center rounded-full border border-border font-mono text-xs font-semibold text-accent">
        {index}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </li>
  );
}

function ManageItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1 py-5 sm:grid-cols-[150px_1fr] sm:gap-5">
      <dt className="text-sm font-semibold text-text">{title}</dt>
      <dd className="text-sm leading-relaxed text-muted">{description}</dd>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-lg border border-border bg-bg-elevated px-4 py-3 transition-colors open:bg-bg-secondary">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text">
        {question}
        <svg
          className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">{answer}</p>
    </details>
  );
}
