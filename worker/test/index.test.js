import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  buildInstallKeys,
  buildLikeKey,
  buildCreatorFollowKey,
  buildCreatorFollowRateKey,
  buildRequestSupportKey,
  buildRequestSupportRateKey,
  buildManualRequestRateKey,
  buildManualRequestDedupeKey,
  computeTrendingScore,
  buildReferenceImageUrl,
  inspectReferenceImage,
  inspectReferenceThumbnail,
  isOriginAllowed,
  normalizeManualRequest,
  normalizeManualRequestSubmission,
  serializeStatsRows,
  verifyTurnstile,
} from "../src/index.js";
import { buildIssueBody } from "../scripts/sync-manual-requests.mjs";

const env = {
  ALLOWED_ORIGINS: "https://codexpet.top,http://localhost:3000",
  HASH_SALT: "test-only-hash-salt-value",
};

test("origin checks allow scripts and configured browser origins", () => {
  assert.equal(
    isOriginAllowed(new Request("https://stats.example/stats"), env),
    true,
  );
  assert.equal(
    isOriginAllowed(
      new Request("https://stats.example/stats", {
        headers: { Origin: "https://codexpet.top" },
      }),
      env,
    ),
    true,
  );
  assert.equal(
    isOriginAllowed(
      new Request("https://stats.example/stats", {
        headers: { Origin: "https://example.invalid" },
      }),
      env,
    ),
    false,
  );
});

test("removed public read, view, and vote routes stay disabled", async () => {
  const routeEnv = { ...env, DB: {} };
  const stats = await worker.fetch(
    new Request("https://api.example/stats"),
    routeEnv,
  );
  const view = await worker.fetch(
    new Request("https://api.example/track/view?slug=firefly--lingxiaotian", {
      method: "POST",
      headers: { Origin: "https://codexpet.top" },
    }),
    routeEnv,
  );
  const vote = await worker.fetch(
    new Request(
      "https://api.example/track/vote?kind=pet&slug=firefly--lingxiaotian",
      {
        method: "POST",
        headers: { Origin: "https://codexpet.top" },
      },
    ),
    routeEnv,
  );

  assert.equal(stats.status, 404);
  assert.equal(view.status, 404);
  assert.equal(vote.status, 404);
});

test("public config exposes safe client capabilities", async () => {
  const routeEnv = {
    ...env,
    DB: {
      prepare(sql) {
        assert.match(sql, /turnstile_site_key/);
        return { first: async () => ({ config_value: "public-site-key" }) };
      },
    },
  };
  const response = await worker.fetch(
    new Request("https://api.example/config/public", {
      headers: { Origin: "https://codexpet.top" },
    }),
    routeEnv,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    turnstileSiteKey: "public-site-key",
    referenceUploadEnabled: false,
  });
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://codexpet.top",
  );
});

test("install receipt IDs are idempotent", async () => {
  const request = new Request(
    "https://stats.example/track/install?slug=firefly--lingxiaotian",
    {
      method: "POST",
      headers: {
        "CF-Connecting-IP": "203.0.113.4",
        "X-Event-ID": "install.12345678",
      },
    },
  );
  const first = await buildInstallKeys(
    request,
    env,
    "firefly--lingxiaotian",
    Date.UTC(2026, 6, 14, 1),
  );
  const later = await buildInstallKeys(
    request,
    env,
    "firefly--lingxiaotian",
    Date.UTC(2026, 6, 15, 1),
  );

  assert.equal(first.eventKey, later.eventKey);
});

test("like keys allow one like per IP and pet", async () => {
  const firstRequest = new Request("https://stats.example/track/like", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const sameIpRequest = new Request("https://stats.example/track/like", {
    headers: {
      "CF-Connecting-IP": "203.0.113.4",
      "User-Agent": "another browser",
    },
  });
  const otherIpRequest = new Request("https://stats.example/track/like", {
    headers: { "CF-Connecting-IP": "203.0.113.5" },
  });

  const first = await buildLikeKey(firstRequest, env, "firefly--lingxiaotian");
  const sameIp = await buildLikeKey(
    sameIpRequest,
    env,
    "firefly--lingxiaotian",
  );
  const otherIp = await buildLikeKey(
    otherIpRequest,
    env,
    "firefly--lingxiaotian",
  );
  const otherPet = await buildLikeKey(
    firstRequest,
    env,
    "acheron--lingxiaotian",
  );

  assert.equal(first, sameIp);
  assert.notEqual(first, otherIp);
  assert.notEqual(first, otherPet);
});

test("creator follow keys are scoped by IP and creator", async () => {
  const firstRequest = new Request(
    "https://stats.example/track/creator-follow",
    {
      headers: { "CF-Connecting-IP": "203.0.113.4" },
    },
  );
  const sameIpRequest = new Request(
    "https://stats.example/track/creator-follow",
    {
      headers: {
        "CF-Connecting-IP": "203.0.113.4",
        "User-Agent": "another browser",
      },
    },
  );
  const otherIpRequest = new Request(
    "https://stats.example/track/creator-follow",
    { headers: { "CF-Connecting-IP": "203.0.113.5" } },
  );

  const first = await buildCreatorFollowKey(firstRequest, env, "lingxiaotian");
  const sameIp = await buildCreatorFollowKey(
    sameIpRequest,
    env,
    "lingxiaotian",
  );
  const otherIp = await buildCreatorFollowKey(
    otherIpRequest,
    env,
    "lingxiaotian",
  );
  const otherCreator = await buildCreatorFollowKey(
    firstRequest,
    env,
    "chenxin-dlut",
  );
  const firstRate = await buildCreatorFollowRateKey(
    firstRequest,
    env,
    Date.UTC(2026, 6, 13, 1),
  );
  const sameRate = await buildCreatorFollowRateKey(
    sameIpRequest,
    env,
    Date.UTC(2026, 6, 13, 1, 59),
  );
  const nextHourRate = await buildCreatorFollowRateKey(
    firstRequest,
    env,
    Date.UTC(2026, 6, 13, 2),
  );

  assert.equal(first, sameIp);
  assert.notEqual(first, otherIp);
  assert.notEqual(first, otherCreator);
  assert.equal(firstRate.key, sameRate.key);
  assert.notEqual(firstRate.key, nextHourRate.key);
});

test("request support keys are scoped by IP and issue", async () => {
  const firstRequest = new Request(
    "https://stats.example/track/request-support",
    { headers: { "CF-Connecting-IP": "203.0.113.4" } },
  );
  const sameIpRequest = new Request(
    "https://stats.example/track/request-support",
    {
      headers: {
        "CF-Connecting-IP": "203.0.113.4",
        "User-Agent": "another browser",
      },
    },
  );
  const otherIpRequest = new Request(
    "https://stats.example/track/request-support",
    { headers: { "CF-Connecting-IP": "203.0.113.5" } },
  );

  const first = await buildRequestSupportKey(firstRequest, env, 77);
  const sameIp = await buildRequestSupportKey(sameIpRequest, env, 77);
  const otherIp = await buildRequestSupportKey(otherIpRequest, env, 77);
  const otherIssue = await buildRequestSupportKey(firstRequest, env, 69);
  const firstRate = await buildRequestSupportRateKey(
    firstRequest,
    env,
    Date.UTC(2026, 6, 29, 1),
  );
  const nextHourRate = await buildRequestSupportRateKey(
    firstRequest,
    env,
    Date.UTC(2026, 6, 29, 2),
  );

  assert.equal(first, sameIp);
  assert.notEqual(first, otherIp);
  assert.notEqual(first, otherIssue);
  assert.notEqual(firstRate.key, nextHourRate.key);
});

test("manual request rate keys stay scoped to one IP across the rolling day", async () => {
  const firstRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const sameIpRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const otherIpRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.5" },
  });

  const first = await buildManualRequestRateKey(firstRequest, env);
  const sameIp = await buildManualRequestRateKey(sameIpRequest, env);
  const otherIp = await buildManualRequestRateKey(otherIpRequest, env);

  assert.equal(first, sameIp);
  assert.notEqual(first, otherIp);
});

test("manual request dedupe keys normalize the same character per IP", async () => {
  const firstRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const sameIpRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const otherIpRequest = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.5" },
  });

  const first = await buildManualRequestDedupeKey(
    firstRequest,
    env,
    "  Ｋｕｒｏｍｉ  ",
    "  Sanrio  ",
  );
  const sameIp = await buildManualRequestDedupeKey(
    sameIpRequest,
    env,
    "kuromi",
    "sanrio",
  );
  const otherFranchise = await buildManualRequestDedupeKey(
    firstRequest,
    env,
    "kuromi",
    "",
  );
  const otherIp = await buildManualRequestDedupeKey(
    otherIpRequest,
    env,
    "kuromi",
    "sanrio",
  );

  assert.equal(first, sameIp);
  assert.notEqual(first, otherFranchise);
  assert.notEqual(first, otherIp);
});

test("stats serialization exposes recent likes and creator fields", () => {
  const payload = serializeStatsRows(
    [
      {
        slug: "firefly--lingxiaotian",
        installs: 10,
        likes: 7,
        installs_7d: 3,
        likes_7d: 5,
        updated_at: 42,
      },
    ],
    Date.UTC(2026, 6, 14),
    [{ slug: "lingxiaotian", followers: 12 }],
    [{ issue_number: 77, supporters: 4, updated_at: 43 }],
  );

  assert.equal(payload.windowDays, 7);
  assert.equal(payload.pets["firefly--lingxiaotian"].installs7d, 3);
  assert.equal(payload.pets["firefly--lingxiaotian"].likes, 7);
  assert.equal(payload.pets["firefly--lingxiaotian"].likes7d, 5);
  assert.equal(
    payload.pets["firefly--lingxiaotian"].trendingScore,
    computeTrendingScore(3, 5),
  );
  assert.equal(payload.creators.lingxiaotian.followers, 12);
  assert.deepEqual(payload.requests["77"], {
    supporters: 4,
    updatedAt: 43,
  });
  assert.ok(payload.pets["firefly--lingxiaotian"].dailyRank >= 0);
});

test("trending score combines recent installs and likes", () => {
  assert.ok(computeTrendingScore(5) > computeTrendingScore(1));
  assert.ok(computeTrendingScore(1, 5) > computeTrendingScore(1, 1));
  assert.equal(computeTrendingScore(-1), 0);
  assert.equal(computeTrendingScore(Number.NaN), 0);
});

test("manual requests default to v2-compatible minimal fields", () => {
  assert.deepEqual(
    normalizeManualRequest({
      character: "  Misaka Mikoto  ",
      franchise: "A Certain Scientific Railgun",
      referenceUrl: "https://example.com/mikoto",
      notes: "Pixel-art chibi",
      locale: "zh",
      turnstileToken: "token",
    }),
    {
      character: "Misaka Mikoto",
      franchise: "A Certain Scientific Railgun",
      referenceUrl: "https://example.com/mikoto",
      notes: "Pixel-art chibi",
      locale: "zh",
      turnstileToken: "token",
    },
  );
  assert.throws(
    () => normalizeManualRequest({ character: "x" }),
    /character or concept is required/,
  );
  assert.throws(
    () => normalizeManualRequest({ character: "Mikoto" }),
    /reference image URL is required/,
  );
  assert.throws(
    () =>
      normalizeManualRequest({
        character: "Mikoto",
        referenceUrl: "file:///tmp/reference.png",
      }),
    /public HTTP URL/,
  );
  const sanitized = normalizeManualRequest({
    character: "Pet\n<!-- pet-flow: submission -->Name",
    referenceUrl: "https://example.com/reference.png",
    notes: "### Injected heading\nKeep this preference",
  });
  assert.equal(sanitized.character, "Pet Name");
  assert.equal(sanitized.notes, "\\### Injected heading\nKeep this preference");
});

test("Turnstile validation checks success and hostname", async () => {
  const request = new Request("https://api.example/requests/manual", {
    headers: { "CF-Connecting-IP": "203.0.113.4" },
  });
  const turnstileEnv = {
    TURNSTILE_SECRET_KEY: "test-secret",
    TURNSTILE_ALLOWED_HOSTNAMES: "codexpet.top",
  };
  let verificationBody;
  await verifyTurnstile(
    request,
    turnstileEnv,
    "valid-token",
    async (_url, init) => {
      verificationBody = JSON.parse(init.body);
      return Response.json({ success: true, hostname: "codexpet.top" });
    },
  );
  assert.equal(verificationBody.secret, "test-secret");
  assert.equal(verificationBody.response, "valid-token");
  assert.equal(verificationBody.remoteip, "203.0.113.4");

  await assert.rejects(
    verifyTurnstile(request, turnstileEnv, "bad-token", async () =>
      Response.json({ success: false, hostname: "codexpet.top" }),
    ),
    /human verification failed/,
  );
});

test("reference image uploads require safe, bounded raster files", async () => {
  const png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  ]);
  const file = new File([png], "reference.png", { type: "image/png" });
  const inspected = await inspectReferenceImage(file);
  const webp = new Uint8Array(30);
  webp.set([0x52, 0x49, 0x46, 0x46], 0);
  webp.set([0x57, 0x45, 0x42, 0x50], 8);
  webp.set([0x56, 0x50, 0x38, 0x58], 12);
  const thumbnailFile = new File([webp], "reference-thumbnail.webp", {
    type: "image/webp",
  });
  const thumbnail = await inspectReferenceThumbnail(thumbnailFile, inspected);

  assert.equal(inspected.extension, "png");
  assert.equal(inspected.mimeType, "image/png");
  assert.equal(inspected.width, 1);
  assert.equal(inspected.height, 1);
  assert.match(inspected.contentHash, /^[a-f0-9]{64}$/);
  assert.equal(thumbnail.width, 1);
  assert.equal(thumbnail.height, 1);
  assert.equal(
    normalizeManualRequestSubmission({
      character: "Mikoto",
      referenceImage: file,
      locale: "zh",
    }).referenceImage,
    file,
  );
  assert.equal(
    normalizeManualRequestSubmission({
      character: "Mikoto",
      referenceImage: file,
      referenceThumbnail: thumbnailFile,
      locale: "zh",
    }).referenceThumbnail,
    thumbnailFile,
  );
  assert.equal(
    buildReferenceImageUrl(
      new Request("https://api.example/requests/manual"),
      `references/${inspected.contentHash}.png`,
    ),
    `https://api.example/uploads/reference/references/${inspected.contentHash}.png`,
  );
  assert.equal(
    buildReferenceImageUrl(
      new Request("https://api.example/requests/manual"),
      `thumbnails/${inspected.contentHash}.webp`,
    ),
    `https://api.example/uploads/reference/thumbnails/${inspected.contentHash}.webp`,
  );
  await assert.rejects(
    inspectReferenceImage(
      new File(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], "x.svg", {
        type: "image/svg+xml",
      }),
    ),
    /valid PNG, JPG, or WebP/,
  );
  assert.throws(
    () =>
      normalizeManualRequestSubmission({
        character: "Mikoto",
        referenceUrl: "https://example.com/reference.png",
        referenceImage: file,
      }),
    /either a reference image upload or URL/,
  );
});

test("reference image route is read-only and serves immutable content", async () => {
  const key = `references/${"a".repeat(64)}.png`;
  const payload = new Uint8Array([1, 2, 3]);
  const routeEnv = {
    ...env,
    REFERENCE_IMAGES: {
      get: async (requestedKey) =>
        requestedKey === key
          ? {
              body: payload,
              httpEtag: '"test-etag"',
              httpMetadata: {
                contentType: "image/png",
                cacheControl: "public, max-age=31536000, immutable",
                contentDisposition: "inline",
              },
            }
          : null,
    },
  };
  const response = await worker.fetch(
    new Request(`https://api.example/uploads/reference/${key}`, {
      headers: { Origin: "https://codexpet.top" },
    }),
    routeEnv,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("ETag"), '"test-etag"');
  assert.deepEqual(
    [...new Uint8Array(await response.arrayBuffer())],
    [1, 2, 3],
  );
});

test("manual request issue bodies preserve the simple form and V2 default", () => {
  const body = buildIssueBody({
    id: 42,
    character: "Misaka Mikoto",
    franchise: "A Certain Scientific Railgun",
    reference_url: "https://example.com/mikoto",
    notes: "Pixel-art chibi",
  });
  assert.match(body, /manual-request-id: 42/);
  assert.match(body, /### Character or concept\n\nMisaka Mikoto/);
  assert.match(body, /### Reference image\n\nhttps:\/\/example.com\/mikoto/);
  assert.match(body, /v2 - standard animations plus 16 look directions/);
  assert.match(body, /Submitted without a GitHub account/);
});
