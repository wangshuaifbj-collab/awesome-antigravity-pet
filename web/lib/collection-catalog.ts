import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { CollectionCatalogEntry, PetCollection } from "@/lib/collections";
import type { Pet } from "@/lib/pets";

export const MIN_PUBLIC_COLLECTION_PETS = 3;

function readGeneratedCollections(): CollectionCatalogEntry[] {
  const path = join(process.cwd(), ".generated", "collections.generated.json");
  return JSON.parse(readFileSync(path, "utf8")) as CollectionCatalogEntry[];
}

export function getCollections(pets: Pet[]): PetCollection[] {
  const petsByCollection = new Map<string, Pet[]>();

  for (const pet of pets) {
    for (const slug of pet.collections) {
      const members = petsByCollection.get(slug) ?? [];
      members.push(pet);
      petsByCollection.set(slug, members);
    }
  }

  return readGeneratedCollections()
    .map((collection) => ({
      ...collection,
      pets: petsByCollection.get(collection.slug) ?? [],
    }))
    .filter(
      (collection) => collection.pets.length >= MIN_PUBLIC_COLLECTION_PETS,
    );
}

export function getFeaturedCollections(pets: Pet[]) {
  return getCollections(pets).filter((collection) => collection.featured);
}

export function getCollectionBySlug(pets: Pet[], slug: string) {
  return (
    getCollections(pets).find((collection) => collection.slug === slug) ?? null
  );
}

export function getCollectionSlugs(pets: Pet[]) {
  return getCollections(pets).map((collection) => collection.slug);
}
