import type { Metadata } from "next";

import { FeaturedCollections } from "@/components/featured-collections";
import { HeroSection } from "@/components/hero-section";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { PetGallery } from "@/components/pet-gallery";
import { CommunityPulse } from "@/components/community-pulse";
import { HomeRequestSection } from "@/components/home-request-section";
import { getCollections } from "@/lib/collection-catalog";
import { toCollectionCardData } from "@/lib/collections";
import { getCommunityPulseData, getLeaderboardData } from "@/lib/leaderboards";
import { getAllPets, getCategories, toGalleryPet } from "@/lib/pets";
import { getTrendingPets } from "@/lib/ranking";
import { getAllRequests, getOpenRequests } from "@/lib/request-catalog";
import { languageAlternates } from "@/lib/localized-route-metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.title} — free Codex pet gallery and community`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
    languages: languageAlternates("/"),
  },
  openGraph: {
    title: `${siteConfig.title} — free Codex pet gallery and community`,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "ko_KR", "ja_JP", "es_ES"],
    images: [
      {
        url: siteConfig.ogImage,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.title} — free Codex pet gallery and community`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

export default function HomePage() {
  const pets = getAllPets();
  const galleryPets = pets.map(toGalleryPet);
  const categoryCounts = new Map<string, number>();
  for (const pet of galleryPets) {
    categoryCounts.set(
      pet.primary_category,
      (categoryCounts.get(pet.primary_category) ?? 0) + 1,
    );
  }
  const categories = getCategories(galleryPets).map((category) => ({
    ...category,
    count: categoryCounts.get(category.name) ?? 0,
  }));
  const collections = getCollections(pets).map(toCollectionCardData);
  const featured = getTrendingPets(pets, 6).map(toGalleryPet);
  const leaderboard = getLeaderboardData(pets);
  const initialGalleryPets = [...leaderboard.pets]
    .sort((left, right) => {
      const leftRank = left.stats.dailyRank || Number.MAX_SAFE_INTEGER;
      const rightRank = right.stats.dailyRank || Number.MAX_SAFE_INTEGER;
      return (
        leftRank - rightRank || left.pet.slug.localeCompare(right.pet.slug)
      );
    })
    .slice(0, 18)
    .map((entry) => entry.pet);
  const communityPulse = getCommunityPulseData(leaderboard);
  const requests = getOpenRequests(getAllRequests()).slice(0, 4);

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteConfig.url}/#gallery`,
        name: `${siteConfig.title} — curated OpenAI Codex pet gallery`,
        description: siteConfig.description,
        url: siteConfig.url,
        isPartOf: {
          "@id": `${siteConfig.url}/#website`,
        },
        inLanguage: ["en", "zh-CN", "ko", "ja", "es"],
        isAccessibleForFree: true,
        potentialAction: [
          {
            "@type": "ViewAction",
            name: "Browse free Codex pets",
            target: `${siteConfig.url}/#gallery`,
          },
          {
            "@type": "InstallAction",
            name: "Install a Codex pet",
            target: `${siteConfig.url}/install`,
          },
          {
            "@type": "CreateAction",
            name: "Request a character from the community",
            target: `${siteConfig.url}/request`,
          },
        ],
        mainEntity: {
          "@type": "ItemList",
          name: "Curated Codex pets",
          numberOfItems: pets.length,
          itemListElement: pets.slice(0, 24).map((pet, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteConfig.url}/pets/${pet.slug}`,
            name: pet.localizedNames.zh
              ? `${pet.localizedNames.en ?? pet.name} / ${pet.localizedNames.zh}`
              : pet.name,
          })),
        },
      },
      {
        "@type": "Dataset",
        "@id": `${siteConfig.url}/#catalog`,
        name: "Awesome Codex Pet catalog",
        alternateName: "Codex 宠物目录",
        description:
          "A machine-readable catalog of free-to-browse community Codex pets, creators, localized names, categories, animation versions, licenses, previews, and one-step installation commands.",
        url: siteConfig.url,
        creator: {
          "@id": `${siteConfig.url}/#organization`,
        },
        isAccessibleForFree: true,
        inLanguage: ["en", "zh-CN", "ko", "ja", "es"],
        keywords: siteConfig.keywords,
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${siteConfig.url}${siteConfig.catalog}`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${siteConfig.url}${siteConfig.collectionsCatalog}`,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <LocalizedDocumentTitle
        en="Free Codex pet gallery and community"
        es="Galería y comunidad gratuita de mascotas Codex"
        ja="無料 Codex ペットギャラリーとコミュニティ"
        ko="무료 Codex 펫 갤러리와 커뮤니티"
        zh="Codex 宠物画廊与社区"
      />
      <HeroSection
        petCount={pets.length}
        categoryCount={categories.length}
        featured={featured}
      />
      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1720px]">
          <CommunityPulse data={communityPulse} />
          <HomeRequestSection requests={requests} />
          <FeaturedCollections collections={collections} />
          <PetGallery
            pets={initialGalleryPets}
            categories={categories}
            catalogUrl="/gallery.json"
            totalPetCount={galleryPets.length}
          />
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
    </main>
  );
}
