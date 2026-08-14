"use client";

import { useEffect, useState } from "react";

import { ActionDropdown } from "@/components/action-dropdown";
import { useLocale } from "@/components/locale-provider";

type ShareMenuProps = {
  title: string;
  url: string;
  compact?: boolean;
};

function logActionError(action: string, error: unknown) {
  console.warn(
    `Unable to ${action}`,
    error instanceof Error ? error.stack : String(error),
  );
}

const shareItemClass =
  "flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface";

export function ShareMenu({ title, url, compact = false }: ShareMenuProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState<"link" | "share" | "wechat" | null>(
    null,
  );
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareMessage = t("shareMessage", { title });
  const shareContent = `${shareMessage}\n\n${url}`;

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  async function copyText(
    value: string,
    type: "link" | "share" | "wechat",
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1400);
    } catch (error: unknown) {
      logActionError(`copy ${type}`, error);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: `${title} · Awesome Codex Pet`,
        text: shareMessage,
        url,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      logActionError("share page", error);
    }
  }

  async function shareToWeChat() {
    if (canNativeShare) {
      await nativeShare();
      return;
    }
    await copyText(shareContent, "wechat");
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedShareContent = encodeURIComponent(shareContent);
  const encodedUrl = encodeURIComponent(url);
  const platforms = [
    {
      icon: "微",
      label: t("shareToWeibo"),
      href: `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedMessage}`,
    },
    {
      icon: "QQ",
      label: t("shareToQQ"),
      href: `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedMessage}`,
    },
    {
      icon: "空",
      label: t("shareToQzone"),
      href: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedMessage}`,
    },
    {
      icon: "X",
      label: t("shareToX"),
      href: `https://x.com/intent/post?text=${encodedShareContent}`,
    },
    {
      icon: "f",
      label: t("shareToFacebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      icon: "in",
      label: t("shareToLinkedIn"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      icon: "T",
      label: t("shareToTelegram"),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    },
  ];

  return (
    <ActionDropdown
      label={t("share")}
      menuWidth={328}
      triggerClassName={`inline-flex cursor-pointer items-center justify-center gap-2 border border-border bg-bg-elevated text-text transition-colors hover:bg-surface ${
        compact
          ? "size-9 rounded-lg"
          : "h-9 rounded-lg px-4 text-sm font-medium"
      }`}
      trigger={
        <>
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.173.348.365.5.573m-.5-.573l6.604-3.852m-6.104 6.038l6.104 3.852m0 0a2.25 2.25 0 103.935 2.185 2.25 2.25 0 00-3.935-2.185zm0-9.89a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {compact ? null : t("share")}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-1">
        {platforms.slice(0, 3).map((platform) => (
          <a
            className={shareItemClass}
            href={platform.href}
            key={platform.label}
            rel="noreferrer"
            role="menuitem"
            target="_blank"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-bg-secondary text-[11px] font-semibold">
              {platform.icon}
            </span>
            <span className="truncate">{platform.label}</span>
          </a>
        ))}
        <button
          className={`${shareItemClass} w-full cursor-pointer`}
          data-menu-keep-open={!canNativeShare ? true : undefined}
          onClick={() => void shareToWeChat()}
          role="menuitem"
          type="button"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-bg-secondary text-[11px] font-semibold">
            微
          </span>
          <span className="truncate">
            {copied === "wechat" ? t("copied") : t("shareToWeChat")}
          </span>
        </button>
        {platforms.slice(3).map((platform) => (
          <a
            className={shareItemClass}
            href={platform.href}
            key={platform.label}
            rel="noreferrer"
            role="menuitem"
            target="_blank"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-bg-secondary text-[11px] font-semibold">
              {platform.icon}
            </span>
            <span className="truncate">{platform.label}</span>
          </a>
        ))}
      </div>

      <div className="my-1 border-t border-border" />
      <button
        className={`${shareItemClass} w-full cursor-pointer`}
        data-menu-keep-open
        onClick={() => void copyText(url, "link")}
        role="menuitem"
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-1.5 1.5a4.5 4.5 0 01-6.364-6.364l.75-.75m3.492 4.994a4.5 4.5 0 01-1.242-7.244l1.5-1.5a4.5 4.5 0 016.364 6.364l-.75.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{copied === "link" ? t("copied") : t("copyPageLink")}</span>
      </button>
      <button
        className={`${shareItemClass} w-full cursor-pointer`}
        data-menu-keep-open
        onClick={() => void copyText(shareContent, "share")}
        role="menuitem"
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M8 12h8m-8 4h5M7.5 3.75h7.25L19 8v12.25H5V3.75h2.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          {copied === "share" ? t("copied") : t("copyShareText")}
        </span>
      </button>
      {canNativeShare ? (
        <button
          className={`${shareItemClass} w-full cursor-pointer`}
          onClick={() => void nativeShare()}
          role="menuitem"
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M12 16.5V3m0 0l-4.5 4.5M12 3l4.5 4.5M6.75 10.5h-1.5A2.25 2.25 0 003 12.75v6A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-6a2.25 2.25 0 00-2.25-2.25h-1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("moreShareOptions")}
        </button>
      ) : null}
    </ActionDropdown>
  );
}
