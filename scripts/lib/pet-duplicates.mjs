const canonicalKeyPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function identityNames(submission) {
  const names = [
    submission?.name,
    submission?.localized_names?.en,
    submission?.localized_names?.zh,
  ];
  return new Set(names.map(normalizeText).filter(Boolean));
}

function franchiseCollections(submission, collectionKinds) {
  return new Set(
    (submission?.collections ?? []).filter(
      (slug) => collectionKinds.get(slug) === "franchise",
    ),
  );
}

function intersects(left, right) {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

function normalizedAuthor(submission) {
  return normalizeText(
    submission?.author_handle ?? submission?.author_slug ?? submission?.author,
  );
}

function hasVariantNote(submission) {
  return (
    typeof submission?.variant_note === "string" &&
    submission.variant_note.trim().length > 0
  );
}

export function analyzePetDuplicates(
  records,
  {
    changedSubmissionSlugs = new Set(),
    changedAssetSlugs = new Set(),
    newSubmissionSlugs = new Set(),
    collectionKinds = new Map(),
  } = {},
) {
  const errors = [];
  const warnings = [];
  const byCanonicalKey = new Map();
  const byFingerprint = new Map();
  const byName = new Map();

  for (const record of records) {
    const canonicalKey = record.submission?.canonical_key?.trim();
    if (canonicalKey) {
      const matches = byCanonicalKey.get(canonicalKey) ?? [];
      matches.push(record);
      byCanonicalKey.set(canonicalKey, matches);
    }

    if (record.assetFingerprint) {
      const matches = byFingerprint.get(record.assetFingerprint) ?? [];
      matches.push(record);
      byFingerprint.set(record.assetFingerprint, matches);
    }

    for (const name of identityNames(record.submission)) {
      const matches = byName.get(name) ?? [];
      matches.push(record);
      byName.set(name, matches);
    }
  }

  for (const record of records) {
    if (!changedSubmissionSlugs.has(record.slug)) continue;

    const canonicalKey = record.submission?.canonical_key?.trim();
    if (!canonicalKey) {
      if (newSubmissionSlugs.has(record.slug)) {
        errors.push(
          `${record.slug}: new submission.json must include canonical_key`,
        );
      } else {
        warnings.push(
          `${record.slug}: legacy submission has no canonical_key; duplicate review will fall back to names and franchise metadata`,
        );
      }
      continue;
    }
    if (
      canonicalKey !== record.submission.canonical_key ||
      !canonicalKeyPattern.test(canonicalKey)
    ) {
      errors.push(
        `${record.slug}: canonical_key must be lowercase slash-separated kebab-case`,
      );
      continue;
    }

    const canonicalMatches = (byCanonicalKey.get(canonicalKey) ?? []).filter(
      (candidate) => candidate.slug !== record.slug,
    );
    if (canonicalMatches.length > 0) {
      const existingSlugs = canonicalMatches
        .map((candidate) => candidate.slug)
        .sort()
        .join(", ");
      if (!hasVariantNote(record.submission)) {
        errors.push(
          `${record.slug}: canonical_key ${canonicalKey} already belongs to ${existingSlugs}; independent versions are allowed, but variant_note must explain the visual, author, or runtime distinction`,
        );
      } else {
        warnings.push(
          `${record.slug}: accepted as another version of ${canonicalKey}; related packages: ${existingSlugs}`,
        );
      }

      const sameAuthorMatches = canonicalMatches.filter(
        (candidate) =>
          normalizedAuthor(candidate.submission) ===
          normalizedAuthor(record.submission),
      );
      if (sameAuthorMatches.length > 0) {
        warnings.push(
          `${record.slug}: the same author already has ${sameAuthorMatches
            .map((candidate) => candidate.slug)
            .sort()
            .join(
              ", ",
            )} for this character; update that package unless this is a materially distinct edition`,
        );
      }
    }

    const names = identityNames(record.submission);
    const works = franchiseCollections(record.submission, collectionKinds);
    const possibleMatches = new Map();
    for (const name of names) {
      for (const candidate of byName.get(name) ?? []) {
        if (
          candidate.slug !== record.slug &&
          candidate.submission?.canonical_key?.trim() !== canonicalKey
        ) {
          possibleMatches.set(candidate.slug, candidate);
        }
      }
    }

    for (const candidate of possibleMatches.values()) {
      const candidateWorks = franchiseCollections(
        candidate.submission,
        collectionKinds,
      );
      const workContext =
        works.size > 0 &&
        candidateWorks.size > 0 &&
        intersects(works, candidateWorks)
          ? " and shares a franchise collection"
          : "";
      warnings.push(
        `${record.slug}: name matches ${candidate.slug}${workContext}; verify whether both should use the same canonical_key`,
      );
    }
  }

  for (const record of records) {
    if (!changedAssetSlugs.has(record.slug) || !record.assetFingerprint) {
      continue;
    }
    const assetMatches = (byFingerprint.get(record.assetFingerprint) ?? [])
      .filter((candidate) => candidate.slug !== record.slug)
      .map((candidate) => candidate.slug)
      .sort();
    if (assetMatches.length > 0) {
      errors.push(
        `${record.slug}: spritesheet.webp is byte-identical to ${assetMatches.join(", ")}; submit an independent asset or update the existing package`,
      );
    }
  }

  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}

export { canonicalKeyPattern, identityNames };
