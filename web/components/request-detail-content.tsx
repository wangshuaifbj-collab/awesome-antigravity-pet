"use client";

import Link from "next/link";

import { useLocale } from "@/components/locale-provider";
import { RequestActions } from "@/components/request-actions";
import { RequestCraftMenu } from "@/components/request-craft-menu";
import { RequestVisual } from "@/components/request-visual";
import {
  formatRequestDate,
  getRequestCategoryLabel,
  getRequestStatusLabel,
} from "@/lib/request-display";
import type { PetRequest } from "@/lib/request-catalog";

const content = {
  en: {
    back: "Request plaza",
    request: "Pet request",
    franchise: "Original work",
    category: "Category",
    version: "Runtime",
    requester: "Requested by",
    updated: "Last updated",
    direction: "Visual and animation direction",
    references: "References",
    details: "Request details",
    source: "Source and usage notes",
    discussion: "Open GitHub discussion",
    claimNote:
      "Choose Codex for a guided production task, or submit an existing build as a pull request.",
    noReference: "No public reference link was included.",
    comments: "comments",
    completed: "This community request has become a published pet.",
    viewPet: "View the finished pet",
  },
  zh: {
    back: "制作需求广场",
    request: "小宠物制作请求",
    franchise: "所属作品",
    category: "分类",
    version: "运行时",
    requester: "申请人",
    updated: "最近更新",
    direction: "视觉与动画方向",
    references: "参考资料",
    details: "请求说明",
    source: "来源与使用说明",
    discussion: "打开 GitHub 讨论",
    claimNote:
      "可以交给 Codex 按当前请求制作，也可以把已有成品手动提交为 PR。",
    noReference: "这个请求暂未提供公开参考链接。",
    comments: "条讨论",
    completed: "这个社区制作请求已经变成了正式收录的小宠物。",
    viewPet: "查看已完成宠物",
  },
  ko: {
    back: "요청 광장",
    request: "커뮤니티 요청",
    franchise: "원작",
    category: "카테고리",
    version: "런타임",
    requester: "요청자",
    updated: "업데이트",
    direction: "비주얼 및 애니메이션 방향",
    discussion: "GitHub 토론 열기",
    references: "참고 자료",
    details: "요청 상세",
    source: "출처 및 사용 안내",
    claimNote:
      "Codex로 안내된 제작 작업을 시작하거나 기존 결과물을 PR로 제출하세요.",
    noReference: "공개 참고 링크가 없습니다.",
    comments: "개 댓글",
    completed: "이 커뮤니티 요청은 정식 펫으로 공개되었습니다.",
    viewPet: "완성된 펫 보기",
  },
  ja: {
    back: "リクエスト広場",
    request: "コミュニティリクエスト",
    franchise: "原作",
    category: "カテゴリー",
    version: "ランタイム",
    requester: "リクエスト者",
    updated: "更新日",
    direction: "ビジュアルとアニメーションの方向性",
    discussion: "GitHub の議論を開く",
    references: "参考資料",
    details: "リクエスト詳細",
    source: "出典と利用条件",
    claimNote:
      "Codex のガイド付き制作タスクを開始するか、既存の完成品を PR で投稿できます。",
    noReference: "公開された参考リンクはありません。",
    comments: "件のコメント",
    completed: "このコミュニティリクエストは正式なペットになりました。",
    viewPet: "完成したペットを見る",
  },
  es: {
    back: "Plaza de peticiones",
    request: "Petición comunitaria",
    franchise: "Obra original",
    category: "Categoría",
    version: "Runtime",
    requester: "Solicitada por",
    updated: "Actualizada",
    direction: "Dirección visual y de animación",
    discussion: "Abrir conversación en GitHub",
    references: "Referencias",
    details: "Detalles de la petición",
    source: "Fuente y condiciones de uso",
    claimNote:
      "Inicia una tarea guiada con Codex o envía como PR una mascota que ya tengas terminada.",
    noReference: "No se incluyó ningún enlace público de referencia.",
    comments: "comentarios",
    completed: "Esta petición comunitaria ya es una mascota publicada.",
    viewPet: "Ver mascota terminada",
  },
} as const;

function TextSection({
  id,
  title,
  body,
}: {
  id: string;
  title: string;
  body: string;
}) {
  if (!body) return null;
  return (
    <section className="border-t border-border py-9" id={id}>
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-text-secondary">
        {body}
      </p>
    </section>
  );
}

export function RequestDetailContent({ request }: { request: PetRequest }) {
  const { locale } = useLocale();
  const text = content[locale];

  return (
    <main className="mx-auto max-w-[1320px] px-6 pb-24 pt-8 sm:pt-12">
      <nav className="mb-7 text-sm text-muted" aria-label="Breadcrumb">
        <Link className="hover:text-accent" href="/requests">
          {text.back}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>#{request.number}</span>
      </nav>

      <header className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-accent-light px-2 py-1 font-medium text-accent">
              {getRequestStatusLabel(request.status, locale)}
            </span>
            <span className="text-muted">
              {text.request} #{request.number}
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-6xl">
            {request.character}
          </h1>
          {request.franchise ? (
            <p className="mt-4 text-lg text-text-secondary">
              {request.franchise}
            </p>
          ) : null}

          <dl className="mt-8 grid gap-x-8 gap-y-5 border-y border-border py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-muted">
                {text.category}
              </dt>
              <dd className="mt-1 text-sm font-medium text-text">
                {getRequestCategoryLabel(request.category, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted">
                {text.version}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium uppercase text-text">
                {request.version || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted">
                {text.requester}
              </dt>
              <dd className="mt-1">
                <a
                  className="inline-flex items-center gap-2 text-sm font-medium text-text hover:text-accent"
                  href={request.author.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {request.author.avatarUrl ? (
                    <img
                      alt=""
                      className="size-6 rounded-full"
                      src={request.author.avatarUrl}
                    />
                  ) : null}
                  @{request.author.login}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted">
                {text.updated}
              </dt>
              <dd className="mt-1 text-sm font-medium text-text">
                {formatRequestDate(request.updatedAt, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            {request.completedPet ? (
              <div className="flex flex-wrap items-center gap-4 border-l-2 border-accent pl-4">
                <p className="text-sm text-text-secondary">{text.completed}</p>
                <Link
                  className="text-sm font-semibold text-accent hover:underline"
                  href={`/pets/${request.completedPet.slug}`}
                >
                  {text.viewPet} →
                </Link>
              </div>
            ) : (
              <RequestActions
                disabled={request.status === "declined"}
                initialSupporters={request.reactions}
                number={request.number}
              />
            )}
          </div>
        </div>

        <div className="lg:pt-2">
          <RequestVisual
            category={request.category}
            className="aspect-square w-full rounded-lg border border-border"
            image={
              request.completedPet?.previewImage ?? request.referenceImages[0]
            }
            name={request.character}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {request.completedPet ? (
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-text px-4 text-sm font-medium text-bg transition-opacity hover:opacity-85"
                href={`/pets/${request.completedPet.slug}`}
              >
                {text.viewPet}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <RequestCraftMenu request={request} />
            )}
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 text-sm font-medium text-text transition-colors hover:bg-surface"
              href={request.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              {text.discussion}
              <span className="font-mono text-xs text-muted">
                {request.comments}
              </span>
            </a>
          </div>
          {!request.completedPet ? (
            <p className="mt-3 text-xs leading-5 text-muted">
              {text.claimNote}
            </p>
          ) : null}
        </div>
      </header>

      <TextSection
        body={request.visualDirection}
        id="direction"
        title={text.direction}
      />

      <section className="border-t border-border py-9">
        <h2 className="text-xl font-semibold text-text">{text.references}</h2>
        {request.referenceUrls.length > 0 ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {request.referenceUrls.map((url, index) => (
              <li className="py-3" key={`${url}-${index}`}>
                <a
                  className="block break-all text-sm text-accent hover:underline"
                  href={url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {url}
                  <span className="ml-2" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">{text.noReference}</p>
        )}
        {request.references ? (
          <p className="mt-5 max-w-4xl whitespace-pre-line text-sm leading-7 text-text-secondary">
            {request.references}
          </p>
        ) : null}
      </section>

      <TextSection
        body={[request.characterDetails, request.requestType]
          .filter(Boolean)
          .join("\n\n")}
        id="details"
        title={text.details}
      />
      <TextSection
        body={request.attribution}
        id="source"
        title={text.source}
      />
    </main>
  );
}
