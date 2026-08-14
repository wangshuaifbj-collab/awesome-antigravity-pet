import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { CategoryLabel } from "@/lib/pet-localization";

export type PreviewAction = string;

type CatalogPet = {
  slug: string;
  name: string;
  author_slug: string;
  author: string;
  author_handle?: string;
  author_url?: string;
  primary_category: string;
  canonical_key?: string;
  variant_note?: string;
  license: string;
  description?: string;
  spriteVersionNumber: 1 | 2;
};

export type LocalizedCategoryLabel = CategoryLabel;

export type LocalizedPetNames = {
  en?: string;
  zh?: string;
};

export type Pet = CatalogPet & {
  categoryLabel: LocalizedCategoryLabel;
  localizedNames: LocalizedPetNames;
  displayName?: string;
  runtimeDescription?: string;
  slugLabel: string;
  tags: string[];
  collections: string[];
  sourceType: string;
  sourceUrl: string;
  previewImage: string;
  animatedPreviewImage: string;
  actions: PreviewAction[];
  gifs: Record<PreviewAction, string>;
  installCommand: string;
  installCommandPowerShell: string;
  repositoryPath: string;
};

export type PetNameSource = Pick<
  Pet,
  "slug" | "name" | "localizedNames" | "displayName"
>;

export type GalleryPet = Pick<
  Pet,
  | "slug"
  | "name"
  | "author_slug"
  | "author"
  | "author_handle"
  | "author_url"
  | "primary_category"
  | "canonical_key"
  | "description"
  | "categoryLabel"
  | "localizedNames"
  | "displayName"
  | "runtimeDescription"
  | "tags"
  | "previewImage"
  | "animatedPreviewImage"
>;

function readGeneratedPets(): Pet[] {
  const path = join(process.cwd(), ".generated", "pets.generated.json");
  return JSON.parse(readFileSync(path, "utf8")) as Pet[];
}

export function getAllPets(): Pet[] {
  return readGeneratedPets();
}

export function getPetBySlug(slug: string) {
  return getAllPets().find((pet) => pet.slug === slug) ?? null;
}

export function toGalleryPet(pet: Pet): GalleryPet {
  return {
    slug: pet.slug,
    name: pet.name,
    author_slug: pet.author_slug,
    author: pet.author,
    author_handle: pet.author_handle,
    author_url: pet.author_url,
    primary_category: pet.primary_category,
    canonical_key: pet.canonical_key,
    description: pet.description,
    categoryLabel: pet.categoryLabel,
    localizedNames: pet.localizedNames,
    displayName: pet.displayName,
    runtimeDescription: pet.runtimeDescription,
    tags: pet.tags,
    previewImage: pet.previewImage,
    animatedPreviewImage: pet.animatedPreviewImage,
  };
}

export function getCategories(
  pets: Array<Pick<Pet, "primary_category" | "categoryLabel">>,
) {
  return Array.from(
    new Map(
      pets.map((pet) => [
        pet.primary_category,
        { name: pet.primary_category, label: pet.categoryLabel },
      ]),
    ).values(),
  );
}

function titleCase(input: string) {
  return input
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function getActionEntries(pet: Pet) {
  return pet.actions.map((action) => ({
    action,
    title: titleCase(action),
    image: pet.gifs[action] ?? `/assets/previews/${pet.slug}/gifs/${action}.gif`,
  }));
}
