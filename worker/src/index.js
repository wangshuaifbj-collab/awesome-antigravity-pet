/**
 * Awesome Codex Pet stats Worker.
 *
 * D1 is the source of truth for explicit install, like, and creator follow
 * actions. Public reads use a static snapshot exported during deploy.
 */

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$/;
const CREATOR_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVENT_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const INSTALL_RATE_LIMIT = 30;
const CREATOR_FOLLOW_RATE_LIMIT = 60;
const REQUEST_SUPPORT_RATE_LIMIT = 60;
const MANUAL_REQUEST_RATE_LIMIT = 1;
const MANUAL_REQUEST_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MANUAL_REQUEST_BODY_LIMIT = 16_384;
const REFERENCE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const REFERENCE_THUMBNAIL_MAX_BYTES = 400 * 1024;
const MANUAL_REQUEST_FORM_LIMIT =
  REFERENCE_IMAGE_MAX_BYTES + REFERENCE_THUMBNAIL_MAX_BYTES + 64 * 1024;
const REFERENCE_IMAGE_MAX_DIMENSION = 4_096;
const REFERENCE_IMAGE_MAX_PIXELS = 16_777_216;
const REFERENCE_THUMBNAIL_MAX_DIMENSION = 512;
const REFERENCE_IMAGE_KEY_RE =
  /^(?:references\/[a-f0-9]{64}\.(?:png|jpe?g|webp)|thumbnails\/[a-f0-9]{64}\.webp)$/;
const REFERENCE_IMAGE_PATH_PREFIX = "/uploads/reference/";
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const REQUEST_LOCALES = new Set(["en", "zh", "ko", "ja", "es"]);
const RECEIPT_TTL_MS = 8 * 24 * 60 * 60 * 1000;

class HttpError extends Error {
  constructor(status, message, options) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || allowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Event-ID",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && allowedOrigins(env).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(
  data,
  request,
  env,
  status = 200,
  cacheControl = "no-store",
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      ...corsHeaders(request, env),
    },
  });
}

async function readPublicConfig(request, env) {
  const row = await env.DB.prepare(
    "SELECT config_value FROM app_config WHERE config_key = 'turnstile_site_key'",
  ).first();
  return jsonResponse(
    {
      turnstileSiteKey: String(row?.config_value || ""),
      referenceUploadEnabled: Boolean(env.REFERENCE_IMAGES),
    },
    request,
    env,
    200,
    "public, max-age=300",
  );
}

function utcDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function hourBucket(timestamp) {
  return Math.floor(timestamp / (60 * 60 * 1000));
}

function tenMinuteBucket(timestamp) {
  return Math.floor(timestamp / (10 * 60 * 1000));
}

function clientAddress(request) {
  return request.headers.get("CF-Connecting-IP") || "local";
}

async function digestHex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function sha256(value) {
  return digestHex(new TextEncoder().encode(value));
}

function readEventId(request, url) {
  const eventId =
    request.headers.get("X-Event-ID") || url.searchParams.get("event_id");
  if (!eventId) return null;
  if (!EVENT_ID_RE.test(eventId)) {
    throw new HttpError(400, "invalid event id");
  }
  return eventId;
}

export async function buildInstallKeys(request, env, slug, timestamp) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }

  const url = new URL(request.url);
  const eventId = readEventId(request, url);
  const address = clientAddress(request);
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const clientIdentity = `${address}|${userAgent}`;
  const day = utcDay(timestamp);
  const eventIdentity = eventId
    ? `install:${eventId}`
    : `legacy:${clientIdentity}:${tenMinuteBucket(timestamp)}`;

  return {
    eventKey: await sha256(
      `${env.HASH_SALT}|event|install|${slug}|${eventIdentity}`,
    ),
    rateKey: await sha256(
      `${env.HASH_SALT}|rate|install|${address}|${hourBucket(timestamp)}`,
    ),
    day,
    rateBucket: hourBucket(timestamp),
  };
}

export async function buildLikeKey(request, env, slug) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  return sha256(`${env.HASH_SALT}|like|${slug}|${clientAddress(request)}`);
}

export async function buildCreatorFollowKey(request, env, slug) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  return sha256(
    `${env.HASH_SALT}|creator-follow|${slug}|${clientAddress(request)}`,
  );
}

export async function buildCreatorFollowRateKey(request, env, timestamp) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  const bucket = hourBucket(timestamp);
  return {
    key: await sha256(
      `${env.HASH_SALT}|rate|creator-follow|${clientAddress(request)}|${bucket}`,
    ),
    bucket,
  };
}

export async function buildRequestSupportKey(request, env, issueNumber) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  return sha256(
    `${env.HASH_SALT}|request-support|${issueNumber}|${clientAddress(request)}`,
  );
}

export async function buildRequestSupportRateKey(request, env, timestamp) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  const bucket = hourBucket(timestamp);
  return {
    key: await sha256(
      `${env.HASH_SALT}|rate|request-support|${clientAddress(request)}|${bucket}`,
    ),
    bucket,
  };
}

export async function buildManualRequestRateKey(request, env) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  return sha256(
    `${env.HASH_SALT}|rate|manual-request|${clientAddress(request)}`,
  );
}

function canonicalManualRequestText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();
}

export async function buildManualRequestDedupeKey(
  request,
  env,
  character,
  franchise,
) {
  if (!env.HASH_SALT || env.HASH_SALT.length < 16) {
    throw new HttpError(500, "metric hashing is not configured");
  }
  return sha256(
    JSON.stringify([
      env.HASH_SALT,
      "manual-request-dedupe",
      clientAddress(request),
      canonicalManualRequestText(character),
      canonicalManualRequestText(franchise),
    ]),
  );
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanSingleLine(value, maxLength) {
  return cleanText(value, maxLength).replace(/\s+/g, " ");
}

function cleanIssueText(value, maxLength) {
  return cleanText(value, maxLength).replace(/^\s*#/gm, "\\#");
}

function isFileLike(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    Number.isFinite(Number(value.size)),
  );
}

function asciiAt(bytes, offset, value) {
  if (offset + value.length > bytes.length) return false;
  return [...value].every(
    (character, index) => character.charCodeAt(0) === bytes[offset + index],
  );
}

function uint24LittleEndian(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readPngDimensions(bytes) {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readJpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame && segmentLength >= 7) {
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += segmentLength;
  }
  return null;
}

function readWebpDimensions(bytes) {
  if (
    bytes.length < 20 ||
    !asciiAt(bytes, 0, "RIFF") ||
    !asciiAt(bytes, 8, "WEBP")
  ) {
    return null;
  }
  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === "VP8X" && bytes.length >= 30) {
    return {
      width: uint24LittleEndian(bytes, 24) + 1,
      height: uint24LittleEndian(bytes, 27) + 1,
    };
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits =
      bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >>> 14) & 0x3fff),
    };
  }
  if (
    chunk === "VP8 " &&
    bytes.length >= 30 &&
    asciiAt(bytes, 23, "\x9d\x01\x2a")
  ) {
    return {
      width: bytes[26] | (bytes[27] << 8),
      height: bytes[28] | (bytes[29] << 8),
    };
  }
  return null;
}

function detectReferenceImage(bytes) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      extension: "png",
      mimeType: "image/png",
      dimensions: readPngDimensions(bytes),
    };
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return {
      extension: "jpg",
      mimeType: "image/jpeg",
      dimensions: readJpegDimensions(bytes),
    };
  }
  if (
    bytes.length >= 12 &&
    asciiAt(bytes, 0, "RIFF") &&
    asciiAt(bytes, 8, "WEBP")
  ) {
    return {
      extension: "webp",
      mimeType: "image/webp",
      dimensions: readWebpDimensions(bytes),
    };
  }
  return null;
}

export async function inspectReferenceImage(file) {
  if (!isFileLike(file)) {
    throw new HttpError(400, "reference image upload is required");
  }
  const fileSize = Number(file.size);
  if (!Number.isInteger(fileSize) || fileSize <= 0) {
    throw new HttpError(400, "reference image upload is empty");
  }
  if (fileSize > REFERENCE_IMAGE_MAX_BYTES) {
    throw new HttpError(413, "reference image is too large; maximum is 5 MB");
  }

  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new HttpError(400, "reference image could not be read");
  }
  if (bytes.length !== fileSize) {
    throw new HttpError(400, "reference image could not be read");
  }
  const detected = detectReferenceImage(bytes);
  if (!detected || !detected.dimensions) {
    throw new HttpError(
      400,
      "reference image must be a valid PNG, JPG, or WebP",
    );
  }
  const suppliedType = String(file.type || "").toLowerCase();
  if (
    suppliedType &&
    suppliedType !== "application/octet-stream" &&
    suppliedType !== detected.mimeType
  ) {
    throw new HttpError(
      400,
      "reference image type does not match its contents",
    );
  }
  const { width, height } = detected.dimensions;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > REFERENCE_IMAGE_MAX_DIMENSION ||
    height > REFERENCE_IMAGE_MAX_DIMENSION ||
    width * height > REFERENCE_IMAGE_MAX_PIXELS
  ) {
    throw new HttpError(400, "reference image dimensions are not supported");
  }
  return {
    bytes,
    extension: detected.extension,
    mimeType: detected.mimeType,
    width,
    height,
    contentHash: await digestHex(bytes),
  };
}

export async function inspectReferenceThumbnail(file, referenceImage) {
  if (!isFileLike(file)) {
    throw new HttpError(400, "reference thumbnail is required");
  }
  if (Number(file.size) > REFERENCE_THUMBNAIL_MAX_BYTES) {
    throw new HttpError(413, "reference thumbnail is too large");
  }
  const inspected = await inspectReferenceImage(file);
  if (
    inspected.mimeType !== "image/webp" ||
    inspected.width > REFERENCE_THUMBNAIL_MAX_DIMENSION ||
    inspected.height > REFERENCE_THUMBNAIL_MAX_DIMENSION
  ) {
    throw new HttpError(400, "reference thumbnail must be a WebP up to 512px");
  }
  const referenceRatio = referenceImage.width / referenceImage.height;
  const thumbnailRatio = inspected.width / inspected.height;
  if (Math.abs(referenceRatio - thumbnailRatio) > 0.03) {
    throw new HttpError(400, "reference thumbnail aspect ratio does not match");
  }
  return inspected;
}

export function buildReferenceImageUrl(request, key) {
  if (!REFERENCE_IMAGE_KEY_RE.test(key)) {
    throw new HttpError(400, "invalid reference image key");
  }
  const url = new URL(request.url);
  url.pathname = `${REFERENCE_IMAGE_PATH_PREFIX}${key}`;
  url.search = "";
  url.hash = "";
  return url.href;
}

function publicUrl(value, { required = false } = {}) {
  const normalized = cleanText(value, 500);
  if (!normalized) {
    if (required) throw new HttpError(400, "reference image URL is required");
    return "";
  }
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new HttpError(400, "reference URL must be a public HTTP URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new HttpError(400, "reference URL must be a public HTTP URL");
  }
  return url.href;
}

function normalizeManualRequestFields(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "invalid request body");
  }
  if (cleanText(payload.website, 200)) {
    throw new HttpError(400, "invalid request body");
  }
  const character = cleanSingleLine(payload.character, 100);
  if (character.length < 2) {
    throw new HttpError(400, "character or concept is required");
  }
  const locale = REQUEST_LOCALES.has(payload.locale) ? payload.locale : "en";
  return {
    character,
    franchise: cleanSingleLine(payload.franchise, 120),
    notes: cleanIssueText(payload.notes, 1_000),
    locale,
    turnstileToken: cleanText(payload.turnstileToken, 2_048),
  };
}

export function normalizeManualRequest(payload) {
  return {
    ...normalizeManualRequestFields(payload),
    referenceUrl: publicUrl(payload.referenceUrl, { required: true }),
  };
}

export function normalizeManualRequestSubmission(payload) {
  const normalized = normalizeManualRequestFields(payload);
  const referenceUrl = publicUrl(payload.referenceUrl);
  const referenceImage = isFileLike(payload.referenceImage)
    ? payload.referenceImage
    : null;
  const referenceThumbnail = isFileLike(payload.referenceThumbnail)
    ? payload.referenceThumbnail
    : null;
  if (!referenceUrl && !referenceImage) {
    throw new HttpError(400, "reference image upload or URL is required");
  }
  if (referenceUrl && referenceImage) {
    throw new HttpError(400, "choose either a reference image upload or URL");
  }
  if (referenceUrl && referenceThumbnail) {
    throw new HttpError(
      400,
      "reference thumbnail is only valid with an upload",
    );
  }
  if (referenceThumbnail && !referenceImage) {
    throw new HttpError(400, "reference thumbnail requires an image upload");
  }
  return { ...normalized, referenceUrl, referenceImage, referenceThumbnail };
}

function turnstileHostnames(env) {
  return new Set(
    (env.TURNSTILE_ALLOWED_HOSTNAMES || "codexpet.top,www.codexpet.top")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function verifyTurnstile(request, env, token, fetcher = fetch) {
  if (!env.TURNSTILE_SECRET_KEY) {
    throw new HttpError(500, "request verification is not configured");
  }
  if (!token) throw new HttpError(400, "complete the human verification");
  const response = await fetcher(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: clientAddress(request),
      idempotency_key: crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new HttpError(502, "verification service unavailable");
  const result = await response.json();
  const hostname = String(result.hostname || "").toLowerCase();
  if (!result.success || !turnstileHostnames(env).has(hostname)) {
    throw new HttpError(400, "human verification failed; please try again");
  }
}

async function enforceManualRequestRateLimit(request, env, timestamp) {
  const rateKey = await buildManualRequestRateKey(request, env);
  const result = await env.DB.prepare(
    `INSERT INTO manual_request_rate_limits
       (rate_key, bucket_start, event_count, expires_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(rate_key) DO UPDATE SET
       bucket_start = CASE
         WHEN manual_request_rate_limits.expires_at <= ? THEN excluded.bucket_start
         ELSE manual_request_rate_limits.bucket_start
       END,
       event_count = CASE
         WHEN manual_request_rate_limits.expires_at <= ? THEN excluded.event_count
         ELSE manual_request_rate_limits.event_count + excluded.event_count
       END,
       expires_at = CASE
         WHEN manual_request_rate_limits.expires_at <= ? THEN excluded.expires_at
         ELSE manual_request_rate_limits.expires_at
       END
     RETURNING event_count`,
  )
    .bind(
      rateKey,
      timestamp,
      timestamp + MANUAL_REQUEST_RATE_WINDOW_MS,
      timestamp,
      timestamp,
      timestamp,
    )
    .first();
  if ((Number(result?.event_count) || 0) > MANUAL_REQUEST_RATE_LIMIT) {
    throw new HttpError(
      429,
      "one request per IP is allowed every 24 hours; please try again later",
    );
  }
}

async function findRecentManualRequest(env, dedupeKey, timestamp) {
  return env.DB.prepare(
    `SELECT id, status, issue_number
     FROM manual_requests
     WHERE dedupe_key = ? AND created_at >= ?
     ORDER BY created_at DESC
     LIMIT 1`,
  )
    .bind(dedupeKey, timestamp - MANUAL_REQUEST_RATE_WINDOW_MS)
    .first();
}

async function readJsonBody(request) {
  const bytes = await readBodyBytes(request, MANUAL_REQUEST_BODY_LIMIT);
  const rawBody = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "invalid request body");
  }
}

function assertContentLength(request, limit) {
  const header = request.headers.get("Content-Length");
  if (!header) return;
  const contentLength = Number(header);
  if (!Number.isInteger(contentLength) || contentLength < 0) {
    throw new HttpError(400, "invalid request body");
  }
  if (contentLength > limit) {
    throw new HttpError(413, "request body is too large");
  }
}

async function readBodyBytes(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength > limit)
      throw new HttpError(413, "request body is too large");
    return bytes;
  }
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        try {
          await reader.cancel();
        } catch {
          // The request is already being rejected; cancellation failure is not actionable.
        }
        throw new HttpError(413, "request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function formString(form, name) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

async function readManualRequestBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^multipart\/form-data\b/i.test(contentType)) {
    return readJsonBody(request);
  }
  assertContentLength(request, MANUAL_REQUEST_FORM_LIMIT);
  const bytes = await readBodyBytes(request, MANUAL_REQUEST_FORM_LIMIT);
  let form;
  try {
    form = await new Response(bytes, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new HttpError(400, "invalid multipart request");
  }
  return {
    character: formString(form, "character"),
    franchise: formString(form, "franchise"),
    referenceUrl: formString(form, "referenceUrl"),
    referenceImage: form.get("referenceImage"),
    referenceThumbnail: form.get("referenceThumbnail"),
    notes: formString(form, "notes"),
    website: formString(form, "website"),
    locale: formString(form, "locale"),
    turnstileToken: formString(form, "turnstileToken"),
  };
}

async function storeReferenceImage(request, env, file, thumbnailFile) {
  if (!env.REFERENCE_IMAGES) {
    throw new HttpError(503, "reference image uploads are not configured");
  }
  const inspected = await inspectReferenceImage(file);
  const thumbnail = thumbnailFile
    ? await inspectReferenceThumbnail(thumbnailFile, inspected)
    : null;
  const key = `references/${inspected.contentHash}.${inspected.extension}`;
  const existing = await env.REFERENCE_IMAGES.head(key);
  let created = false;
  if (!existing) {
    await env.REFERENCE_IMAGES.put(key, inspected.bytes, {
      httpMetadata: {
        contentType: inspected.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
        contentDisposition: "inline",
      },
      customMetadata: {
        width: String(inspected.width),
        height: String(inspected.height),
      },
    });
    created = true;
  }
  const storedObjects = [{ key, created }];
  try {
    if (thumbnail) {
      const thumbnailKey = `thumbnails/${inspected.contentHash}.webp`;
      const existingThumbnail = await env.REFERENCE_IMAGES.head(thumbnailKey);
      let thumbnailCreated = false;
      if (!existingThumbnail) {
        await env.REFERENCE_IMAGES.put(thumbnailKey, thumbnail.bytes, {
          httpMetadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable",
            contentDisposition: "inline",
          },
          customMetadata: {
            width: String(thumbnail.width),
            height: String(thumbnail.height),
            source: inspected.contentHash,
          },
        });
        thumbnailCreated = true;
      }
      storedObjects.push({ key: thumbnailKey, created: thumbnailCreated });
    }
  } catch (error) {
    for (const object of storedObjects) {
      if (object.created) await env.REFERENCE_IMAGES.delete(object.key);
    }
    throw error;
  }
  return {
    storedObjects,
    url: buildReferenceImageUrl(request, key),
  };
}

async function serveReferenceImage(request, env, key) {
  if (!env.REFERENCE_IMAGES || !REFERENCE_IMAGE_KEY_RE.test(key)) {
    throw new HttpError(404, "reference image not found");
  }
  const object = await env.REFERENCE_IMAGES.get(key);
  if (!object) throw new HttpError(404, "reference image not found");
  const headers = new Headers(corsHeaders(request, env));
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType || "application/octet-stream",
  );
  headers.set(
    "Cache-Control",
    object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
  );
  headers.set(
    "Content-Disposition",
    object.httpMetadata?.contentDisposition || "inline",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { status: 200, headers });
}

async function submitManualRequest(request, env) {
  if (!isOriginAllowed(request, env)) {
    throw new HttpError(403, "origin not allowed");
  }
  const payload = await readManualRequestBody(request);
  const input = normalizeManualRequestSubmission(payload);
  await verifyTurnstile(request, env, input.turnstileToken);
  const timestamp = Date.now();
  const dedupeKey = await buildManualRequestDedupeKey(
    request,
    env,
    input.character,
    input.franchise,
  );
  const existing = await findRecentManualRequest(env, dedupeKey, timestamp);
  if (existing) {
    return jsonResponse(
      {
        id: Number(existing.id),
        status: existing.status,
        issueNumber: existing.issue_number
          ? Number(existing.issue_number)
          : null,
        version: "v2",
        duplicate: true,
      },
      request,
      env,
      202,
    );
  }
  await enforceManualRequestRateLimit(request, env, timestamp);
  let referenceUrl = input.referenceUrl;
  let storedImage = null;
  if (input.referenceImage) {
    storedImage = await storeReferenceImage(
      request,
      env,
      input.referenceImage,
      input.referenceThumbnail,
    );
    referenceUrl = storedImage.url;
  }
  const requestHash = await sha256(
    `${env.HASH_SALT}|manual-request|${clientAddress(request)}|${input.character}|${input.franchise}|${referenceUrl}|${input.notes}`,
  );
  let result;
  try {
    result = await env.DB.prepare(
      `INSERT INTO manual_requests
         (request_hash, dedupe_key, character, franchise, reference_url, notes, locale, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(request_hash) DO UPDATE SET request_hash = excluded.request_hash
       RETURNING id, status, issue_number`,
    )
      .bind(
        requestHash,
        dedupeKey,
        input.character,
        input.franchise,
        referenceUrl,
        input.notes,
        input.locale,
        timestamp,
      )
      .first();
  } catch (error) {
    for (const object of storedImage?.storedObjects ?? []) {
      if (object.created) await env.REFERENCE_IMAGES.delete(object.key);
    }
    throw error;
  }
  return jsonResponse(
    {
      id: Number(result.id),
      status: result.status,
      issueNumber: result.issue_number ? Number(result.issue_number) : null,
      version: "v2",
    },
    request,
    env,
    202,
  );
}

export function computeTrendingScore(installs7d, likes7d = 0) {
  const installs = Math.max(0, Number(installs7d) || 0);
  const likes = Math.max(0, Number(likes7d) || 0);
  if (installs === 0 && likes === 0) return 0;
  return Math.round(
    (Math.log1p(installs) * 0.7 + Math.log1p(likes) * 0.3) * 1_000_000,
  );
}

function stableDailyRank(slug, day) {
  let hash = 2166136261;
  const input = `${day}:${slug}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function serializeStatsRows(
  rows,
  timestamp = Date.now(),
  creatorRows = [],
  requestRows = [],
) {
  const day = utcDay(timestamp);
  const pets = {};

  for (const row of rows) {
    const installs7d = Number(row.installs_7d) || 0;
    const likes7d = Number(row.likes_7d) || 0;
    pets[row.slug] = {
      installs: Number(row.installs) || 0,
      likes: Number(row.likes) || 0,
      installs7d,
      likes7d,
      trendingScore: computeTrendingScore(installs7d, likes7d),
      dailyRank: stableDailyRank(row.slug, day),
      updatedAt: Number(row.updated_at) || 0,
    };
  }
  const creators = Object.fromEntries(
    creatorRows.map((row) => [
      row.slug,
      { followers: Number(row.followers) || 0 },
    ]),
  );
  const requests = Object.fromEntries(
    requestRows.map((row) => [
      String(row.issue_number),
      {
        supporters: Number(row.supporters) || 0,
        updatedAt: Number(row.updated_at) || 0,
      },
    ]),
  );

  return {
    pets,
    creators,
    requests,
    generatedAt: timestamp,
    windowDays: 7,
  };
}

async function readPetStats(env, slug) {
  return env.DB.prepare(
    `SELECT slug, views, installs, likes, updated_at
     FROM pet_stats
     WHERE slug = ? AND active = 1`,
  )
    .bind(slug)
    .first();
}

async function trackInstall(request, env, slug) {
  if (!SLUG_RE.test(slug)) {
    throw new HttpError(400, "invalid slug");
  }
  if (!isOriginAllowed(request, env)) {
    throw new HttpError(403, "origin not allowed");
  }

  const existing = await readPetStats(env, slug);
  if (!existing) {
    throw new HttpError(404, "pet not found");
  }

  const timestamp = Date.now();
  const keys = await buildInstallKeys(request, env, slug, timestamp);
  const rate = await env.DB.prepare(
    `INSERT INTO metric_rate_limits
       (rate_key, kind, bucket_start, event_count, expires_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(rate_key) DO UPDATE SET
       event_count = metric_rate_limits.event_count + 1,
       expires_at = excluded.expires_at
     RETURNING event_count`,
  )
    .bind(
      keys.rateKey,
      "install",
      keys.rateBucket,
      timestamp + 2 * 60 * 60 * 1000,
    )
    .first();

  if ((Number(rate?.event_count) || 0) > INSTALL_RATE_LIMIT) {
    throw new HttpError(429, "rate limit exceeded");
  }

  const receipt = await env.DB.prepare(
    `INSERT OR IGNORE INTO metric_receipts
       (event_key, slug, kind, event_day, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      keys.eventKey,
      slug,
      "install",
      keys.day,
      timestamp,
      timestamp + RECEIPT_TTL_MS,
    )
    .run();

  const counted = (Number(receipt.meta?.changes) || 0) > 0;
  const current = await readPetStats(env, slug);
  return jsonResponse(
    {
      slug,
      installs: Number(current?.installs) || 0,
      updatedAt: Number(current?.updated_at) || 0,
      counted,
    },
    request,
    env,
  );
}

async function trackLike(request, env, slug) {
  if (!SLUG_RE.test(slug)) {
    throw new HttpError(400, "invalid slug");
  }
  if (!isOriginAllowed(request, env)) {
    throw new HttpError(403, "origin not allowed");
  }

  const existing = await readPetStats(env, slug);
  if (!existing) {
    throw new HttpError(404, "pet not found");
  }

  const timestamp = Date.now();
  const visitorHash = await buildLikeKey(request, env, slug);
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO pet_likes (slug, visitor_hash, created_at)
     VALUES (?, ?, ?)`,
  )
    .bind(slug, visitorHash, timestamp)
    .run();
  const counted = (Number(result.meta?.changes) || 0) > 0;
  const current = await readPetStats(env, slug);

  return jsonResponse(
    {
      slug,
      likes: Number(current?.likes) || 0,
      liked: true,
      counted,
    },
    request,
    env,
  );
}

async function readCreatorStats(env, slug) {
  return env.DB.prepare(
    `SELECT slug, followers, updated_at
     FROM creator_stats
     WHERE slug = ? AND active = 1`,
  )
    .bind(slug)
    .first();
}

async function trackCreatorFollow(request, env, slug, following) {
  if (!CREATOR_SLUG_RE.test(slug)) {
    throw new HttpError(400, "invalid creator slug");
  }
  if (!isOriginAllowed(request, env)) {
    throw new HttpError(403, "origin not allowed");
  }

  const existing = await readCreatorStats(env, slug);
  if (!existing) {
    throw new HttpError(404, "creator not found");
  }

  const timestamp = Date.now();
  const rate = await buildCreatorFollowRateKey(request, env, timestamp);
  const rateResult = await env.DB.prepare(
    `INSERT INTO creator_follow_rate_limits
       (rate_key, bucket_start, event_count, expires_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(rate_key) DO UPDATE SET
       event_count = creator_follow_rate_limits.event_count + 1,
       expires_at = excluded.expires_at
     RETURNING event_count`,
  )
    .bind(rate.key, rate.bucket, timestamp + 2 * 60 * 60 * 1000)
    .first();
  if ((Number(rateResult?.event_count) || 0) > CREATOR_FOLLOW_RATE_LIMIT) {
    throw new HttpError(429, "rate limit exceeded");
  }

  const visitorHash = await buildCreatorFollowKey(request, env, slug);
  const result = following
    ? await env.DB.prepare(
        `INSERT OR IGNORE INTO creator_follows
           (slug, visitor_hash, created_at)
         VALUES (?, ?, ?)`,
      )
        .bind(slug, visitorHash, timestamp)
        .run()
    : await env.DB.prepare(
        `DELETE FROM creator_follows
         WHERE slug = ? AND visitor_hash = ?`,
      )
        .bind(slug, visitorHash)
        .run();
  const changed = (Number(result.meta?.changes) || 0) > 0;
  const current = await readCreatorStats(env, slug);

  return jsonResponse(
    {
      slug,
      followers: Number(current?.followers) || 0,
      following,
      changed,
    },
    request,
    env,
  );
}

function parseIssueNumber(value) {
  const issueNumber = Number(value);
  return Number.isSafeInteger(issueNumber) && issueNumber > 0
    ? issueNumber
    : null;
}

async function readRequestStats(env, issueNumber) {
  return env.DB.prepare(
    `SELECT issue_number, supporters, updated_at
     FROM request_stats
     WHERE issue_number = ? AND active = 1`,
  )
    .bind(issueNumber)
    .first();
}

async function trackRequestSupport(request, env, rawIssueNumber, supporting) {
  const issueNumber = parseIssueNumber(rawIssueNumber);
  if (!issueNumber) {
    throw new HttpError(400, "invalid request number");
  }
  if (!isOriginAllowed(request, env)) {
    throw new HttpError(403, "origin not allowed");
  }

  const existing = await readRequestStats(env, issueNumber);
  if (!existing) {
    throw new HttpError(404, "request not found");
  }

  const timestamp = Date.now();
  const rate = await buildRequestSupportRateKey(request, env, timestamp);
  const rateResult = await env.DB.prepare(
    `INSERT INTO request_support_rate_limits
       (rate_key, bucket_start, event_count, expires_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(rate_key) DO UPDATE SET
       event_count = request_support_rate_limits.event_count + 1,
       expires_at = excluded.expires_at
     RETURNING event_count`,
  )
    .bind(rate.key, rate.bucket, timestamp + 2 * 60 * 60 * 1000)
    .first();
  if ((Number(rateResult?.event_count) || 0) > REQUEST_SUPPORT_RATE_LIMIT) {
    throw new HttpError(429, "rate limit exceeded");
  }

  const visitorHash = await buildRequestSupportKey(request, env, issueNumber);
  const result = supporting
    ? await env.DB.prepare(
        `INSERT OR IGNORE INTO request_supports
           (issue_number, visitor_hash, created_at)
         VALUES (?, ?, ?)`,
      )
        .bind(issueNumber, visitorHash, timestamp)
        .run()
    : await env.DB.prepare(
        `DELETE FROM request_supports
         WHERE issue_number = ? AND visitor_hash = ?`,
      )
        .bind(issueNumber, visitorHash)
        .run();
  const changed = (Number(result.meta?.changes) || 0) > 0;
  const current = await readRequestStats(env, issueNumber);

  return jsonResponse(
    {
      number: issueNumber,
      supporters: Number(current?.supporters) || 0,
      supporting,
      changed,
    },
    request,
    env,
  );
}

async function routeRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    if (!isOriginAllowed(request, env)) {
      return jsonResponse({ error: "origin not allowed" }, request, env, 403);
    }
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, env),
    });
  }

  const referenceImageMatch = url.pathname.match(
    /^\/uploads\/reference\/((?:references\/[a-f0-9]{64}\.(?:png|jpe?g|webp)|thumbnails\/[a-f0-9]{64}\.webp))$/,
  );
  if (referenceImageMatch && request.method === "GET") {
    return serveReferenceImage(request, env, referenceImageMatch[1]);
  }
  if (url.pathname.startsWith(REFERENCE_IMAGE_PATH_PREFIX)) {
    throw new HttpError(404, "reference image not found");
  }

  if (!env.DB) {
    throw new HttpError(500, "D1 binding is not configured");
  }

  if (url.pathname === "/requests/manual" && request.method === "POST") {
    return submitManualRequest(request, env);
  }

  if (url.pathname === "/config/public" && request.method === "GET") {
    return readPublicConfig(request, env);
  }

  if (url.pathname === "/track/install" && request.method === "POST") {
    return trackInstall(request, env, url.searchParams.get("slug") || "");
  }

  if (url.pathname === "/track/like" && request.method === "POST") {
    return trackLike(request, env, url.searchParams.get("slug") || "");
  }

  if (
    url.pathname === "/track/creator-follow" &&
    (request.method === "POST" || request.method === "DELETE")
  ) {
    return trackCreatorFollow(
      request,
      env,
      url.searchParams.get("slug") || "",
      request.method === "POST",
    );
  }

  if (
    url.pathname === "/track/request-support" &&
    (request.method === "POST" || request.method === "DELETE")
  ) {
    return trackRequestSupport(
      request,
      env,
      url.searchParams.get("number") || "",
      request.method === "POST",
    );
  }

  throw new HttpError(404, "not found");
}

async function cleanupMetrics(env) {
  const timestamp = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM metric_receipts WHERE expires_at < ?").bind(
      timestamp,
    ),
    env.DB.prepare("DELETE FROM metric_rate_limits WHERE expires_at < ?").bind(
      timestamp,
    ),
    env.DB.prepare(
      "DELETE FROM creator_follow_rate_limits WHERE expires_at < ?",
    ).bind(timestamp),
    env.DB.prepare(
      "DELETE FROM request_support_rate_limits WHERE expires_at < ?",
    ).bind(timestamp),
    env.DB.prepare(
      "DELETE FROM manual_request_rate_limits WHERE expires_at < ?",
    ).bind(timestamp),
  ]);
}

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status >= 500) {
        const stack = error instanceof Error ? error.stack : String(error);
        console.error("Stats Worker request failed", stack);
      }
      const message =
        error instanceof HttpError ? error.message : "internal server error";
      return jsonResponse({ error: message }, request, env, status);
    }
  },

  async scheduled(_controller, env) {
    try {
      await cleanupMetrics(env);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      console.error("Stats Worker cleanup failed", stack);
      throw error;
    }
  },
};
