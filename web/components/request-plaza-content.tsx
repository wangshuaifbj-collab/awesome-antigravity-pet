"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { RequestCard } from "@/components/request-card";
import {
  getRequestCategoryLabel,
  getRequestStatusLabel,
} from "@/lib/request-display";
import {
  type PetRequest,
  type RequestStatus,
} from "@/lib/request-catalog";
import { localePath } from "@/lib/i18n";
import { isFollowingRequest } from "@/lib/stats";

const content = {
  en: {
    eyebrow: "Community production queue",
    title: "Pet request plaza",
    intro:
      "See what the community wants next, support a request, follow its progress, or volunteer to make it.",
    newRequest: "Post a request",
    all: "All requests",
    following: "Following",
    status: "Status",
    category: "Category",
    everyStatus: "Every status",
    everyCategory: "Every category",
    visible: "requests",
    noResults: "No requests match these filters.",
    clear: "Clear filters",
  },
  zh: {
    eyebrow: "社区制作队列",
    title: "制作需求广场",
    intro:
      "看看社区下一只想要什么，支持喜欢的请求、关注制作进度，或者亲自认领制作。",
    newRequest: "发布制作请求",
    all: "全部请求",
    following: "我的关注",
    status: "进度",
    category: "分类",
    everyStatus: "全部进度",
    everyCategory: "全部分类",
    visible: "个请求",
    noResults: "当前筛选条件下没有制作请求。",
    clear: "清除筛选",
  },
  ko: {
    eyebrow: "커뮤니티 제작 대기열",
    title: "펫 요청 광장",
    intro:
      "커뮤니티가 다음으로 원하는 펫을 보고, 요청을 응원하거나 진행 상황을 팔로우하고 직접 제작해 보세요.",
    newRequest: "요청 등록",
    all: "전체 요청",
    following: "팔로우 중",
    status: "상태",
    category: "카테고리",
    everyStatus: "전체 상태",
    everyCategory: "전체 카테고리",
    visible: "개 요청",
    noResults: "필터에 맞는 요청이 없습니다.",
    clear: "필터 지우기",
  },
  ja: {
    eyebrow: "コミュニティ制作キュー",
    title: "ペットリクエスト広場",
    intro:
      "コミュニティが次に欲しいペットを見て、応援、進捗フォロー、制作への参加ができます。",
    newRequest: "リクエストを投稿",
    all: "すべて",
    following: "フォロー中",
    status: "状態",
    category: "カテゴリー",
    everyStatus: "すべての状態",
    everyCategory: "すべてのカテゴリー",
    visible: "件",
    noResults: "条件に一致するリクエストがありません。",
    clear: "フィルターをクリア",
  },
  es: {
    eyebrow: "Cola de producción comunitaria",
    title: "Plaza de peticiones",
    intro:
      "Descubre qué quiere la comunidad, apoya una petición, sigue su progreso u ofrécete para crearla.",
    newRequest: "Publicar petición",
    all: "Todas",
    following: "Siguiendo",
    status: "Estado",
    category: "Categoría",
    everyStatus: "Todos los estados",
    everyCategory: "Todas las categorías",
    visible: "peticiones",
    noResults: "Ninguna petición coincide con los filtros.",
    clear: "Borrar filtros",
  },
} as const;

const statuses: RequestStatus[] = [
  "triage",
  "open",
  "in-progress",
  "review",
  "completed",
];

export function RequestPlazaContent({
  requests,
}: {
  requests: PetRequest[];
}) {
  const { locale } = useLocale();
  const text = content[locale];
  const [view, setView] = useState<"all" | "following">("all");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const categories = [...new Set(requests.map((request) => request.category))]
    .sort();

  useEffect(() => {
    const readFollowed = () =>
      setFollowed(
        new Set(
          requests
            .filter((request) => isFollowingRequest(request.number))
            .map((request) => request.number),
        ),
      );
    readFollowed();
    window.addEventListener("request-follow-changed", readFollowed);
    return () =>
      window.removeEventListener("request-follow-changed", readFollowed);
  }, [requests]);

  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          (view === "all" || followed.has(request.number)) &&
          (!status || request.status === status) &&
          (!category || request.category === category),
      ),
    [category, followed, requests, status, view],
  );

  function handleFollowChange(number: number, following: boolean) {
    setFollowed((current) => {
      const next = new Set(current);
      if (following) next.add(number);
      else next.delete(number);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-[1480px] px-6 pb-24 pt-10 sm:pt-14">
      <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {text.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-text sm:text-5xl">
            {text.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            {text.intro}
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          href={localePath(locale, "/request")}
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {text.newRequest}
        </Link>
      </header>

      <section
        aria-label={text.title}
        className="flex flex-col gap-4 border-b border-border py-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="inline-flex w-fit rounded-lg border border-border bg-bg-secondary p-1">
          {(["all", "following"] as const).map((option) => (
            <button
              className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${
                view === option
                  ? "bg-bg-elevated text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {text[option]}
              {option === "following" && followed.size > 0
                ? ` ${followed.size}`
                : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-medium text-muted">
            {text.status}
            <select
              className="h-10 min-w-40 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text outline-none focus:border-accent"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="">{text.everyStatus}</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {getRequestStatusLabel(value, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted">
            {text.category}
            <select
              className="h-10 min-w-40 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text outline-none focus:border-accent"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">{text.everyCategory}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {getRequestCategoryLabel(value, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between py-6">
        <p className="text-sm text-muted">
          <span className="font-mono font-semibold text-text">
            {filtered.length}
          </span>{" "}
          {text.visible}
        </p>
      </div>

      {filtered.length > 0 ? (
        <section className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
          {filtered.map((request) => (
            <RequestCard
              key={request.number}
              onFollowChange={handleFollowChange}
              request={request}
            />
          ))}
        </section>
      ) : (
        <section className="border-y border-border py-20 text-center">
          <p className="text-text-secondary">{text.noResults}</p>
          <button
            className="mt-4 text-sm font-semibold text-accent hover:underline"
            onClick={() => {
              setView("all");
              setStatus("");
              setCategory("");
            }}
            type="button"
          >
            {text.clear}
          </button>
        </section>
      )}
    </main>
  );
}
