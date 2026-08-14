"use client";

import Link from "next/link";
import { useState } from "react";

import { ActionDropdown } from "@/components/action-dropdown";
import { ChatGPTIcon } from "@/components/chatgpt-icon";
import { useLocale } from "@/components/locale-provider";
import { buildChatGPTUrl, getPetInstallPrompt } from "@/lib/codex-links";
import { getPetInstallCommands } from "@/lib/install";
import type { PetNameSource } from "@/lib/pets";

type PetInstallMenuProps = {
  pet: PetNameSource;
  variant?: "card" | "detail";
};

function logCopyError(error: unknown) {
  console.warn(
    "Unable to copy pet install command",
    error instanceof Error ? error.stack : String(error),
  );
}

export function PetInstallMenu({ pet, variant = "card" }: PetInstallMenuProps) {
  const { locale, t } = useLocale();
  const [copied, setCopied] = useState(false);
  const commands = getPetInstallCommands(pet.slug);

  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error: unknown) {
      logCopyError(error);
    }
  }

  const isCard = variant === "card";

  return (
    <ActionDropdown
      label={t("installOptions")}
      triggerClassName={
        isCard
          ? "inline-flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border bg-bg-elevated px-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          : "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      }
      trigger={
        <>
          <svg
            className="size-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <span className="whitespace-nowrap">
            {copied ? t("copied") : t("installBtn")}
          </span>
          <svg
            className="size-3 shrink-0"
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
      <a
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface"
        href={buildChatGPTUrl(getPetInstallPrompt(pet, locale))}
        target="_blank"
        rel="noreferrer"
        role="menuitem"
      >
        <ChatGPTIcon className="size-7" />
        <span>
          <span className="block font-medium">{t("openInCodex")}</span>
          <span className="block text-xs text-muted">
            {t("codexRunsInstall")}
          </span>
        </span>
      </a>

      <div className="my-1 border-t border-border" />

      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-text transition-colors hover:bg-surface"
        type="button"
        role="menuitem"
        onClick={() => void copyCommand(commands.bash)}
      >
        <span className="w-6 text-center font-mono text-muted">&gt;_</span>
        <span>
          <span className="block font-medium">{t("copyBashInstall")}</span>
          <span className="block text-xs text-muted">macOS / Linux</span>
        </span>
      </button>
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-text transition-colors hover:bg-surface"
        type="button"
        role="menuitem"
        onClick={() => void copyCommand(commands.powershell)}
      >
        <span className="w-6 text-center font-mono text-muted">PS</span>
        <span>
          <span className="block font-medium">{t("copyPowerShell")}</span>
          <span className="block text-xs text-muted">Windows</span>
        </span>
      </button>

      <div className="my-1 border-t border-border" />
      <Link
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-text"
        href="/install"
        role="menuitem"
      >
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
            d="M9.879 7.519c.301-.293.515-.63.643-1.003a4.5 4.5 0 117.495 4.692c-.755.758-1.707 1.154-2.723 1.154H15m-3 4.5h.008v.008H12v-.008z"
          />
        </svg>
        {t("installationGuide")}
      </Link>
    </ActionDropdown>
  );
}
