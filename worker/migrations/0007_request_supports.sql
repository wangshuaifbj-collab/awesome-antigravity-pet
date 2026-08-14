PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS request_stats (
  issue_number INTEGER PRIMARY KEY CHECK (issue_number > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  supporters INTEGER NOT NULL DEFAULT 0 CHECK (supporters >= 0),
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS request_supports (
  issue_number INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (issue_number, visitor_hash),
  FOREIGN KEY (issue_number) REFERENCES request_stats(issue_number)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS request_supports_created_idx
  ON request_supports(created_at DESC);

CREATE TABLE IF NOT EXISTS request_support_rate_limits (
  rate_key TEXT PRIMARY KEY,
  bucket_start INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS request_support_rate_limits_expires_idx
  ON request_support_rate_limits(expires_at);

CREATE TRIGGER IF NOT EXISTS request_supports_increment_stats
AFTER INSERT ON request_supports
BEGIN
  UPDATE request_stats
  SET
    supporters = supporters + 1,
    updated_at = NEW.created_at
  WHERE issue_number = NEW.issue_number AND active = 1;
END;

CREATE TRIGGER IF NOT EXISTS request_supports_decrement_stats
AFTER DELETE ON request_supports
BEGIN
  UPDATE request_stats
  SET
    supporters = MAX(0, supporters - 1),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE issue_number = OLD.issue_number;
END;
