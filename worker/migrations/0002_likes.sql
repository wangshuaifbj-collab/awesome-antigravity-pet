ALTER TABLE pet_stats
ADD COLUMN likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0);

CREATE TABLE IF NOT EXISTS pet_likes (
  slug TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor_hash),
  FOREIGN KEY (slug) REFERENCES pet_stats(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pet_likes_created_idx
  ON pet_likes(created_at DESC);

CREATE TRIGGER IF NOT EXISTS pet_likes_increment_stats
AFTER INSERT ON pet_likes
BEGIN
  UPDATE pet_stats
  SET
    likes = likes + 1,
    updated_at = NEW.created_at
  WHERE slug = NEW.slug AND active = 1;
END;
