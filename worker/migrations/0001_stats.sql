PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pet_stats (
  slug TEXT PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  installs INTEGER NOT NULL DEFAULT 0 CHECK (installs >= 0),
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pet_daily (
  day TEXT NOT NULL,
  slug TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  installs INTEGER NOT NULL DEFAULT 0 CHECK (installs >= 0),
  PRIMARY KEY (day, slug),
  FOREIGN KEY (slug) REFERENCES pet_stats(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pet_daily_slug_day_idx
  ON pet_daily(slug, day DESC);

CREATE TABLE IF NOT EXISTS metric_receipts (
  event_key TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('view', 'install')),
  event_day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (slug) REFERENCES pet_stats(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS metric_receipts_expires_idx
  ON metric_receipts(expires_at);

CREATE TABLE IF NOT EXISTS metric_rate_limits (
  rate_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('view', 'install')),
  bucket_start INTEGER NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS metric_rate_limits_expires_idx
  ON metric_rate_limits(expires_at);

CREATE TRIGGER IF NOT EXISTS metric_receipts_increment_stats
AFTER INSERT ON metric_receipts
BEGIN
  UPDATE pet_stats
  SET
    views = views + CASE WHEN NEW.kind = 'view' THEN 1 ELSE 0 END,
    installs = installs + CASE WHEN NEW.kind = 'install' THEN 1 ELSE 0 END,
    updated_at = NEW.created_at
  WHERE slug = NEW.slug AND active = 1;

  INSERT INTO pet_daily (day, slug, views, installs)
  VALUES (
    NEW.event_day,
    NEW.slug,
    CASE WHEN NEW.kind = 'view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.kind = 'install' THEN 1 ELSE 0 END
  )
  ON CONFLICT(day, slug) DO UPDATE SET
    views = pet_daily.views + excluded.views,
    installs = pet_daily.installs + excluded.installs;
END;
