-- =============================================================
-- Phase 1 Foundation Fixes for Website Builder
-- 
-- Adds:
--   1. builder_template_ratings table (duplicate vote prevention)
--   2. verification_token column on builder_sites (DNS verification)
--   3. session_id column on page_views (improved analytics)
--   4. referrer and user_agent columns on page_views
--   5. published_at column on builder_sites
-- =============================================================

-- 1. Template ratings table (prevents duplicate voting)
CREATE TABLE IF NOT EXISTS builder_template_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES builder_templates(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          DECIMAL(3,2) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON builder_template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user ON builder_template_ratings(user_id);

-- 2. DNS verification token on builder_sites
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS favicon TEXT;
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}';

-- 3. Enhanced page_views for better analytics
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_org ON page_views(page_id, org_id);

-- 4. Add index for site_id on pages (improves analytics queries)
CREATE INDEX IF NOT EXISTS idx_pages_site_org ON pages(site_id, org_id);
