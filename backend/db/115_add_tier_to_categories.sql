-- Add tier classification to categories table
-- tier 1 = workspace-facing feature module (counts toward module stats)
-- tier 2 = workspace settings (separate sidebar section, never counted)
-- tier 3 = platform administration (isolated route, super admin only)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_categories_tier ON categories(tier);

-- Reclassify Platform Administration as tier 3
UPDATE categories SET tier = 3 WHERE key = 'platform-admin';

-- Reclassify settings-related modules as tier 2
-- (they get their own category in the data source, but existing orphan entries get flagged)
