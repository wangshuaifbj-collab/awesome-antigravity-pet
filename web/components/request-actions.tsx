"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import {
  fetchStats,
  isFollowingRequest,
  isSupportingRequest,
  setRequestFollowed,
  setRequestSupporting,
} from "@/lib/stats";

const copy = {
  en: {
    support: "I want this too",
    supported: "Supported",
    follow: "Follow progress",
    following: "Following",
    error: "Could not update. Try again.",
    supportTitle: "Add your support to help creators see community demand",
    followTitle: "Keep this request in your followed list on this device",
  },
  zh: {
    support: "我也想要",
    supported: "已支持",
    follow: "关注进度",
    following: "已关注",
    error: "更新失败，请重试。",
    supportTitle: "支持这个制作请求，让创作者看到社区需求",
    followTitle: "在这台设备上把该请求加入关注列表",
  },
  ko: {
    support: "저도 원해요",
    supported: "응원함",
    follow: "진행 상황 팔로우",
    following: "팔로우 중",
    error: "업데이트하지 못했습니다. 다시 시도하세요.",
    supportTitle: "제작자가 커뮤니티 수요를 볼 수 있도록 응원합니다",
    followTitle: "이 기기에서 요청 진행 상황을 팔로우합니다",
  },
  ja: {
    support: "私も欲しい",
    supported: "応援済み",
    follow: "進捗をフォロー",
    following: "フォロー中",
    error: "更新できませんでした。もう一度お試しください。",
    supportTitle: "作者にコミュニティの需要を伝えます",
    followTitle: "この端末でリクエストの進捗をフォローします",
  },
  es: {
    support: "Yo también la quiero",
    supported: "Apoyada",
    follow: "Seguir progreso",
    following: "Siguiendo",
    error: "No se pudo actualizar. Inténtalo de nuevo.",
    supportTitle: "Apoya la petición para mostrar el interés de la comunidad",
    followTitle: "Guarda esta petición entre las seguidas en este dispositivo",
  },
} as const;

export function RequestActions({
  number,
  initialSupporters,
  disabled = false,
  onFollowChange,
  compact = false,
}: {
  number: number;
  initialSupporters: number;
  disabled?: boolean;
  onFollowChange?: (number: number, following: boolean) => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const text = copy[locale];
  const [supporters, setSupporters] = useState(initialSupporters);
  const [supporting, setSupporting] = useState(false);
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupporting(isSupportingRequest(number));
    setFollowing(isFollowingRequest(number));
    const controller = new AbortController();
    void fetchStats(controller.signal)
      .then((payload) => {
        const snapshot = payload.requests[String(number)];
        if (snapshot) {
          setSupporters((current) => Math.max(current, snapshot.supporters));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [number]);

  async function toggleSupport() {
    if (pending || disabled) return;
    const next = !supporting;
    const previousCount = supporters;
    setPending(true);
    setError("");
    setSupporting(next);
    setSupporters((current) => Math.max(0, current + (next ? 1 : -1)));

    try {
      const result = await setRequestSupporting(number, next);
      setSupporters(result.supporters);
      if (next && !following) {
        setFollowing(true);
        onFollowChange?.(number, true);
      }
    } catch {
      setSupporting(!next);
      setSupporters(previousCount);
      setError(text.error);
    } finally {
      setPending(false);
    }
  }

  function toggleFollow() {
    const next = !following;
    setFollowing(next);
    setRequestFollowed(number, next);
    onFollowChange?.(number, next);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          aria-pressed={supporting}
          className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
            supporting
              ? "border border-accent bg-accent-light text-accent"
              : "bg-accent text-white hover:bg-accent-hover"
          } ${compact ? "text-xs" : "text-sm"}`}
          disabled={pending || disabled}
          onClick={toggleSupport}
          title={text.supportTitle}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4 shrink-0"
            fill={supporting ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="truncate">
            {supporting ? text.supported : text.support}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums opacity-75">
            {supporters}
          </span>
        </button>
        <button
          aria-pressed={following}
          className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 font-medium transition-colors ${
            following
              ? "border-text bg-text text-bg"
              : "border-border bg-bg-elevated text-text hover:border-border-hover hover:bg-surface"
          } ${compact ? "text-xs" : "text-sm"}`}
          onClick={toggleFollow}
          title={text.followTitle}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-4 shrink-0"
            fill={following ? "currentColor" : "none"}
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 3h12v18l-6-4-6 4V3Z" />
          </svg>
          <span className="truncate">
            {following ? text.following : text.follow}
          </span>
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-[#b42318]" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
