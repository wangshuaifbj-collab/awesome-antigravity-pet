PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS manual_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_hash TEXT NOT NULL UNIQUE,
  character TEXT NOT NULL,
  franchise TEXT NOT NULL DEFAULT '',
  reference_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'synced', 'failed')),
  issue_number INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  synced_at INTEGER
);

CREATE INDEX IF NOT EXISTS manual_requests_status_created_idx
  ON manual_requests(status, created_at ASC);

CREATE TABLE IF NOT EXISTS manual_request_rate_limits (
  rate_key TEXT PRIMARY KEY,
  bucket_start INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS manual_request_rate_limits_expires_idx
  ON manual_request_rate_limits(expires_at);

CREATE TABLE IF NOT EXISTS app_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
