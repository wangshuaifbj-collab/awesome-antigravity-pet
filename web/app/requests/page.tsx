import type { Metadata } from "next";

import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { RequestPlazaContent } from "@/components/request-plaza-content";
import { getAllRequests } from "@/lib/request-catalog";
import { siteConfig } from "@/lib/site";

const title = "Codex pet request plaza";
const description =
  "Browse community Codex pet requests, support characters you want, follow production progress, or volunteer to create a pet.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/requests" },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${siteConfig.url}/requests`,
  },
};

export default function RequestsPage() {
  const requests = getAllRequests();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${siteConfig.url}/requests`,
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: requests.length,
      itemListElement: requests.map((request, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: request.character,
        url: `${siteConfig.url}/requests/${request.number}`,
      })),
    },
  };

  return (
    <>
      <LocalizedDocumentTitle
        en="Codex pet request plaza"
        zh="Codex 小宠物制作需求广场"
      />
      <RequestPlazaContent requests={requests} />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
