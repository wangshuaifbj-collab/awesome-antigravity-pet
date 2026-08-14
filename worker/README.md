# awesome-codex-pet-stats Worker

Cloudflare Worker that records privacy-conscious install, like, creator-follow, and request-support actions for the Awesome Codex Pet gallery. It also accepts verified reference-image uploads for the no-account request form.

- **Production URL**: `https://api.codexpet.top`
- **Storage**: Cloudflare D1 (`DB` binding) and Cloudflare R2 (`REFERENCE_IMAGES` binding)
- **Public reads**: static `web/public/stats.json`, exported from D1 during web deployment
- **Cleanup**: daily Cron Trigger removes expired event receipts and rate-limit buckets
- **Public Worker surface**: custom domain only; `workers.dev` and preview URLs are disabled

## Endpoints

| Method   | Path                              | Purpose                                                          |
| -------- | --------------------------------- | ---------------------------------------------------------------- |
| `POST`   | `/track/install?slug=<pet-id>`    | Count a completed install; `X-Event-ID` makes retries idempotent |
| `POST`   | `/track/like?slug=<pet-id>`       | Count at most one like per source IP and pet                     |
| `POST`   | `/track/creator-follow?slug=<id>` | Follow one creator, deduplicated per source IP and creator       |
| `DELETE` | `/track/creator-follow?slug=<id>` | Unfollow one creator                                             |
| `POST`   | `/track/request-support?number=N` | Support one open GitHub-backed pet request                       |
| `DELETE` | `/track/request-support?number=N` | Remove support from one request                                  |
| `POST`   | `/requests/manual`                | Create a Turnstile-verified request from JSON or multipart form  |
| `GET`    | `/config/public`                  | Expose the Turnstile key and upload capability                   |
| `GET`    | `/uploads/reference/<key>`        | Serve one validated, immutable original or bounded thumbnail     |

The API never stores raw IP addresses or client event IDs. Metric receipts are salted and hashed before short-lived deduplication. Likes store only a salted, pet-scoped IP hash so the same IP cannot like one pet twice and cannot be correlated across different pets. Creator follows and request supports use the same approach with creator- or request-scoped hashes and may be removed from the corresponding page.

The rankings reuse pet likes rather than maintaining a second popularity action. The deployment snapshot derives 7-day likes directly from `pet_likes.created_at`; contributor and collection momentum aggregate those pet signals.

Normal page loads never invoke this Worker. Browsers read the deployment-time `/stats.json` snapshot from Cloudflare Pages as a free static asset, and pet detail views are not written to D1.

## One-time production setup

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create awesome-codex-pet-stats-db
```

Put the returned database ID in `wrangler.toml`, then configure the hashing secret and migrate the existing data before deploying:

```bash
openssl rand -hex 32 | npx wrangler secret put HASH_SALT
npm run db:migrate:remote
npm run db:sync -- --remote
npm run db:export -- --remote
npm run deploy
```

`db:sync` reads `../pets.json` and `../requests.json`, activates current pets, creators, and open requests, and never lowers existing counters. For a one-time migration from a legacy JSON endpoint, pass `--stats-url <url>` explicitly.

Reference uploads are deliberately bounded and verified at the Worker edge: Turnstile is checked before storage, each source IP may submit at most one request per rolling 24 hours, source files are limited to 5 MB, only PNG/JPEG/WebP signatures are accepted, dimensions are capped at 4096x4096 and 16 megapixels, and object keys are content hashes rather than user-controlled filenames. The standard form also sends a WebP list thumbnail capped at 400 KiB and 512px; the Worker verifies its signature, dimensions, and aspect ratio before storing it under a key derived from the original SHA-256. New request lists use this bounded object, while details retain the original. Existing managed uploads can temporarily fall back to their original until thumbnails are backfilled; third-party links use list placeholders instead of being proxied. The public image route is read-only and does not expose an R2 listing or write operation. The same rolling limit applies to link-only requests, so a client cannot bypass the quota by switching between an upload and a public URL. A repeated submission from the same source IP for the same normalized character and work within that window returns the existing request instead of creating another GitHub Issue; different IPs may request the same character independently.

`db:export` queries D1 through Wrangler and atomically writes `../web/public/stats.json`. The web deployment workflows run it once before building Pages, so statistics update when the site is deployed rather than on every page request.

Create the R2 bucket before the first Worker deployment:

```bash
npx wrangler r2 bucket create awesome-codex-pet-reference-images
```

The bucket is intentionally private; the Worker serves only validated content-hash keys. If the R2 binding is absent, the form automatically keeps the public-link fallback available and does not accept file uploads.

## Local development

```bash
npm run db:migrate:local
npm run db:sync -- --local
npm run db:export -- --local
npm run dev -- --var HASH_SALT:local-development-hash-salt
```

Run checks with:

```bash
npm test
npx wrangler deploy --dry-run
```

To test likes, creator follows, or request supports against the local Worker, set `NEXT_PUBLIC_STATS_WRITE_API=http://localhost:8787` before starting the web development server. Statistics displayed by the site still come from the static `web/public/stats.json` snapshot.

## Continuous deployment

`.github/workflows/deploy-stats.yml` runs tests, applies D1 migrations, synchronizes the catalog, and deploys the write-only Worker whenever `worker/**`, `pets.json`, or `requests.json` changes on `main`. Both web deployment workflows export the latest D1 snapshot before building Pages.

The repository must provide `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. The token needs Workers Scripts, D1, and R2 edit permissions. The `HASH_SALT` value stays attached to the Worker as an encrypted Cloudflare secret and is not stored in GitHub.

## Disabling statistics

Set `AWESOME_CODEX_PET_NO_STATS=1` before running an installer to skip the anonymous install event. Browser detail views are not recorded.
