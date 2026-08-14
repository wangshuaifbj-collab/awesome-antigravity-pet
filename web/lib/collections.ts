import type { Locale } from "@/lib/i18n";
import type { GalleryPet, Pet } from "@/lib/pets";
import { getTagSearchTerms } from "@/lib/tag-localization";

export type LocalizedText = Record<"en" | "zh", string> &
  Partial<Record<Exclude<Locale, "en" | "zh">, string>>;
export type CollectionKind = "franchise" | "theme";

export type CollectionCatalogEntry = {
  slug: string;
  kind: CollectionKind;
  title: LocalizedText;
  description: LocalizedText;
  featured: boolean;
  coverSlugs: string[];
};

export type PetCollection = CollectionCatalogEntry & {
  pets: Pet[];
};

export type CollectionCardData = Omit<
  CollectionCatalogEntry,
  "coverSlugs"
> & {
  petSlugs: string[];
  coverPets: GalleryPet[];
  searchText: string;
};

export function getLocalizedCollectionText(
  value: LocalizedText,
  locale: Locale,
) {
  return value[locale] ?? value.en;
}

export function getCollectionCoverPets(collection: PetCollection) {
  const petsBySlug = new Map(collection.pets.map((pet) => [pet.slug, pet]));
  return collection.coverSlugs
    .map((slug) => petsBySlug.get(slug))
    .filter((pet): pet is Pet => pet !== undefined);
}

export function toCollectionCardData(
  collection: PetCollection,
): CollectionCardData {
  return {
    slug: collection.slug,
    kind: collection.kind,
    title: collection.title,
    description: collection.description,
    featured: collection.featured,
    petSlugs: collection.pets.map((pet) => pet.slug),
    coverPets: getCollectionCoverPets(collection).map((pet) => ({
      slug: pet.slug,
      name: pet.name,
      author_slug: pet.author_slug,
      author: pet.author,
      author_handle: pet.author_handle,
      author_url: pet.author_url,
      primary_category: pet.primary_category,
      description: pet.description,
      categoryLabel: pet.categoryLabel,
      localizedNames: pet.localizedNames,
      displayName: pet.displayName,
      runtimeDescription: pet.runtimeDescription,
      tags: pet.tags,
      previewImage: pet.previewImage,
      animatedPreviewImage: pet.animatedPreviewImage,
    })),
    searchText: [
      collection.slug,
      ...Object.values(collection.title),
      ...Object.values(collection.description),
      ...collection.pets.flatMap((pet) => [
        pet.slug,
        pet.name,
        pet.displayName ?? "",
        pet.localizedNames.en ?? "",
        pet.localizedNames.zh ?? "",
        ...pet.tags.flatMap(getTagSearchTerms),
      ]),
    ]
      .join(" ")
      .normalize("NFKC")
      .toLocaleLowerCase(),
  };
}
