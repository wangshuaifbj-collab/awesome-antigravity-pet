import type { GalleryPet } from "@/lib/pets";

function randomInt(maxExclusive: number) {
  if (maxExclusive <= 1) return 0;

  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoApi.getRandomValues(values);
    return values[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function drawGachaPets(
  pets: GalleryPet[],
  count: number,
  previousSlugs: string[] = [],
) {
  const available = pets.filter(
    (pet) => pet.previewImage && pet.animatedPreviewImage,
  );
  if (available.length === 0 || count <= 0) return [];

  const previous = new Set(previousSlugs);
  const groups = new Map<string, GalleryPet[]>();
  for (const pet of available) {
    const groupKey = pet.canonical_key || `pet:${pet.slug}`;
    const group = groups.get(groupKey) ?? [];
    group.push(pet);
    groups.set(groupKey, group);
  }

  const freshGroups = [...groups.entries()].filter(([, group]) =>
    group.every((pet) => !previous.has(pet.slug)),
  );
  const candidateGroups =
    freshGroups.length >= count ? freshGroups : [...groups.entries()];

  return shuffled(candidateGroups)
    .slice(0, Math.min(count, candidateGroups.length))
    .map(([, variants]) => variants[randomInt(variants.length)]);
}
