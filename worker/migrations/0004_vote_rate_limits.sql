CREATE TABLE IF NOT EXISTS vote_rate_limits (
  rate_key TEXT PRIMARY KEY,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('pet', 'collection')),
  bucket_start INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS vote_rate_limits_expires_idx
  ON vote_rate_limits(expires_at);
