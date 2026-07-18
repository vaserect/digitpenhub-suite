-- =====================================================
-- Module 19: Link-in-Bio - Enterprise Upgrade
-- Version: 2.0.0
-- Description: Advanced link-in-bio with analytics,
--              themes, scheduling, SEO, and integrations
-- Benchmark: Linktree Pro / Beacons
-- =====================================================

-- =====================================================
-- 1. ENHANCE EXISTING TABLES
-- =====================================================

-- Add new fields to link_in_bio_pages
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS theme_id BIGINT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'centered' CHECK (layout_style IN ('centered', 'left', 'grid'));
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS show_branding BOOLEAN DEFAULT TRUE;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE link_in_bio_pages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add new fields to bio_links
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMPTZ;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMPTZ;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS animation TEXT DEFAULT 'none' CHECK (animation IN ('none', 'fade', 'slide', 'bounce', 'pulse'));
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. THEMES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_themes (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT, -- minimal, professional, creative, bold, etc.
  
  -- Is this a system theme or custom?
  is_system       BOOLEAN DEFAULT FALSE,
  is_premium      BOOLEAN DEFAULT FALSE,
  
  -- Theme configuration
  bg_color        TEXT DEFAULT '#ffffff',
  bg_gradient     TEXT, -- CSS gradient string
  bg_image        TEXT, -- Background image URL
  
  text_color      TEXT DEFAULT '#000000',
  accent_color    TEXT DEFAULT '#2563eb',
  link_bg_color   TEXT DEFAULT '#f3f4f6',
  link_text_color TEXT DEFAULT '#000000',
  
  font_family     TEXT DEFAULT 'Inter',
  font_size       TEXT DEFAULT 'medium', -- small, medium, large
  
  border_radius   TEXT DEFAULT 'medium', -- none, small, medium, large, full
  link_style      TEXT DEFAULT 'solid', -- solid, outline, shadow, gradient
  
  layout_style    TEXT DEFAULT 'centered',
  spacing         TEXT DEFAULT 'medium', -- compact, medium, spacious
  
  -- Preview
  preview_url     TEXT,
  
  -- Usage stats
  usage_count     INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, name)
);

-- Add foreign key for theme_id
ALTER TABLE link_in_bio_pages 
  ADD CONSTRAINT fk_page_theme 
  FOREIGN KEY (theme_id) 
  REFERENCES bio_themes(id) 
  ON DELETE SET NULL;

-- =====================================================
-- 3. ANALYTICS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_page_views (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Visitor identification
  visitor_id      TEXT NOT NULL, -- Hashed fingerprint
  session_id      TEXT,
  
  -- Request details
  ip_address      INET,
  user_agent      TEXT,
  referer         TEXT,
  
  -- Location
  country         TEXT,
  country_code    TEXT,
  region          TEXT,
  city            TEXT,
  
  -- Device info
  device_type     TEXT, -- mobile, tablet, desktop
  device_brand    TEXT,
  os_name         TEXT,
  browser_name    TEXT,
  
  viewed_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bio_page_views_page_id ON bio_page_views(page_id);
CREATE INDEX idx_bio_page_views_org_id ON bio_page_views(org_id);
CREATE INDEX idx_bio_page_views_viewed_at ON bio_page_views(viewed_at);

CREATE TABLE IF NOT EXISTS bio_link_clicks (
  id              BIGSERIAL PRIMARY KEY,
  link_id         UUID NOT NULL REFERENCES bio_links(id) ON DELETE CASCADE,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Visitor identification
  visitor_id      TEXT NOT NULL,
  session_id      TEXT,
  
  -- Request details
  ip_address      INET,
  user_agent      TEXT,
  referer         TEXT,
  
  -- Location
  country         TEXT,
  country_code    TEXT,
  region          TEXT,
  city            TEXT,
  
  -- Device info
  device_type     TEXT,
  device_brand    TEXT,
  os_name         TEXT,
  browser_name    TEXT,
  
  clicked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bio_link_clicks_link_id ON bio_link_clicks(link_id);
CREATE INDEX idx_bio_link_clicks_page_id ON bio_link_clicks(page_id);
CREATE INDEX idx_bio_link_clicks_org_id ON bio_link_clicks(org_id);
CREATE INDEX idx_bio_link_clicks_clicked_at ON bio_link_clicks(clicked_at);

-- Aggregated daily analytics
CREATE TABLE IF NOT EXISTS bio_analytics_daily (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  
  total_views     INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  total_clicks    INT DEFAULT 0,
  
  -- Breakdowns (JSONB for flexibility)
  countries       JSONB DEFAULT '{}',
  devices         JSONB DEFAULT '{}',
  browsers        JSONB DEFAULT '{}',
  referrers       JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(page_id, date)
);

CREATE INDEX idx_bio_analytics_daily_page_id ON bio_analytics_daily(page_id);
CREATE INDEX idx_bio_analytics_daily_date ON bio_analytics_daily(date);

-- =====================================================
-- 4. INTEGRATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_integrations (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  integration_type TEXT NOT NULL, -- google_analytics, facebook_pixel, mailchimp, webhook, etc.
  
  config          JSONB NOT NULL, -- Integration-specific configuration
  
  is_active       BOOLEAN DEFAULT TRUE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(page_id, integration_type)
);

-- =====================================================
-- 5. EMAIL CAPTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_email_captures (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  email           TEXT NOT NULL,
  name            TEXT,
  
  -- Additional fields (custom form fields)
  custom_fields   JSONB DEFAULT '{}',
  
  -- Source tracking
  visitor_id      TEXT,
  ip_address      INET,
  user_agent      TEXT,
  referer         TEXT,
  
  captured_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bio_email_captures_page_id ON bio_email_captures(page_id);
CREATE INDEX idx_bio_email_captures_org_id ON bio_email_captures(org_id);
CREATE INDEX idx_bio_email_captures_email ON bio_email_captures(email);

-- =====================================================
-- 6. CUSTOM DOMAINS (Future)
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_custom_domains (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  domain          TEXT NOT NULL UNIQUE,
  
  -- Verification
  verification_token TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_at     TIMESTAMPTZ,
  
  -- SSL
  ssl_enabled     BOOLEAN DEFAULT FALSE,
  ssl_issued_at   TIMESTAMPTZ,
  ssl_expires_at  TIMESTAMPTZ,
  
  -- DNS records needed
  dns_records     JSONB,
  
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'expired')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. LINK CATEGORIES/SECTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS bio_link_sections (
  id              BIGSERIAL PRIMARY KEY,
  page_id         UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title           TEXT NOT NULL,
  description     TEXT,
  
  sort_order      INT DEFAULT 0,
  is_collapsible  BOOLEAN DEFAULT FALSE,
  is_collapsed    BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add section_id to bio_links
ALTER TABLE bio_links ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES bio_link_sections(id) ON DELETE SET NULL;

-- =====================================================
-- 8. SEED SYSTEM THEMES
-- =====================================================

INSERT INTO bio_themes (name, description, category, is_system, is_premium, bg_color, accent_color, link_bg_color, link_text_color, font_family, border_radius, link_style, layout_style)
VALUES 
  ('Minimal White', 'Clean and simple white theme', 'minimal', true, false, '#ffffff', '#000000', '#f3f4f6', '#000000', 'Inter', 'medium', 'solid', 'centered'),
  ('Dark Mode', 'Sleek dark theme for night owls', 'minimal', true, false, '#1a1a1a', '#3b82f6', '#2a2a2a', '#ffffff', 'Inter', 'medium', 'solid', 'centered'),
  ('Ocean Blue', 'Calming blue gradient theme', 'professional', true, false, '#0ea5e9', '#0284c7', '#ffffff', '#0c4a6e', 'Inter', 'large', 'solid', 'centered'),
  ('Sunset Gradient', 'Warm gradient from orange to pink', 'creative', true, true, '#f97316', '#ec4899', '#ffffff', '#7c2d12', 'Poppins', 'full', 'gradient', 'centered'),
  ('Neon Glow', 'Bold neon colors with glow effects', 'bold', true, true, '#000000', '#a855f7', '#1a1a1a', '#ffffff', 'Space Grotesk', 'medium', 'shadow', 'centered'),
  ('Professional Gray', 'Corporate gray theme', 'professional', true, false, '#f9fafb', '#4b5563', '#ffffff', '#1f2937', 'Inter', 'small', 'outline', 'left'),
  ('Pastel Dream', 'Soft pastel colors', 'creative', true, true, '#fef3c7', '#f59e0b', '#fef9c3', '#78350f', 'Quicksand', 'full', 'solid', 'centered'),
  ('Monochrome', 'Black and white minimalist', 'minimal', true, false, '#ffffff', '#000000', '#000000', '#ffffff', 'Helvetica', 'none', 'outline', 'centered')
ON CONFLICT (org_id, name) DO NOTHING;

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bio_themes_org_id ON bio_themes(org_id);
CREATE INDEX IF NOT EXISTS idx_bio_themes_is_system ON bio_themes(is_system);
CREATE INDEX IF NOT EXISTS idx_bio_integrations_page_id ON bio_integrations(page_id);
CREATE INDEX IF NOT EXISTS idx_bio_link_sections_page_id ON bio_link_sections(page_id);

-- =====================================================
-- 10. UPDATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_bio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bio_pages_updated_at BEFORE UPDATE ON link_in_bio_pages
  FOR EACH ROW EXECUTE FUNCTION update_bio_updated_at();

CREATE TRIGGER bio_links_updated_at BEFORE UPDATE ON bio_links
  FOR EACH ROW EXECUTE FUNCTION update_bio_updated_at();

CREATE TRIGGER bio_themes_updated_at BEFORE UPDATE ON bio_themes
  FOR EACH ROW EXECUTE FUNCTION update_bio_updated_at();
