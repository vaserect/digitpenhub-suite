-- =====================================================
-- Module 18: QR Code Generator - Enterprise Upgrade
-- Version: 2.0.0
-- Description: Advanced QR code generation with templates,
--              dynamic codes, analytics, batch generation,
--              and professional design features
-- Benchmark: QR Code Monkey, QR Tiger, Beaconstac
-- =====================================================

-- =====================================================
-- 1. CORE TABLES UPGRADE
-- =====================================================

-- Drop existing simple table and recreate with enterprise features
DROP TABLE IF EXISTS qr_codes CASCADE;

-- Main QR codes table with enterprise features
CREATE TABLE qr_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title             TEXT NOT NULL,
  description       TEXT,
  
  -- QR Code type and content
  qr_type           TEXT NOT NULL DEFAULT 'url' CHECK (qr_type IN (
    'url', 'text', 'email', 'phone', 'sms', 'whatsapp',
    'vcard', 'vcard_plus', 'wifi', 'event', 'location',
    'payment', 'social', 'app_store', 'pdf', 'video',
    'menu', 'coupon', 'feedback', 'multi_url', 'dynamic'
  )),
  
  -- Content (structure varies by type)
  content           JSONB NOT NULL, -- Flexible structure for different QR types
  
  -- Dynamic QR (can be updated after generation)
  is_dynamic        BOOLEAN DEFAULT FALSE,
  redirect_url      TEXT, -- For dynamic QR codes
  
  -- Organization
  folder_id         BIGINT REFERENCES qr_folders(id) ON DELETE SET NULL,
  tags              TEXT[] DEFAULT '{}',
  
  -- Design & Styling
  design_template_id BIGINT REFERENCES qr_templates(id) ON DELETE SET NULL,
  
  -- Colors
  foreground_color  TEXT DEFAULT '#000000',
  background_color  TEXT DEFAULT '#FFFFFF',
  gradient_type     TEXT CHECK (gradient_type IN ('none','linear','radial')),
  gradient_color_1  TEXT,
  gradient_color_2  TEXT,
  
  -- Logo/Image
  logo_url          TEXT,
  logo_size         INT DEFAULT 20, -- percentage
  logo_style        TEXT DEFAULT 'square' CHECK (logo_style IN ('square','circle','rounded')),
  
  -- Frame/Border
  frame_style       TEXT CHECK (frame_style IN ('none','square','rounded','circle','banner','bottom_text','top_text')),
  frame_color       TEXT,
  frame_text        TEXT,
  frame_text_color  TEXT,
  
  -- Pattern & Shape
  pattern_style     TEXT DEFAULT 'square' CHECK (pattern_style IN ('square','rounded','dots','classy','classy_rounded','extra_rounded')),
  eye_style         TEXT DEFAULT 'square' CHECK (eye_style IN ('square','rounded','circle','leaf','diamond')),
  eye_color         TEXT,
  
  -- Technical settings
  size              INT DEFAULT 300,
  error_correction  TEXT DEFAULT 'M' CHECK (error_correction IN ('L','M','Q','H')),
  margin            INT DEFAULT 4,
  
  -- File generation
  file_format       TEXT DEFAULT 'png' CHECK (file_format IN ('png','svg','pdf','eps','jpg')),
  file_url          TEXT,
  file_size         INT, -- bytes
  
  -- Analytics
  total_scans       BIGINT DEFAULT 0,
  unique_scans      BIGINT DEFAULT 0,
  last_scanned_at   TIMESTAMPTZ,
  
  -- Status
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','expired','archived')),
  expires_at        TIMESTAMPTZ,
  
  -- Metadata
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FOLDERS & ORGANIZATION
-- =====================================================

CREATE TABLE qr_folders (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id       BIGINT REFERENCES qr_folders(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  icon            TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, parent_id, name)
);

-- =====================================================
-- 3. TEMPLATES & PRESETS
-- =====================================================

CREATE TABLE qr_templates (
  id                  BIGSERIAL PRIMARY KEY,
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name                TEXT NOT NULL,
  description         TEXT,
  category            TEXT, -- business, personal, event, marketing, etc.
  
  -- Template is either org-specific or global
  is_global           BOOLEAN DEFAULT FALSE,
  is_premium          BOOLEAN DEFAULT FALSE,
  
  -- Design configuration
  foreground_color    TEXT DEFAULT '#000000',
  background_color    TEXT DEFAULT '#FFFFFF',
  gradient_type       TEXT,
  gradient_color_1    TEXT,
  gradient_color_2    TEXT,
  
  logo_url            TEXT,
  logo_size           INT DEFAULT 20,
  logo_style          TEXT DEFAULT 'square',
  
  frame_style         TEXT,
  frame_color         TEXT,
  frame_text          TEXT,
  frame_text_color    TEXT,
  
  pattern_style       TEXT DEFAULT 'square',
  eye_style           TEXT DEFAULT 'square',
  eye_color           TEXT,
  
  error_correction    TEXT DEFAULT 'M',
  
  -- Preview
  preview_url         TEXT,
  
  -- Usage stats
  usage_count         INT DEFAULT 0,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. SCAN ANALYTICS
-- =====================================================

CREATE TABLE qr_scan_events (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
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
  
  -- Scan context
  scan_method     TEXT, -- camera, app, reader
  
  -- Timestamp
  scanned_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_qr_code_id ON qr_scan_events(qr_code_id);
CREATE INDEX idx_qr_scans_org_id ON qr_scan_events(org_id);
CREATE INDEX idx_qr_scans_scanned_at ON qr_scan_events(scanned_at);
CREATE INDEX idx_qr_scans_country ON qr_scan_events(country);
CREATE INDEX idx_qr_scans_device_type ON qr_scan_events(device_type);
CREATE INDEX idx_qr_scans_visitor_id ON qr_scan_events(visitor_id);

-- Aggregated daily analytics
CREATE TABLE qr_analytics_daily (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  
  total_scans     INT DEFAULT 0,
  unique_scans    INT DEFAULT 0,
  
  -- Breakdowns
  countries       JSONB DEFAULT '{}',
  cities          JSONB DEFAULT '{}',
  devices         JSONB DEFAULT '{}',
  browsers        JSONB DEFAULT '{}',
  os_systems      JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(qr_code_id, date)
);

-- =====================================================
-- 5. BATCH GENERATION
-- =====================================================

CREATE TABLE qr_batches (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  
  -- Batch configuration
  qr_type         TEXT NOT NULL,
  template_id     BIGINT REFERENCES qr_templates(id) ON DELETE SET NULL,
  
  -- Generation settings
  total_codes     INT NOT NULL,
  generated_codes INT DEFAULT 0,
  
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error_message   TEXT,
  
  -- Files
  zip_file_url    TEXT,
  csv_file_url    TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE qr_batch_items (
  id              BIGSERIAL PRIMARY KEY,
  batch_id        BIGINT NOT NULL REFERENCES qr_batches(id) ON DELETE CASCADE,
  qr_code_id      UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  
  -- Item data
  item_data       JSONB NOT NULL,
  
  -- Generation status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','generated','failed')),
  error_message   TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. VCARD PLUS (Enhanced Business Cards)
-- =====================================================

CREATE TABLE qr_vcard_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name      TEXT,
  last_name       TEXT,
  organization    TEXT,
  title           TEXT,
  
  -- Contact
  phone_mobile    TEXT,
  phone_work      TEXT,
  phone_home      TEXT,
  email_work      TEXT,
  email_personal  TEXT,
  website         TEXT,
  
  -- Address
  street          TEXT,
  city            TEXT,
  state           TEXT,
  postal_code     TEXT,
  country         TEXT,
  
  -- Social media
  linkedin_url    TEXT,
  twitter_url     TEXT,
  facebook_url    TEXT,
  instagram_url   TEXT,
  
  -- Additional
  photo_url       TEXT,
  notes           TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. WIFI QR CODES
-- =====================================================

CREATE TABLE qr_wifi_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  ssid            TEXT NOT NULL,
  password        TEXT,
  security_type   TEXT NOT NULL CHECK (security_type IN ('WPA','WPA2','WEP','nopass')),
  hidden          BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. EVENT/CALENDAR QR CODES
-- =====================================================

CREATE TABLE qr_event_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  event_title     TEXT NOT NULL,
  event_description TEXT,
  location        TEXT,
  
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  all_day         BOOLEAN DEFAULT FALSE,
  
  organizer_name  TEXT,
  organizer_email TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. PAYMENT QR CODES
-- =====================================================

CREATE TABLE qr_payment_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('paypal','bitcoin','ethereum','upi','bank_transfer')),
  
  -- PayPal
  paypal_email    TEXT,
  
  -- Crypto
  wallet_address  TEXT,
  
  -- UPI (India)
  upi_id          TEXT,
  
  -- Bank transfer
  account_number  TEXT,
  routing_number  TEXT,
  bank_name       TEXT,
  
  -- Amount
  amount          NUMERIC(12,2),
  currency        TEXT DEFAULT 'USD',
  
  -- Description
  payment_note    TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. SOCIAL MEDIA QR CODES
-- =====================================================

CREATE TABLE qr_social_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  platform        TEXT NOT NULL CHECK (platform IN ('facebook','instagram','twitter','linkedin','tiktok','youtube','snapchat','whatsapp','telegram')),
  username        TEXT,
  profile_url     TEXT NOT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. MULTI-URL QR CODES (Smart QR)
-- =====================================================

CREATE TABLE qr_multi_url_rules (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  rule_type       TEXT NOT NULL CHECK (rule_type IN ('device','location','time','language','scan_count')),
  
  -- Conditions
  condition       JSONB NOT NULL, -- {device: 'ios', location: 'US', time: '9-17', etc}
  
  -- Target
  target_url      TEXT NOT NULL,
  
  -- Priority
  priority        INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. QR CODE CAMPAIGNS
-- =====================================================

CREATE TABLE qr_campaigns (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  
  -- Campaign period
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  
  -- Goals
  target_scans    INT,
  
  status          TEXT DEFAULT 'active' CHECK (status IN ('draft','active','paused','completed')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qr_campaign_codes (
  id              BIGSERIAL PRIMARY KEY,
  campaign_id     BIGINT NOT NULL REFERENCES qr_campaigns(id) ON DELETE CASCADE,
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, qr_code_id)
);

-- =====================================================
-- 13. QR CODE SHARING & COLLABORATION
-- =====================================================

CREATE TABLE qr_shares (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  shared_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  permission      TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view','edit','admin')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(qr_code_id, shared_with)
);

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_qr_codes_org_id ON qr_codes(org_id);
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_folder_id ON qr_codes(folder_id);
CREATE INDEX idx_qr_codes_qr_type ON qr_codes(qr_type);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at DESC);
CREATE INDEX idx_qr_codes_tags ON qr_codes USING GIN(tags);
CREATE INDEX idx_qr_codes_is_dynamic ON qr_codes(is_dynamic);

CREATE INDEX idx_qr_folders_org_id ON qr_folders(org_id);
CREATE INDEX idx_qr_folders_parent_id ON qr_folders(parent_id);

CREATE INDEX idx_qr_templates_org_id ON qr_templates(org_id);
CREATE INDEX idx_qr_templates_is_global ON qr_templates(is_global);
CREATE INDEX idx_qr_templates_category ON qr_templates(category);

CREATE INDEX idx_qr_batches_org_id ON qr_batches(org_id);
CREATE INDEX idx_qr_batches_status ON qr_batches(status);

CREATE INDEX idx_qr_campaigns_org_id ON qr_campaigns(org_id);
CREATE INDEX idx_qr_campaigns_status ON qr_campaigns(status);

-- =====================================================
-- 15. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_updated_at();

CREATE TRIGGER qr_folders_updated_at
  BEFORE UPDATE ON qr_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_updated_at();

CREATE TRIGGER qr_templates_updated_at
  BEFORE UPDATE ON qr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_updated_at();

CREATE TRIGGER qr_campaigns_updated_at
  BEFORE UPDATE ON qr_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_updated_at();

-- Update QR code scan stats
CREATE OR REPLACE FUNCTION update_qr_scan_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET 
    total_scans = total_scans + 1,
    last_scanned_at = NEW.scanned_at
  WHERE id = NEW.qr_code_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qr_scan_stats_update
  AFTER INSERT ON qr_scan_events
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_scan_stats();

-- =====================================================
-- 16. VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE OR REPLACE VIEW qr_code_performance AS
SELECT 
  qc.id,
  qc.org_id,
  qc.title,
  qc.qr_type,
  qc.status,
  qc.total_scans,
  qc.unique_scans,
  qc.created_at,
  qc.last_scanned_at,
  f.name as folder_name,
  t.name as template_name,
  COUNT(DISTINCT qse.visitor_id) as unique_visitors_7d,
  COUNT(qse.id) as scans_7d,
  COUNT(DISTINCT qse.country) as countries_reached
FROM qr_codes qc
LEFT JOIN qr_folders f ON qc.folder_id = f.id
LEFT JOIN qr_templates t ON qc.design_template_id = t.id
LEFT JOIN qr_scan_events qse ON qc.id = qse.qr_code_id 
  AND qse.scanned_at > NOW() - INTERVAL '7 days'
GROUP BY qc.id, f.name, t.name;

-- =====================================================
-- 17. SAMPLE DATA & DEFAULTS
-- =====================================================

-- Insert default templates
INSERT INTO qr_templates (name, description, category, is_global, foreground_color, background_color, pattern_style, eye_style)
VALUES 
  ('Classic Black', 'Simple black and white QR code', 'basic', true, '#000000', '#FFFFFF', 'square', 'square'),
  ('Modern Blue', 'Modern blue gradient design', 'business', true, '#0066CC', '#FFFFFF', 'rounded', 'rounded'),
  ('Elegant Purple', 'Elegant purple with rounded corners', 'business', true, '#6B46C1', '#FFFFFF', 'classy_rounded', 'circle'),
  ('Vibrant Red', 'Eye-catching red design', 'marketing', true, '#DC2626', '#FFFFFF', 'dots', 'diamond'),
  ('Nature Green', 'Eco-friendly green theme', 'personal', true, '#059669', '#FFFFFF', 'extra_rounded', 'leaf');

-- =====================================================
-- 18. PERMISSIONS & SECURITY
-- =====================================================

-- Row Level Security would go here in production

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE qr_codes IS 'Enterprise QR code generator - v2.0.0 - QR Code Monkey/QR Tiger benchmark features';
COMMENT ON TABLE qr_scan_events IS 'Detailed scan analytics with geo, device, and context tracking';
COMMENT ON TABLE qr_templates IS 'Reusable design templates for QR codes';
COMMENT ON TABLE qr_batches IS 'Batch generation of multiple QR codes';
