import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PetDetailContent } from "@/components/pet-detail-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { getActionEntries, getAllPets, getPetBySlug } from "@/lib/pets";
import { getPetSeoKeywords } from "@/lib/seo-keywords";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return getAllPets().map((pet) => ({ slug: pet.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pet = getPetBySlug(slug);
  if (!pet) {
    return { title: "Pet not found" };
  }

  const previewImage = pet.previewImage?.startsWith("/")
    ? pet.previewImage
    : `/${pet.previewImage}`;
  const localizedName = pet.localizedNames.zh
    ? `${pet.localizedNames.en ?? pet.name} / ${pet.localizedNames.zh}`
    : pet.name;
  const title = `${localizedName} Codex pet by ${pet.author_handle ?? pet.author}`;
  const description =
    pet.description ??
    pet.runtimeDescription ??
    `Meet ${pet.name}, a selected community Codex pet by ${pet.author}. Preview every action and install it in one step.`;
  const canonical = `/pets/${pet.slug}`;
  const url = `${siteConfig.url}${canonical}`;
  const keywords = getPetSeoKeywords(pet);

  return {
    title,
    description,
    alternates: { canonical },
    keywords,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      images: [
        {
          url: previewImage,
          alt: `${pet.name} idle preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage],
    },
  };
}

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pet = getPetBySlug(slug);

  if (!pet) {
    notFound();
  }

  const actions = getActionEntries(pet);
  const pets = getAllPets();
  const petIndex = pets.findIndex((item) => item.slug === pet.slug);
  const previous = pets[(petIndex - 1 + pets.length) % pets.length];
  const next = pets[(petIndex + 1) % pets.length];
  const url = `${siteConfig.url}/pets/${pet.slug}`;
  const previewImage = pet.previewImage?.startsWith("http")
    ? pet.previewImage
    : `${siteConfig.url}${pet.previewImage}`;
  const keywords = getPetSeoKeywords(pet);

  const petJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}/#pet`,
    name: pet.name,
    alternateName: [
      pet.localizedNames.en,
      pet.localizedNames.zh,
      pet.displayName,
    ].filter(Boolean),
    description:
      pet.description ??
      pet.runtimeDescription ??
      `${pet.name} — a Codex pet`,
    url,
    image: previewImage,
    author: {
      "@type": "Person",
      name: pet.author,
      url: pet.author_url ?? undefined,
    },
    genre: pet.primary_category,
    keywords,
    license: pet.license,
    version: `V${pet.spriteVersionNumber}`,
    isPartOf: {
      "@id": `${siteConfig.url}/#catalog`,
    },
    inLanguage: ["en", "zh-CN"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Gallery",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pet.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <LocalizedDocumentTitle
        en={`${pet.localizedNames.en ?? pet.name} Codex pet by ${
          pet.author_handle ?? pet.author
        }`}
        zh={`${pet.localizedNames.zh ?? pet.name} Codex 宠物`}
      />
      <PetDetailContent
        pet={pet}
        actions={actions}
        navigation={{
          previous: { slug: previous.slug, name: previous.name },
          next: { slug: next.slug, name: next.name },
          slugs: pets.map((item) => item.slug),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(petJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
