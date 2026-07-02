-- Milestone 19: Landing Page Builder (extends existing pages table)

ALTER TABLE pages
ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'page'
  CHECK (page_type IN ('page','landing'));

CREATE INDEX pages_org_type_idx ON pages (org_id, page_type);
