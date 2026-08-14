import type { MetadataRoute } from "next";

import { getAllPets } from "@/lib/pets";
import { getCollectionSlugs } from "@/lib/collection-catalog";
import { getContributorSlugs } from "@/lib/leaderboards";
import { getAllRequests } from "@/lib/request-catalog";
import { localePath } from "@/lib/i18n";
import { additionalWebLocales } from "@/lib/localized-route-metadata";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pets = getAllPets();
  const requests = getAllRequests();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.url}/collections`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/rankings`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteConfig.url}/zh`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/install`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/zh/install`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${siteConfig.url}/request`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/requests`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/zh/request`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/guide`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
  const additionalLocaleEntries: MetadataRoute.Sitemap =
    additionalWebLocales.flatMap((locale) => [
      {
        url: `${siteConfig.url}${localePath(locale, "/")}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${siteConfig.url}${localePath(locale, "/install")}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${siteConfig.url}${localePath(locale, "/request")}`,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      },
    ]);
  const petEntries = pets.map((pet) => ({
    url: `${siteConfig.url}/pets/${pet.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const collectionEntries = getCollectionSlugs(pets).map((slug) => ({
    url: `${siteConfig.url}/collections/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));
  const contributorEntries = getContributorSlugs(pets).map((slug) => ({
    url: `${siteConfig.url}/contributors/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));
  const requestEntries = requests.map((request) => ({
    url: `${siteConfig.url}/requests/${request.number}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [
    ...staticEntries,
    ...additionalLocaleEntries,
    ...collectionEntries,
    ...contributorEntries,
    ...requestEntries,
    ...petEntries,
  ];
}
