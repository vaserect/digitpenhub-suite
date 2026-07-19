-- =====================================================
-- Module 17: URL Shortener - Enterprise Upgrade (Bitly Benchmark)
-- Version: 2.0.0
-- Description: Comprehensive URL shortener with advanced analytics,
--              custom domains, QR codes, A/B testing, and team features
-- Benchmark: Bitly, Rebrandly, Short.io
-- =====================================================

-- =====================================================
-- 1. CORE TABLES UPGRADE
-- =====================================================

-- Drop existing simple table and recreate with enterprise features
DROP TABLE IF EXISTS short_links CASCADE;

-- Main short links table with enterprise features
CREATE TABLE short_links (
  id                BIGSERIAL PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Link identifiers
  slug              TEXT NOT NULL,
  custom_domain_id  BIGINT REFERENCES url_custom_domains(id) ON DELETE SET NULL,
  back_half         TEXT NOT NULL, -- The customizable part after domain
  
  -- Target configuration
  target_url        TEXT NOT NULL,
  title             TEXT,
  description       TEXT,
  
  -- Organization & categorization
  folder_id         BIGINT REFERENCES url_folders(id) ON DELETE SET NULL,
  tags              TEXT[] DEFAULT '{}',
  
  -- Link behavior
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','scheduled','expired')),
  link_type         TEXT NOT NULL DEFAULT 'standard' CHECK (link_type IN ('standard','rotator','ab_test','deep_link')),
  
  -- Scheduling
  scheduled_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  
  -- Security
  password_hash     TEXT,
  password_enabled  BOOLEAN DEFAULT FALSE,
  
  -- Preview customization (Open Graph)
  og_title          TEXT,
  og_description    TEXT,
  og_image_url      TEXT,
  
  -- QR Code
  qr_code_url       TEXT,
  qr_code_style     JSONB DEFAULT '{}', -- colors, logo, style options
  
  -- UTM Parameters (default for this link)
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_term          TEXT,
  utm_content       TEXT,
  
  -- Retargeting
  facebook_pixel_id TEXT,
  google_analytics_id TEXT,
  custom_pixels     JSONB DEFAULT '[]', -- Array of custom pixel configs
  
  -- Analytics summary (cached)
  total_clicks      BIGINT DEFAULT 0,
  unique_clicks     BIGINT DEFAULT 0,
  last_clicked_at   TIMESTAMPTZ,
  
  -- A/B Testing (for link_type='ab_test')
  ab_test_config    JSONB, -- {variants: [{url, weight, name}], winner_criteria}
  
  -- Link Rotation (for link_type='rotator')
  rotation_urls     JSONB, -- [{url, weight, name}]
  
  -- Deep linking (for link_type='deep_link')
  ios_url           TEXT,
  android_url       TEXT,
  desktop_fallback  TEXT,
  
  -- Metadata
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(slug),
  UNIQUE(custom_domain_id, back_half)
);

-- =====================================================
-- 2. CUSTOM DOMAINS
-- =====================================================

CREATE TABLE url_custom_domains (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  domain          TEXT NOT NULL UNIQUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  verification_token TEXT NOT NULL,
  
  -- SSL/HTTPS
  ssl_enabled     BOOLEAN DEFAULT FALSE,
  ssl_cert_status TEXT DEFAULT 'pending' CHECK (ssl_cert_status IN ('pending','active','expired','failed')),
  
  -- DNS Configuration
  dns_configured  BOOLEAN DEFAULT FALSE,
  dns_records     JSONB, -- Expected DNS records for verification
  
  -- Default settings for links on this domain
  default_og_image TEXT,
  default_favicon  TEXT,
  
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','inactive','failed')),
  
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  verified_at     TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ
);

-- =====================================================
-- 3. FOLDERS & ORGANIZATION
-- =====================================================

CREATE TABLE url_folders (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id   BIGINT REFERENCES url_folders(id) ON DELETE CASCADE,
  
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT, -- Hex color for UI
  icon        TEXT, -- Icon identifier
  
  -- Permissions
  is_shared   BOOLEAN DEFAULT FALSE,
  shared_with UUID[], -- User IDs with access
  
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, parent_id, name)
);

-- =====================================================
-- 4. ADVANCED ANALYTICS
-- =====================================================

-- Click events with detailed tracking
CREATE TABLE url_click_events (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Visitor identification
  visitor_id      TEXT NOT NULL,
  session_id      TEXT,
  
  -- Request details
  ip_address      INET,
  user_agent      TEXT,
  referer         TEXT,
  
  -- Parsed details
  country         TEXT,
  country_code    TEXT,
  region          TEXT,
  city            TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  
  -- Device info
  device_type     TEXT,
  device_brand    TEXT,
  device_model    TEXT,
  os_name         TEXT,
  os_version      TEXT,
  browser_name    TEXT,
  browser_version TEXT,
  
  -- Referrer analysis
  referrer_domain TEXT,
  referrer_type   TEXT,
  
  -- UTM tracking
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  
  -- A/B test tracking
  variant_id      TEXT,
  
  -- Bot detection
  is_bot          BOOLEAN DEFAULT FALSE,
  bot_name        TEXT,
  
  -- Timestamp
  clicked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_url_clicks_link_id ON url_click_events(link_id);
CREATE INDEX idx_url_clicks_org_id ON url_click_events(org_id);
CREATE INDEX idx_url_clicks_clicked_at ON url_click_events(clicked_at);
CREATE INDEX idx_url_clicks_country ON url_click_events(country);
CREATE INDEX idx_url_clicks_device_type ON url_click_events(device_type);
CREATE INDEX idx_url_clicks_referrer_type ON url_click_events(referrer_type);
CREATE INDEX idx_url_clicks_visitor_id ON url_click_events(visitor_id);

-- Aggregated analytics for fast queries
CREATE TABLE url_analytics_daily (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  
  -- Metrics
  total_clicks    INT DEFAULT 0,
  unique_clicks   INT DEFAULT 0,
  bot_clicks      INT DEFAULT 0,
  
  -- Top breakdowns (stored as JSONB for flexibility)
  countries       JSONB DEFAULT '{}', -- {country: count}
  cities          JSONB DEFAULT '{}',
  referrers       JSONB DEFAULT '{}',
  devices         JSONB DEFAULT '{}',
  browsers        JSONB DEFAULT '{}',
  os_systems      JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(link_id, date)
);

-- =====================================================
-- 5. A/B TESTING & LINK ROTATION
-- =====================================================

CREATE TABLE url_ab_test_results (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  variant_id      TEXT NOT NULL,
  variant_name    TEXT,
  variant_url     TEXT NOT NULL,
  
  -- Metrics
  impressions     BIGINT DEFAULT 0,
  clicks          BIGINT DEFAULT 0,
  conversions     BIGINT DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  
  -- Calculated
  ctr             NUMERIC(5,2), -- Click-through rate
  conversion_rate NUMERIC(5,2),
  
  -- Status
  is_winner       BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  
  UNIQUE(link_id, variant_id)
);

-- =====================================================
-- 6. LINK TEMPLATES
-- =====================================================

CREATE TABLE url_link_templates (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  
  -- Template configuration
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  og_title        TEXT,
  og_description  TEXT,
  og_image_url    TEXT,
  
  -- Default settings
  default_folder_id BIGINT REFERENCES url_folders(id) ON DELETE SET NULL,
  default_tags    TEXT[] DEFAULT '{}',
  
  is_default      BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. TEAM COLLABORATION
-- =====================================================

CREATE TABLE url_link_shares (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  shared_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  permission      TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view','edit','admin')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(link_id, shared_with)
);

CREATE TABLE url_link_comments (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  comment         TEXT NOT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CONVERSION TRACKING
-- =====================================================

CREATE TABLE url_conversions (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  click_event_id  BIGINT REFERENCES url_click_events(id) ON DELETE SET NULL,
  
  conversion_type TEXT NOT NULL,
  conversion_value NUMERIC(12,2),
  currency        TEXT DEFAULT 'USD',
  
  metadata        JSONB DEFAULT '{}',
  
  converted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_url_conversions_link_id ON url_conversions(link_id);

-- =====================================================
-- 9. LINK BUNDLES (Collections)
-- =====================================================

CREATE TABLE url_bundles (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,
  
  -- Display settings
  theme           TEXT DEFAULT 'default',
  custom_css      TEXT,
  logo_url        TEXT,
  
  -- SEO
  meta_title      TEXT,
  meta_description TEXT,
  
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, slug)
);

CREATE TABLE url_bundle_links (
  id              BIGSERIAL PRIMARY KEY,
  bundle_id       BIGINT NOT NULL REFERENCES url_bundles(id) ON DELETE CASCADE,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  
  position        INT NOT NULL DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bundle_id, link_id)
);

-- =====================================================
-- 10. BRANDED QR CODES
-- =====================================================

CREATE TABLE url_qr_codes (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  
  -- QR Code configuration
  size            INT DEFAULT 300,
  format          TEXT DEFAULT 'png' CHECK (format IN ('png','svg','pdf')),
  error_correction TEXT DEFAULT 'M' CHECK (error_correction IN ('L','M','Q','H')),
  
  -- Styling
  foreground_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#FFFFFF',
  logo_url        TEXT,
  logo_size       INT DEFAULT 50, -- percentage
  
  -- Frame/Border
  frame_style     TEXT, -- circle, square, rounded, etc.
  frame_text      TEXT,
  frame_color     TEXT,
  
  -- Generated file
  file_url        TEXT,
  file_size       INT, -- bytes
  
  -- Stats
  scans           BIGINT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(link_id)
);

-- =====================================================
-- 11. LINK HEALTH MONITORING
-- =====================================================

CREATE TABLE url_health_checks (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  
  status_code     INT,
  response_time   INT,
  is_accessible   BOOLEAN,
  error_message   TEXT,
  
  checked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_url_health_link_id ON url_health_checks(link_id);
CREATE INDEX idx_url_health_checked_at ON url_health_checks(checked_at);

-- =====================================================
-- 12. API ACCESS & WEBHOOKS
-- =====================================================

CREATE TABLE url_api_keys (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL, -- First 8 chars for identification
  
  -- Permissions
  scopes          TEXT[] DEFAULT '{}', -- read, write, delete, analytics
  
  -- Rate limiting
  rate_limit      INT DEFAULT 1000, -- requests per hour
  
  -- Status
  is_active       BOOLEAN DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ,
  
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE url_webhooks (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  secret          TEXT NOT NULL,
  
  -- Events to trigger on
  events          TEXT[] DEFAULT '{}', -- link.created, link.clicked, link.expired, etc.
  
  -- Filtering
  link_ids        BIGINT[], -- Specific links, or NULL for all
  folder_ids      BIGINT[], -- Specific folders, or NULL for all
  
  -- Status
  is_active       BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count   INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. LINK PREVIEW CACHE
-- =====================================================

CREATE TABLE url_preview_cache (
  id              BIGSERIAL PRIMARY KEY,
  url             TEXT NOT NULL UNIQUE,
  
  title           TEXT,
  description     TEXT,
  image_url       TEXT,
  favicon_url     TEXT,
  
  cached_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

-- Short links indexes
CREATE INDEX idx_short_links_org_id ON short_links(org_id);
CREATE INDEX idx_short_links_user_id ON short_links(user_id);
CREATE INDEX idx_short_links_slug ON short_links(slug);
CREATE INDEX idx_short_links_folder_id ON short_links(folder_id);
CREATE INDEX idx_short_links_status ON short_links(status);
CREATE INDEX idx_short_links_created_at ON short_links(created_at DESC);
CREATE INDEX idx_short_links_tags ON short_links USING GIN(tags);
CREATE INDEX idx_short_links_custom_domain ON short_links(custom_domain_id, back_half);

-- Custom domains indexes
CREATE INDEX idx_url_custom_domains_org_id ON url_custom_domains(org_id);
CREATE INDEX idx_url_custom_domains_domain ON url_custom_domains(domain);
CREATE INDEX idx_url_custom_domains_status ON url_custom_domains(status);

-- Folders indexes
CREATE INDEX idx_url_folders_org_id ON url_folders(org_id);
CREATE INDEX idx_url_folders_parent_id ON url_folders(parent_id);

-- Analytics indexes (already defined inline above)

-- Bundles indexes
CREATE INDEX idx_url_bundles_org_id ON url_bundles(org_id);
CREATE INDEX idx_url_bundles_slug ON url_bundles(slug);

-- =====================================================
-- 15. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_url_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER short_links_updated_at
  BEFORE UPDATE ON short_links
  FOR EACH ROW
  EXECUTE FUNCTION update_url_updated_at();

CREATE TRIGGER url_folders_updated_at
  BEFORE UPDATE ON url_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_url_updated_at();

CREATE TRIGGER url_link_templates_updated_at
  BEFORE UPDATE ON url_link_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_url_updated_at();

CREATE TRIGGER url_bundles_updated_at
  BEFORE UPDATE ON url_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_url_updated_at();

-- Update link click counts
CREATE OR REPLACE FUNCTION update_link_click_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE short_links
  SET 
    total_clicks = total_clicks + 1,
    last_clicked_at = NEW.clicked_at
  WHERE id = NEW.link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER url_click_stats_update
  AFTER INSERT ON url_click_events
  FOR EACH ROW
  EXECUTE FUNCTION update_link_click_stats();

-- =====================================================
-- 16. VIEWS FOR COMMON QUERIES
-- =====================================================

-- Link performance summary
CREATE OR REPLACE VIEW url_link_performance AS
SELECT 
  sl.id,
  sl.org_id,
  sl.slug,
  sl.title,
  sl.target_url,
  sl.status,
  sl.total_clicks,
  sl.unique_clicks,
  sl.created_at,
  sl.last_clicked_at,
  f.name as folder_name,
  cd.domain as custom_domain,
  COUNT(DISTINCT uce.visitor_id) as unique_visitors_7d,
  COUNT(uce.id) as clicks_7d,
  COUNT(DISTINCT uce.country) as countries_reached,
  AVG(CASE WHEN uce.clicked_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as clicks_24h
FROM short_links sl
LEFT JOIN url_folders f ON sl.folder_id = f.id
LEFT JOIN url_custom_domains cd ON sl.custom_domain_id = cd.id
LEFT JOIN url_click_events uce ON sl.id = uce.link_id 
  AND uce.clicked_at > NOW() - INTERVAL '7 days'
GROUP BY sl.id, f.name, cd.domain;

-- =====================================================
-- 17. SAMPLE DATA & DEFAULTS
-- =====================================================

-- Insert default link template
INSERT INTO url_link_templates (org_id, name, description, is_default)
SELECT 
  id,
  'Default Template',
  'Default settings for new short links',
  true
FROM organizations
LIMIT 1;

-- =====================================================
-- 18. PERMISSIONS & SECURITY
-- =====================================================

-- Row Level Security policies would go here in production
-- For now, we rely on application-level org_id filtering

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON TABLE short_links IS 'Enterprise URL shortener - v2.0.0 - Bitly benchmark features';
COMMENT ON TABLE url_click_events IS 'Detailed click analytics with geo, device, and referrer tracking';
COMMENT ON TABLE url_custom_domains IS 'Custom branded domains for short links';
COMMENT ON TABLE url_qr_codes IS 'Branded QR code generation and tracking';
