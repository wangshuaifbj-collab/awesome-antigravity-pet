PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creator_stats (
  slug TEXT PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  followers INTEGER NOT NULL DEFAULT 0 CHECK (followers >= 0),
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS creator_follows (
  slug TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor_hash),
  FOREIGN KEY (slug) REFERENCES creator_stats(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS creator_follows_created_idx
  ON creator_follows(created_at DESC);

CREATE TABLE IF NOT EXISTS creator_follow_rate_limits (
  rate_key TEXT PRIMARY KEY,
  bucket_start INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS creator_follow_rate_limits_expires_idx
  ON creator_follow_rate_limits(expires_at);

CREATE TRIGGER IF NOT EXISTS creator_follows_increment_stats
AFTER INSERT ON creator_follows
BEGIN
  UPDATE creator_stats
  SET
    followers = followers + 1,
    updated_at = NEW.created_at
  WHERE slug = NEW.slug AND active = 1;
END;

CREATE TRIGGER IF NOT EXISTS creator_follows_decrement_stats
AFTER DELETE ON creator_follows
BEGIN
  UPDATE creator_stats
  SET
    followers = MAX(0, followers - 1),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE slug = OLD.slug;
END;
