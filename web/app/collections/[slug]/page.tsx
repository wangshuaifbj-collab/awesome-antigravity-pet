import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionDetailContent } from "@/components/collection-detail-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import {
  getCollectionBySlug,
  getCollectionSlugs,
} from "@/lib/collection-catalog";
import { getAllPets } from "@/lib/pets";
import { withSiteKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return getCollectionSlugs(getAllPets()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(getAllPets(), slug);
  if (!collection) return { title: "Collection not found" };

  const title = `${collection.title.en} / ${collection.title.zh} Codex pets`;
  const description = `${collection.description.en} ${collection.description.zh}`;
  const canonical = `/collections/${collection.slug}`;
  const cover = collection.pets.find((pet) =>
    collection.coverSlugs.includes(pet.slug),
  );

  return {
    title,
    description,
    alternates: { canonical },
    keywords: withSiteKeywords([
      collection.title.en,
      collection.title.zh,
      `${collection.title.en} Codex pets`,
      `${collection.title.en} desktop pets`,
      `${collection.title.en} pixel pets`,
      `${collection.title.zh} Codex 小宠物`,
      `${collection.title.zh} Codex 宠物下载`,
      `${collection.title.zh} 桌面宠物`,
      "Codex pet collection",
      "Codex 宠物合集",
      ...collection.pets.flatMap((pet) => [
        pet.name,
        pet.localizedNames.en,
        pet.localizedNames.zh,
      ]),
    ]),
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      images: cover ? [cover.previewImage] : [siteConfig.ogImage],
      type: "website",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover.previewImage] : [siteConfig.ogImage],
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollectionBySlug(getAllPets(), slug);
  if (!collection) notFound();

  const url = `${siteConfig.url}/collections/${collection.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}/#collection`,
    name: collection.title.en,
    alternateName: collection.title.zh,
    description: collection.description.en,
    url,
    isPartOf: {
      "@id": `${siteConfig.url}/#website`,
    },
    inLanguage: ["en", "zh-CN"],
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: collection.pets.length,
      itemListElement: collection.pets.map((pet, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: pet.localizedNames.zh
          ? `${pet.localizedNames.en ?? pet.name} / ${pet.localizedNames.zh}`
          : pet.name,
        url: `${siteConfig.url}/pets/${pet.slug}`,
      })),
    },
  };

  return (
    <>
      <LocalizedDocumentTitle
        en={`${collection.title.en} Codex pets`}
        zh={`${collection.title.zh} Codex 宠物合集`}
      />
      <CollectionDetailContent collection={collection} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
