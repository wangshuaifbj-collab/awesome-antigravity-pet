"use client";

import { useState } from "react";

import { CodexIcon } from "@/components/codex-icon";
import { useLocale } from "@/components/locale-provider";
import { getLocalizedCategoryLabel } from "@/lib/pet-localization";
import { ShareMenu } from "@/components/share-menu";
import {
  buildCodexUrl,
  getPetRequestPrompt,
  getPetSubmissionPrompt,
} from "@/lib/codex-links";
import type { CategoryDefinition } from "@/lib/categories";
import { siteConfig } from "@/lib/site";

type GuidePageContentProps = {
  categories: CategoryDefinition[];
};

const actionKeys = [
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review",
] as const;

const actionCraftKeys = [
  "guideActionIdle",
  "guideActionRunningRight",
  "guideActionRunningLeft",
  "guideActionWaving",
  "guideActionJumping",
  "guideActionFailed",
  "guideActionWaiting",
  "guideActionRunning",
  "guideActionReview",
] as const;

const edgeStepKeys = [
  "guideEdgeStep1",
  "guideEdgeStep2",
  "guideEdgeStep3",
  "guideEdgeStep4",
] as const;

const checklistKeys = [
  "guideChecklistItem1",
  "guideChecklistItem2",
  "guideChecklistItem3",
  "guideChecklistItem4",
  "guideChecklistItem5",
  "guideChecklistItem6",
] as const;

export function GuidePageContent({ categories }: GuidePageContentProps) {
  const { t, locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const [workflowMode, setWorkflowMode] = useState<"request" | "submit">(
    "submit",
  );
  const requestPrompt = getPetRequestPrompt(locale);
  const submissionPrompt = getPetSubmissionPrompt(locale);
  const activePrompt =
    workflowMode === "request" ? requestPrompt : submissionPrompt;
  const guideUrl = `${siteConfig.url}/guide`;
  const fullGuideHref =
    locale === "zh"
      ? "https://github.com/legeling/awesome-codex-pet/blob/main/docs/zh-CN/submission-guide.md"
      : "https://github.com/legeling/awesome-codex-pet/blob/main/docs/en/submission-guide.md";

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(activePrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error: unknown) {
      console.warn(
        "Unable to copy AI submission prompt",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  return (
    <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-14 sm:pt-20">
      <header className="border-b border-border pb-12">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">
          {t("guideEyebrow")}
        </p>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="mb-5 text-4xl font-semibold sm:text-5xl">
              {t("guidePageTitle")}
            </h1>
            <p className="text-base leading-relaxed text-muted sm:text-lg">
              {t("guidePageSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              href={buildCodexUrl(submissionPrompt)}
            >
              <CodexIcon className="size-6" />
              {t("guideSubmitWorkflow")}
            </a>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:bg-surface"
              href={buildCodexUrl(requestPrompt)}
            >
              <CodexIcon className="size-6" />
              {t("guideRequestWorkflow")}
            </a>
            <ShareMenu
              title={t("guideShareTitle")}
              url={guideUrl}
            />
          </div>
        </div>
        <nav
          className="mt-9 flex flex-wrap gap-2"
          aria-label={t("guideQuickNav")}
        >
          {[
            ["versions", "guideNavVersions"],
            ["actions", "guideNavActions"],
            ["edges", "guideNavEdges"],
            ["package", "guideNavPackage"],
            ["community", "guideNavCommunity"],
          ].map(([href, label]) => (
            <a
              key={href}
              className="rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text"
              href={`#${href}`}
            >
              {t(label as "guideNavVersions")}
            </a>
          ))}
        </nav>
      </header>

      <section className="border-b border-border py-14">
        <div className="max-w-3xl">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {t("guideAIWorkflowEyebrow")}
            </p>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("guideAIWorkflowTitle")}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              {t("guideAIWorkflowDesc")}
            </p>
            <div
              className="mb-3 inline-flex rounded-lg border border-border bg-bg-secondary p-1"
              role="tablist"
              aria-label={t("guideAIWorkflowEyebrow")}
            >
              <button
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  workflowMode === "submit"
                    ? "bg-bg-elevated text-text shadow-sm"
                    : "text-muted hover:text-text"
                }`}
                type="button"
                role="tab"
                aria-selected={workflowMode === "submit"}
                onClick={() => {
                  setWorkflowMode("submit");
                  setCopied(false);
                }}
              >
                {t("guideSubmitWorkflow")}
              </button>
              <button
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  workflowMode === "request"
                    ? "bg-bg-elevated text-text shadow-sm"
                    : "text-muted hover:text-text"
                }`}
                type="button"
                role="tab"
                aria-selected={workflowMode === "request"}
                onClick={() => {
                  setWorkflowMode("request");
                  setCopied(false);
                }}
              >
                {t("guideRequestWorkflow")}
              </button>
            </div>
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
              {workflowMode === "submit"
                ? t("guideSubmitWorkflowDesc")
                : t("guideRequestWorkflowDesc")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                href={buildCodexUrl(activePrompt)}
              >
                <CodexIcon className="size-6" />
                {t("startInCodex")}
              </a>
              <button
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:bg-surface"
                type="button"
                onClick={() => void copyPrompt()}
              >
                {copied ? t("copied") : t("copyAIPrompt")}
              </button>
              <a
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:bg-surface"
                href="https://github.com/legeling/awesome-codex-pet/compare"
                target="_blank"
                rel="noreferrer"
              >
                {t("advancedPullRequest")}
              </a>
              <a
                className="inline-flex h-10 items-center justify-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:text-text"
                href={fullGuideHref}
                target="_blank"
                rel="noreferrer"
              >
                {t("submissionGuide")}
              </a>
            </div>
            <details className="mt-5 rounded-lg border border-border bg-bg-secondary px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-text">
                {t("showAIPrompt")}
              </summary>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-border pt-4 font-mono text-xs leading-relaxed text-text-secondary">
                {activePrompt}
              </pre>
            </details>
          </div>
        </div>
      </section>

      <section
        id="versions"
        className="scroll-mt-20 border-b border-border py-14"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {t("guideVersionsEyebrow")}
        </p>
        <h2 className="mb-3 text-2xl font-semibold">
          {t("guideVersionsTitle")}
        </h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted">
          {t("guideVersionsDesc")}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-border bg-bg-secondary p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">V1</h3>
              <span className="rounded-full border border-border bg-bg-elevated px-3 py-1 font-mono text-xs text-muted">
                8 × 9
              </span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-text-secondary">
              {t("guideVersionV1")}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
              <dt className="text-muted">{t("guideAtlasSize")}</dt>
              <dd className="font-mono text-text">1536 × 1872</dd>
              <dt className="text-muted">{t("guideActionRows")}</dt>
              <dd className="text-text">9</dd>
              <dt className="text-muted">{t("guideLookDirections")}</dt>
              <dd className="text-text">0</dd>
            </dl>
          </article>
          <article className="rounded-lg border border-accent/50 bg-accent-light/40 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">V2</h3>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                {t("guideRecommended")}
              </span>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-text-secondary">
              {t("guideVersionV2")}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
              <dt className="text-muted">{t("guideAtlasSize")}</dt>
              <dd className="font-mono text-text">1536 × 2288</dd>
              <dt className="text-muted">{t("guideActionRows")}</dt>
              <dd className="text-text">9</dd>
              <dt className="text-muted">{t("guideLookDirections")}</dt>
              <dd className="text-text">16</dd>
            </dl>
          </article>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {t("guideUpgradeDesc")}
        </p>
      </section>

      <section
        id="actions"
        className="scroll-mt-20 border-b border-border py-14"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {t("guideActionsEyebrow")}
        </p>
        <h2 className="mb-3 text-2xl font-semibold">
          {t("guideActionsTitle")}
        </h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted">
          {t("guideActionsDesc")}
        </p>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {actionKeys.map((action, index) => (
            <article key={action} className="min-h-36 bg-bg-secondary p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-xs text-accent">
                  {String(index).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-text">{t(action)}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {t(actionCraftKeys[index])}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="edges" className="scroll-mt-20 border-b border-border py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {t("guideEdgesEyebrow")}
            </p>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("guideEdgesTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {t("guideEdgesDesc")}
            </p>
          </div>
          <ol className="divide-y divide-border border-y border-border">
            {edgeStepKeys.map((key, index) => (
              <li
                key={key}
                className="grid grid-cols-[2.5rem_1fr] gap-3 py-4 text-sm leading-relaxed"
              >
                <span className="font-mono text-xs text-accent">
                  0{index + 1}
                </span>
                <span className="text-text-secondary">{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="package"
        className="scroll-mt-20 border-b border-border py-14"
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("guideStructureTitle")}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              {t("guideStructureDesc")}
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg-secondary p-5 font-mono text-xs text-text-secondary sm:text-sm">
              {`pets/
└── pet-slug--author-slug/
    ├── submission.json
    ├── pet.json
    └── spritesheet.webp`}
            </pre>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {t("guideStructureNote")}
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("guideCategoriesTitle")}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              {t("guideCategoriesDesc")}
            </p>
            <div className="mb-7 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.name}
                  className="rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text"
                >
                  {getLocalizedCategoryLabel(category.label, locale)}
                </span>
              ))}
            </div>
            <h3 className="mb-2 text-base font-semibold">
              {t("guideCollectionsTitle")}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              {t("guideCollectionsDesc")}
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg-secondary p-4 font-mono text-xs text-text-secondary">
              {`{
  "collections": ["genshin-impact"]
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-14">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {t("guideQualityEyebrow")}
        </p>
        <h2 className="mb-7 text-2xl font-semibold">
          {t("guideChecklistTitle")}
        </h2>
        <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          {checklistKeys.map((key) => (
            <li
              key={key}
              className="flex items-start gap-3 text-sm leading-relaxed text-text"
            >
              <svg
                className="mt-0.5 size-5 shrink-0 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section id="community" className="scroll-mt-20 py-14">
        <div className="grid gap-8 rounded-lg border border-border bg-bg-secondary p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {t("guideCommunityEyebrow")}
            </p>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("guideCommunityTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {t("guideCommunityDesc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ShareMenu
              title={t("guideShareTitle")}
              url={guideUrl}
            />
            <a
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:bg-surface"
              href={fullGuideHref}
              target="_blank"
              rel="noreferrer"
            >
              {t("guideReadFull")}
            </a>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-3 border-t border-border pt-12 sm:flex-row">
        <a
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          href={buildCodexUrl(submissionPrompt)}
        >
          <CodexIcon className="size-6" />
          {t("guideSubmitWorkflow")}
        </a>
        <a
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-text transition-colors hover:bg-surface"
          href={buildCodexUrl(requestPrompt)}
        >
          <CodexIcon className="size-6" />
          {t("guideRequestWorkflow")}
        </a>
      </div>
    </main>
  );
}
