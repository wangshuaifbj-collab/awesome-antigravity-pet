import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContributorPageContent } from "@/components/contributor-page-content";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import {
  getContributorBySlug,
  getContributorSlugs,
} from "@/lib/leaderboards";
import { getAllPets } from "@/lib/pets";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return getContributorSlugs(getAllPets()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = getContributorBySlug(getAllPets(), slug);
  if (!result) return { title: "Contributor not found" };
  const { contributor } = result;
  const title = `${contributor.name} Codex pets and community contributions`;
  const description = `${contributor.name} has ${contributor.petCount} accepted pets in Awesome Codex Pet. Browse their pets, installs, likes, and weekly community recognition.`;
  const canonical = `/contributors/${contributor.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "profile",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      images: contributor.pets[0]
        ? [{ url: contributor.pets[0].previewImage, alt: contributor.name }]
        : undefined,
    },
  };
}

export default async function ContributorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = getContributorBySlug(getAllPets(), slug);
  if (!result) notFound();
  const { contributor, pets } = result;
  const url = `${siteConfig.url}/contributors/${contributor.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}/#creator`,
    name: contributor.name,
    alternateName: contributor.handle,
    url,
    sameAs: contributor.url || undefined,
    mainEntityOfPage: url,
    knowsAbout: "Codex pet creation",
    owns: pets.map((entry) => ({
      "@type": "CreativeWork",
      name: entry.pet.localizedNames.en ?? entry.pet.name,
      url: `${siteConfig.url}/pets/${entry.pet.slug}`,
    })),
  };

  return (
    <>
      <LocalizedDocumentTitle
        en={`${contributor.name} Codex pets and community contributions`}
        zh={`${contributor.name} 的 Codex 宠物与社区贡献`}
      />
      <ContributorPageContent contributor={contributor} pets={pets} />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}
