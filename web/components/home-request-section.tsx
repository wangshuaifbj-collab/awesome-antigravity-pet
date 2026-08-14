"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { RequestCard } from "@/components/request-card";
import type { PetRequest } from "@/lib/request-catalog";

const sectionCopy = {
  en: {
    eyebrow: "Community wishlist",
    title: "These pets are waiting to be made",
    link: "Open the request plaza",
  },
  zh: {
    eyebrow: "社区正在等待",
    title: "这些小宠物还在等人制作",
    link: "进入需求广场",
  },
  ko: {
    eyebrow: "커뮤니티 위시리스트",
    title: "이 펫들은 제작자를 기다리고 있어요",
    link: "요청 광장 열기",
  },
  ja: {
    eyebrow: "コミュニティのウィッシュリスト",
    title: "制作を待っているペットたち",
    link: "リクエスト広場へ",
  },
  es: {
    eyebrow: "Deseos de la comunidad",
    title: "Estas mascotas esperan a alguien que las cree",
    link: "Abrir la plaza de peticiones",
  },
} as const;

export function HomeRequestSection({
  requests,
}: {
  requests: PetRequest[];
}) {
  const { locale } = useLocale();
  const text = sectionCopy[locale];

  return (
    <section
      aria-labelledby="home-requests-title"
      className="mb-20 border-y border-border py-10"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {text.eyebrow}
          </p>
          <h2
            className="mt-2 text-3xl font-semibold tracking-tight text-text"
            id="home-requests-title"
          >
            {text.title}
          </h2>
        </div>
        <Link
          className="text-sm font-semibold text-accent hover:underline"
          href="/requests"
        >
          {text.link}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {requests.map((request) => (
          <div
            className="w-[min(88vw,430px)] shrink-0 snap-start"
            key={request.number}
          >
            <RequestCard compact request={request} />
          </div>
        ))}
      </div>
    </section>
  );
}
