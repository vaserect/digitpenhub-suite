-- =====================================================
-- URL Shortener — Safe Enterprise Column Backfill
-- Adds enterprise columns without destructive DROP TABLE.
-- Handles both 036 (original) and 112 (enterprise) schemas.
-- =====================================================

-- Add enterprise columns idempotently
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS total_clicks BIGINT DEFAULT 0;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS unique_clicks BIGINT DEFAULT 0;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS folder_id BIGINT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'standard';
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE short_links ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Migrate existing data
UPDATE short_links SET total_clicks = clicks WHERE total_clicks IS NULL AND clicks IS NOT NULL;
UPDATE short_links SET unique_clicks = clicks WHERE unique_clicks IS NULL AND clicks IS NOT NULL;
UPDATE short_links SET tags = '{}' WHERE tags IS NULL;

-- Create tracking events table
CREATE TABLE IF NOT EXISTS click_events (
  id            BIGSERIAL PRIMARY KEY,
  short_link_id BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    TEXT,
  user_agent    TEXT,
  referer       TEXT,
  country       TEXT,
  device_type   TEXT,
  browser       TEXT,
  os            TEXT
);

CREATE INDEX IF NOT EXISTS idx_click_events_link ON click_events(short_link_id, clicked_at);

-- Create folders table
CREATE TABLE IF NOT EXISTS url_folders (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_url_folders_org ON url_folders(org_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_short_link_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE short_links SET
    total_clicks = total_clicks + 1,
    unique_clicks = unique_clicks + 1,
    last_clicked_at = NEW.clicked_at
  WHERE id = NEW.short_link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_short_link_stats ON click_events;
CREATE TRIGGER trg_update_short_link_stats
  AFTER INSERT ON click_events
  FOR EACH ROW
  EXECUTE FUNCTION update_short_link_stats();

-- Drop 112's destructive DROP TABLE since we now handle it safely
-- Ensure the original 036 table + columns still work
CREATE INDEX IF NOT EXISTS idx_short_links_folder_id ON short_links(folder_id);
CREATE INDEX IF NOT EXISTS idx_short_links_status ON short_links(status);
CREATE INDEX IF NOT EXISTS idx_short_links_tags ON short_links USING GIN(tags);
