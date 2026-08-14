"use client";

import { useState, useTransition } from "react";
import { useLocale } from "@/components/locale-provider";

type CopyCommandButtonProps = {
  command: string;
  label: string;
  className?: string;
  grow?: boolean;
};

export function CopyCommandButton({
  command,
  label,
  className = "",
  grow = true,
}: CopyCommandButtonProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);

    startTransition(() => {
      setTimeout(() => {
        setCopied(false);
      }, 1400);
    });
  }

  return (
    <button
      className={`${grow ? "flex-1" : ""} inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:border-border-hover hover:bg-bg-secondary ${className}`}
      type="button"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <svg className="size-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t("copied")}
        </>
      ) : (
        <>
          <svg className="size-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
