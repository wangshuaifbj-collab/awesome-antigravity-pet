PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vote_targets (
  kind TEXT NOT NULL CHECK (kind IN ('pet', 'collection')),
  slug TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  PRIMARY KEY (kind, slug)
);

CREATE TABLE IF NOT EXISTS weekly_votes (
  week_start TEXT NOT NULL,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('pet', 'collection')),
  visitor_hash TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (week_start, target_kind, visitor_hash),
  FOREIGN KEY (target_kind, target_slug)
    REFERENCES vote_targets(kind, slug)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS weekly_votes_target_idx
  ON weekly_votes(week_start, target_kind, target_slug);

CREATE INDEX IF NOT EXISTS weekly_votes_expires_idx
  ON weekly_votes(expires_at);
