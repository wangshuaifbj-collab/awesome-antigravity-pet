import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { RequestDetailContent } from "@/components/request-detail-content";
import {
  getAllRequests,
  getRequestByNumber,
} from "@/lib/request-catalog";
import { requestExcerpt } from "@/lib/request-display";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return getAllRequests().map((request) => ({
    number: String(request.number),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const request = getRequestByNumber(Number(number));
  if (!request) return { title: "Request not found" };
  const title = `${request.character} Codex pet request`;
  const description = requestExcerpt(
    request.visualDirection ||
      `${request.character} is requested by the Awesome Codex Pet community.`,
    160,
  );
  return {
    title,
    description,
    alternates: { canonical: `/requests/${request.number}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteConfig.url}/requests/${request.number}`,
      images: request.referenceImages[0]
        ? [{ url: request.referenceImages[0], alt: request.character }]
        : undefined,
    },
  };
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const request = getRequestByNumber(Number(number));
  if (!request) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: request.character,
    description: request.visualDirection,
    url: `${siteConfig.url}/requests/${request.number}`,
    discussionUrl: request.githubUrl,
    creator: {
      "@type": "Person",
      name: request.author.login,
      url: request.author.url,
    },
    dateCreated: request.createdAt,
    dateModified: request.updatedAt,
    isAccessibleForFree: true,
  };

  return (
    <>
      <LocalizedDocumentTitle
        en={`${request.character} Codex pet request`}
        zh={`${request.character} Codex 小宠物制作请求`}
      />
      <RequestDetailContent request={request} />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
