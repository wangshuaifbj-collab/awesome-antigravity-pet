"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionDropdown } from "@/components/action-dropdown";
import { CodexIcon } from "@/components/codex-icon";
import { useLocale } from "@/components/locale-provider";
import {
  buildCodexUrl,
  getPetRequestPrompt,
  getPetSubmissionPrompt,
} from "@/lib/codex-links";

type PromptKind = "request" | "submission";

type WorkflowActionProps = {
  href: string;
  title: string;
  description: string;
  prompt: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: (prompt: string) => void;
};

function WorkflowAction({
  href,
  title,
  description,
  prompt,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: WorkflowActionProps) {
  return (
    <div
      className="flex items-stretch rounded-md transition-colors hover:bg-surface"
      role="group"
    >
      <a
        className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-text"
        href={href}
        role="menuitem"
      >
        <CodexIcon className="mt-0.5 size-8" />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs leading-4 text-muted">
            {description}
          </span>
        </span>
      </a>
      <button
        className="my-2 mr-1.5 flex w-[76px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-l border-border px-2 text-[11px] leading-4 text-muted transition-colors hover:text-accent"
        type="button"
        role="menuitem"
        data-menu-keep-open
        title={copyLabel}
        aria-label={copyLabel}
        onClick={() => onCopy(prompt)}
      >
        {copied ? (
          <svg
            className="size-4 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"
            />
          </svg>
        )}
        <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}

export function SubmissionMenu() {
  const { locale, t } = useLocale();
  const [copiedPrompt, setCopiedPrompt] = useState<PromptKind | null>(null);
  const requestPrompt = getPetRequestPrompt(locale);
  const submissionPrompt = getPetSubmissionPrompt(locale);

  useEffect(() => {
    if (!copiedPrompt) return;
    const timeout = window.setTimeout(() => setCopiedPrompt(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedPrompt]);

  async function copyPrompt(kind: PromptKind, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(kind);
    } catch (error) {
      console.error("Unable to copy the contribution prompt", error);
    }
  }

  return (
    <ActionDropdown
      label={t("submitPet")}
      menuWidth={340}
      triggerClassName="ml-1 inline-flex size-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-accent text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-1.5"
      trigger={
        <>
          <svg
            className="size-4 sm:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.25}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          <span className="hidden sm:inline">{t("submitPet")}</span>
          <svg
            className="hidden size-3 sm:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.25}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9l6 6 6-6"
            />
          </svg>
        </>
      }
    >
      <WorkflowAction
        href={buildCodexUrl(requestPrompt)}
        title={t("requestPetWithAI")}
        description={t("requestPetWithAIDesc")}
        prompt={requestPrompt}
        copied={copiedPrompt === "request"}
        copyLabel={t("copyPromptShort")}
        copiedLabel={t("copied")}
        onCopy={(prompt) => void copyPrompt("request", prompt)}
      />
      <WorkflowAction
        href={buildCodexUrl(submissionPrompt)}
        title={t("submitPetWithAI")}
        description={t("submitPetWithAIDesc")}
        prompt={submissionPrompt}
        copied={copiedPrompt === "submission"}
        copyLabel={t("copyPromptShort")}
        copiedLabel={t("copied")}
        onCopy={(prompt) => void copyPrompt("submission", prompt)}
      />
      <div className="my-1 border-t border-border" role="separator" />
      <a
        className="flex items-start gap-3 rounded-md px-3 py-3 text-text transition-colors hover:bg-surface"
        href="https://github.com/legeling/awesome-codex-pet/compare"
        target="_blank"
        rel="noreferrer"
        role="menuitem"
      >
        <svg
          className="size-5 shrink-0 text-muted"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z" />
        </svg>
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            {t("advancedPullRequest")}
          </span>
          <span className="mt-0.5 block text-xs leading-4 text-muted">
            {t("advancedPullRequestDesc")}
          </span>
        </span>
      </a>
      <Link
        className="flex items-start gap-3 rounded-md px-3 py-3 text-text transition-colors hover:bg-surface"
        href="/guide"
        role="menuitem"
      >
        <svg
          className="size-5 shrink-0 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a2 2 0 0 1 2 2v16a3 3 0 0 0-3-3H4V5.5Zm16 0A2.5 2.5 0 0 0 17.5 3H13v18a3 3 0 0 1 3-3h4V5.5Z"
          />
        </svg>
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            {t("submissionGuide")}
          </span>
          <span className="mt-0.5 block text-xs leading-4 text-muted">
            {t("submissionGuideDesc")}
          </span>
        </span>
      </Link>
    </ActionDropdown>
  );
}
