PRAGMA foreign_keys = ON;

ALTER TABLE manual_requests
  ADD COLUMN dedupe_key TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS manual_requests_dedupe_created_idx
  ON manual_requests(dedupe_key, created_at DESC);
