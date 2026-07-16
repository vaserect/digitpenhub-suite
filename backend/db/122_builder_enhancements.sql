-- Website Builder: Enhanced Pages and Funnel System
-- Extends existing pages and funnels tables with new capabilities

-- Add new columns to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES builder_themes(id) ON DELETE SET NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS parent_page_id UUID REFERENCES pages(id) ON DELETE SET NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS site_id UUID; -- Groups pages into websites
ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'page' CHECK (page_type IN ('page','landing','blog','portfolio','product','service','team','contact','about','pricing','faq','404','thankyou','coming-soon'));
ALTER TABLE pages ADD COLUMN IF NOT EXISTS responsive_settings JSONB DEFAULT '{}';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS performance_settings JSONB DEFAULT '{}';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_js TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS template_source_id UUID REFERENCES builder_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pages_theme_idx ON pages (theme_id);
CREATE INDEX IF NOT EXISTS pages_parent_idx ON pages (parent_page_id);
CREATE INDEX IF NOT EXISTS pages_site_idx ON pages (site_id);
CREATE INDEX IF NOT EXISTS pages_template_source_idx ON pages (template_source_id);

-- Sites table (groups pages into complete websites)
CREATE TABLE IF NOT EXISTS builder_sites (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  
  -- Domain settings
  primary_domain  TEXT,
  custom_domains  TEXT[]      DEFAULT '{}',
  
  -- Theme
  theme_id        UUID        REFERENCES builder_themes(id) ON DELETE SET NULL,
  
  -- Navigation structure
  navigation      JSONB       DEFAULT '[]',
  
  -- Global settings
  global_settings JSONB       DEFAULT '{}',
  
  -- SEO
  site_title      TEXT,
  site_description TEXT,
  favicon_url     TEXT,
  
  -- Analytics
  analytics_config JSONB      DEFAULT '{}',
  
  -- Status
  status          TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_sites_org_idx ON builder_sites (org_id);
CREATE INDEX builder_sites_status_idx ON builder_sites (status);

-- Global blocks (reusable across pages)
CREATE TABLE IF NOT EXISTS builder_global_blocks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL DEFAULT 'general', -- header, footer, cta, form, etc.
  
  -- Block structure
  blocks          JSONB       NOT NULL DEFAULT '[]',
  
  -- Usage tracking
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  
  -- Preview
  thumbnail_url   TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_global_blocks_org_idx ON builder_global_blocks (org_id);
CREATE INDEX builder_global_blocks_category_idx ON builder_global_blocks (category);

-- Page revisions (version history)
CREATE TABLE IF NOT EXISTS builder_page_revisions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Snapshot
  title           TEXT        NOT NULL,
  blocks          JSONB       NOT NULL,
  meta_data       JSONB       DEFAULT '{}',
  
  -- Version info
  version_number  INTEGER     NOT NULL,
  change_summary  TEXT,
  is_autosave     BOOLEAN     NOT NULL DEFAULT false,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_page_revisions_page_idx ON builder_page_revisions (page_id, created_at DESC);
CREATE INDEX builder_page_revisions_user_idx ON builder_page_revisions (user_id);

-- Asset library
CREATE TABLE IF NOT EXISTS builder_assets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  
  -- Asset details
  asset_type      TEXT        NOT NULL CHECK (asset_type IN ('image','video','audio','document','icon','illustration')),
  file_url        TEXT        NOT NULL,
  thumbnail_url   TEXT,
  file_size       BIGINT,
  mime_type       TEXT,
  width           INTEGER,
  height          INTEGER,
  
  -- Source
  source          TEXT        DEFAULT 'upload', -- upload, pexels, unsplash, etc.
  source_id       TEXT,
  source_url      TEXT,
  
  -- Organization
  folder_path     TEXT        DEFAULT '/',
  tags            TEXT[]      DEFAULT '{}',
  
  -- Usage tracking
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  
  -- Metadata
  alt_text        TEXT,
  caption         TEXT,
  metadata        JSONB       DEFAULT '{}',
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_assets_org_idx ON builder_assets (org_id);
CREATE INDEX builder_assets_type_idx ON builder_assets (asset_type);
CREATE INDEX builder_assets_folder_idx ON builder_assets (org_id, folder_path);
CREATE INDEX builder_assets_tags_idx ON builder_assets USING gin(tags);

-- Enhanced funnels
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS funnel_type TEXT DEFAULT 'lead-generation' CHECK (funnel_type IN ('lead-generation','sales','webinar','course','appointment','application','survey','membership'));
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS split_testing JSONB DEFAULT '{}';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS conversion_tracking JSONB DEFAULT '{}';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS automation_rules JSONB DEFAULT '[]';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS analytics_config JSONB DEFAULT '{}';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES builder_themes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS funnels_type_idx ON funnels (funnel_type);
CREATE INDEX IF NOT EXISTS funnels_theme_idx ON funnels (theme_id);

-- Funnel step enhancements
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS step_name TEXT;
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS step_config JSONB DEFAULT '{}';
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;

-- Funnel analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id       UUID        NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step_id         UUID        REFERENCES funnel_steps(id) ON DELETE CASCADE,
  
  -- Visitor tracking
  visitor_hash    TEXT        NOT NULL,
  session_id      TEXT,
  
  -- Event data
  event_type      TEXT        NOT NULL, -- view, conversion, exit, etc.
  event_data      JSONB       DEFAULT '{}',
  
  -- Attribution
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  referrer        TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX funnel_analytics_funnel_idx ON funnel_analytics (funnel_id, created_at DESC);
CREATE INDEX funnel_analytics_step_idx ON funnel_analytics (step_id, created_at DESC);
CREATE INDEX funnel_analytics_visitor_idx ON funnel_analytics (visitor_hash);
CREATE INDEX funnel_analytics_event_idx ON funnel_analytics (event_type);

-- Form submissions (enhanced for builder forms)
CREATE TABLE IF NOT EXISTS builder_form_submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id         UUID        REFERENCES pages(id) ON DELETE SET NULL,
  form_block_id   TEXT,
  
  -- Submission data
  form_data       JSONB       NOT NULL,
  
  -- Visitor info
  visitor_hash    TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  
  -- Attribution
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  referrer        TEXT,
  
  -- Status
  status          TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived','spam')),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_form_submissions_org_idx ON builder_form_submissions (org_id, created_at DESC);
CREATE INDEX builder_form_submissions_page_idx ON builder_form_submissions (page_id);
CREATE INDEX builder_form_submissions_status_idx ON builder_form_submissions (status);
