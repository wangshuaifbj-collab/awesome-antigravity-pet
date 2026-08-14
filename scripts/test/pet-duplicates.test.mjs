import assert from "node:assert/strict";
import test from "node:test";

import { analyzePetDuplicates } from "../lib/pet-duplicates.mjs";

const collectionKinds = new Map([["example-series", "franchise"]]);

function record(
  slug,
  {
    author = slug,
    canonicalKey,
    fingerprint = slug,
    name = "Example",
    variantNote,
  } = {},
) {
  return {
    slug,
    assetFingerprint: fingerprint,
    submission: {
      author,
      canonical_key: canonicalKey,
      collections: ["example-series"],
      name,
      variant_note: variantNote,
    },
  };
}

test("allows independent author versions with one canonical key and a variant note", () => {
  const result = analyzePetDuplicates(
    [
      record("example--alice", {
        author: "Alice",
        canonicalKey: "example-series/example",
      }),
      record("example--bob", {
        author: "Bob",
        canonicalKey: "example-series/example",
        variantNote: "Independent v2 interpretation by Bob.",
      }),
    ],
    {
      changedSubmissionSlugs: new Set(["example--bob"]),
      collectionKinds,
    },
  );

  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /another version/);
});

test("requires a variant note when the canonical character already exists", () => {
  const result = analyzePetDuplicates(
    [
      record("example--alice", {
        canonicalKey: "example-series/example",
      }),
      record("example--bob", {
        canonicalKey: "example-series/example",
      }),
    ],
    {
      changedSubmissionSlugs: new Set(["example--bob"]),
      collectionKinds,
    },
  );

  assert.match(result.errors.join("\n"), /variant_note/);
});

test("blocks byte-identical spritesheets even for different authors", () => {
  const result = analyzePetDuplicates(
    [
      record("example--alice", {
        canonicalKey: "example-series/example",
        fingerprint: "same-asset",
      }),
      record("example--bob", {
        canonicalKey: "example-series/example",
        fingerprint: "same-asset",
        variantNote: "Independent edition.",
      }),
    ],
    {
      changedAssetSlugs: new Set(["example--bob"]),
      changedSubmissionSlugs: new Set(["example--bob"]),
      collectionKinds,
    },
  );

  assert.match(result.errors.join("\n"), /byte-identical/);
});

test("requires canonical keys only for new submissions", () => {
  const unchangedLegacy = analyzePetDuplicates(
    [record("legacy--alice", { canonicalKey: undefined })],
    { collectionKinds },
  );
  const changedLegacy = analyzePetDuplicates(
    [record("legacy--alice", { canonicalKey: undefined })],
    {
      changedSubmissionSlugs: new Set(["legacy--alice"]),
      collectionKinds,
    },
  );
  const newSubmission = analyzePetDuplicates(
    [record("new--alice", { canonicalKey: undefined })],
    {
      changedSubmissionSlugs: new Set(["new--alice"]),
      newSubmissionSlugs: new Set(["new--alice"]),
      collectionKinds,
    },
  );

  assert.deepEqual(unchangedLegacy.errors, []);
  assert.deepEqual(changedLegacy.errors, []);
  assert.match(changedLegacy.warnings.join("\n"), /legacy submission/);
  assert.match(newSubmission.errors.join("\n"), /canonical_key/);
});

test("warns about matching names under different canonical keys", () => {
  const result = analyzePetDuplicates(
    [
      record("example--alice", {
        canonicalKey: "example-series/example",
      }),
      record("example-remake--bob", {
        canonicalKey: "example-series/example-remake",
      }),
    ],
    {
      changedSubmissionSlugs: new Set(["example-remake--bob"]),
      collectionKinds,
    },
  );

  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /shares a franchise collection/);
});

test("warns when the same author creates a second package for one character", () => {
  const result = analyzePetDuplicates(
    [
      record("example-v1--alice", {
        author: "Alice",
        canonicalKey: "example-series/example",
      }),
      record("example-v2--alice", {
        author: "Alice",
        canonicalKey: "example-series/example",
        variantNote: "A separate high-detail edition.",
      }),
    ],
    {
      changedSubmissionSlugs: new Set(["example-v2--alice"]),
      collectionKinds,
    },
  );

  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /same author/);
});
