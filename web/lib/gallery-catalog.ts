import type { GalleryPet } from "@/lib/pets";

const MAX_GALLERY_PETS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

export function isGalleryPet(value: unknown): value is GalleryPet {
  if (!isRecord(value)) return false;
  if (
    ![
      "slug",
      "name",
      "author_slug",
      "author",
      "primary_category",
      "previewImage",
      "animatedPreviewImage",
    ].every((key) => typeof value[key] === "string")
  ) {
    return false;
  }
  if (
    ![
      "author_handle",
      "author_url",
      "canonical_key",
      "description",
      "displayName",
      "runtimeDescription",
    ].every((key) => isOptionalString(value[key]))
  ) {
    return false;
  }
  if (
    !isRecord(value.categoryLabel) ||
    typeof value.categoryLabel.en !== "string" ||
    !isRecord(value.localizedNames) ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === "string")
  ) {
    return false;
  }
  return Object.values(value.categoryLabel).every(
    (label) => typeof label === "string",
  );
}

export function parseGalleryCatalog(value: unknown): GalleryPet[] {
  if (
    !Array.isArray(value) ||
    value.length > MAX_GALLERY_PETS ||
    !value.every(isGalleryPet)
  ) {
    throw new Error("Gallery catalog returned an invalid payload");
  }
  const seen = new Set<string>();
  return value.filter((pet) => {
    if (seen.has(pet.slug)) return false;
    seen.add(pet.slug);
    return true;
  });
}
