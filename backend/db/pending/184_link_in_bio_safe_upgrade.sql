-- =====================================================
-- Link-in-Bio — Safe Enterprise Column Backfill
-- Ensures bio_link_sections table and section_id column
-- exist without requiring the full 116 enterprise migration.
-- =====================================================

-- Create bio_link_sections table if not exists
CREATE TABLE IF NOT EXISTS bio_link_sections (
  id            BIGSERIAL PRIMARY KEY,
  page_id       UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add section_id column if missing
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES bio_link_sections(id) ON DELETE SET NULL;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bio_link_sections_page ON bio_link_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_bio_links_section ON bio_links(section_id);
