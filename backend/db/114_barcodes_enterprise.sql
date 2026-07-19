-- =====================================================
-- Module 19: Barcode Generator - Enterprise Upgrade
-- Version: 2.0.0
-- Description: Advanced barcode generation with multiple formats,
--              batch generation, inventory management, analytics,
--              and professional print templates
-- Benchmark: BarTender, Labeljoy, Barcode Studio
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (Clean slate)
-- =====================================================

DROP TABLE IF EXISTS barcode_shares CASCADE;
DROP TABLE IF EXISTS barcode_validation_rules CASCADE;
DROP TABLE IF EXISTS barcode_campaign_codes CASCADE;
DROP TABLE IF EXISTS barcode_campaigns CASCADE;
DROP TABLE IF EXISTS barcode_shipments CASCADE;
DROP TABLE IF EXISTS barcode_assets CASCADE;
DROP TABLE IF EXISTS barcode_product_links CASCADE;
DROP TABLE IF EXISTS barcode_print_templates CASCADE;
DROP TABLE IF EXISTS barcode_batch_items CASCADE;
DROP TABLE IF EXISTS barcode_batches CASCADE;
DROP TABLE IF EXISTS barcode_analytics_daily CASCADE;
DROP TABLE IF EXISTS barcode_scan_events CASCADE;
DROP TABLE IF EXISTS barcodes CASCADE;
DROP TABLE IF EXISTS barcode_templates CASCADE;
DROP TABLE IF EXISTS barcode_folders CASCADE;

-- =====================================================
-- 1. FOLDERS & ORGANIZATION (Create first - referenced by barcodes)
-- =====================================================

CREATE TABLE barcode_folders (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id       BIGINT REFERENCES barcode_folders(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  icon            TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, parent_id, name)
);

-- =====================================================
-- 2. TEMPLATES & PRESETS (Create before barcodes)
-- =====================================================

CREATE TABLE barcode_templates (
  id                  BIGSERIAL PRIMARY KEY,
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name                TEXT NOT NULL,
  description         TEXT,
  category            TEXT, -- product, shipping, asset, ticket, etc.
  
  -- Template is either org-specific or global
  is_global           BOOLEAN DEFAULT FALSE,
  is_premium          BOOLEAN DEFAULT FALSE,
  
  -- Default barcode type
  barcode_type        TEXT DEFAULT 'code128',
  
  -- Design configuration
  bar_color           TEXT DEFAULT '#000000',
  background_color    TEXT DEFAULT '#FFFFFF',
  text_color          TEXT DEFAULT '#000000',
  
  width               INT DEFAULT 200,
  height              INT DEFAULT 100,
  bar_width           INT DEFAULT 2,
  
  show_text           BOOLEAN DEFAULT TRUE,
  text_position       TEXT DEFAULT 'bottom',
  text_size           INT DEFAULT 12,
  text_font           TEXT DEFAULT 'monospace',
  
  margin_top          INT DEFAULT 10,
  margin_bottom       INT DEFAULT 10,
  margin_left         INT DEFAULT 10,
  margin_right        INT DEFAULT 10,
  
  -- Preview
  preview_url         TEXT,
  
  -- Usage stats
  usage_count         INT DEFAULT 0,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PRODUCTS TABLE (Create before barcodes if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  sku             TEXT,
  
  -- Pricing
  price           NUMERIC(12,2),
  cost            NUMERIC(12,2),
  currency        TEXT DEFAULT 'USD',
  
  -- Inventory
  quantity        INT DEFAULT 0,
  low_stock_alert INT DEFAULT 10,
  
  -- Categorization
  category        TEXT,
  brand           TEXT,
  
  -- Status
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','discontinued')),
  
  -- Metadata
  metadata        JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CORE BARCODES TABLE
-- =====================================================

CREATE TABLE barcodes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  name              TEXT NOT NULL,
  description       TEXT,
  
  -- Barcode type and content
  barcode_type      TEXT NOT NULL DEFAULT 'code128' CHECK (barcode_type IN (
    'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e',
    'itf14', 'msi', 'pharmacode', 'codabar', 'datamatrix',
    'pdf417', 'qr', 'aztec', 'gs1_128', 'isbn', 'issn'
  )),
  
  -- Content
  content           TEXT NOT NULL,
  human_readable    TEXT, -- Display text (if different from content)
  
  -- Organization
  folder_id         BIGINT REFERENCES barcode_folders(id) ON DELETE SET NULL,
  tags              TEXT[] DEFAULT '{}',
  category          TEXT, -- product, asset, document, ticket, etc.
  
  -- Product/Inventory linking
  product_id        BIGINT REFERENCES products(id) ON DELETE SET NULL,
  sku               TEXT,
  
  -- Design & Styling
  template_id       BIGINT REFERENCES barcode_templates(id) ON DELETE SET NULL,
  
  -- Colors
  bar_color         TEXT DEFAULT '#000000',
  background_color  TEXT DEFAULT '#FFFFFF',
  text_color        TEXT DEFAULT '#000000',
  
  -- Dimensions
  width             INT DEFAULT 200, -- pixels
  height            INT DEFAULT 100, -- pixels
  bar_width         INT DEFAULT 2, -- bar width in pixels
  
  -- Text display
  show_text         BOOLEAN DEFAULT TRUE,
  text_position     TEXT DEFAULT 'bottom' CHECK (text_position IN ('top','bottom','none')),
  text_size         INT DEFAULT 12,
  text_font         TEXT DEFAULT 'monospace',
  
  -- Margins & padding
  margin_top        INT DEFAULT 10,
  margin_bottom     INT DEFAULT 10,
  margin_left       INT DEFAULT 10,
  margin_right      INT DEFAULT 10,
  
  -- File generation
  file_format       TEXT DEFAULT 'png' CHECK (file_format IN ('png','svg','pdf','eps','jpg')),
  file_url          TEXT,
  file_size         INT, -- bytes
  
  -- Analytics
  total_scans       BIGINT DEFAULT 0,
  unique_scans      BIGINT DEFAULT 0,
  last_scanned_at   TIMESTAMPTZ,
  
  -- Print tracking
  print_count       INT DEFAULT 0,
  last_printed_at   TIMESTAMPTZ,
  
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
-- 5. SCAN ANALYTICS
-- =====================================================

CREATE TABLE barcode_scan_events (
  id              BIGSERIAL PRIMARY KEY,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
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
  scan_method     TEXT, -- scanner, camera, app
  scanner_type    TEXT, -- handheld, fixed, mobile
  
  -- Timestamp
  scanned_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated daily analytics
CREATE TABLE barcode_analytics_daily (
  id              BIGSERIAL PRIMARY KEY,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  
  total_scans     INT DEFAULT 0,
  unique_scans    INT DEFAULT 0,
  
  -- Breakdowns
  countries       JSONB DEFAULT '{}',
  cities          JSONB DEFAULT '{}',
  devices         JSONB DEFAULT '{}',
  scanners        JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(barcode_id, date)
);

-- =====================================================
-- 6. BATCH GENERATION
-- =====================================================

CREATE TABLE barcode_batches (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  
  -- Batch configuration
  barcode_type    TEXT NOT NULL,
  template_id     BIGINT REFERENCES barcode_templates(id) ON DELETE SET NULL,
  
  -- Generation settings
  total_codes     INT NOT NULL,
  generated_codes INT DEFAULT 0,
  
  -- Numbering
  start_number    BIGINT,
  prefix          TEXT,
  suffix          TEXT,
  
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  error_message   TEXT,
  
  -- Files
  zip_file_url    TEXT,
  csv_file_url    TEXT,
  pdf_file_url    TEXT, -- Combined PDF
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE barcode_batch_items (
  id              BIGSERIAL PRIMARY KEY,
  batch_id        BIGINT NOT NULL REFERENCES barcode_batches(id) ON DELETE CASCADE,
  barcode_id      UUID REFERENCES barcodes(id) ON DELETE SET NULL,
  
  -- Item data
  item_data       JSONB NOT NULL,
  sequence_number INT,
  
  -- Generation status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','generated','failed')),
  error_message   TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. PRINT TEMPLATES & LABELS
-- =====================================================

CREATE TABLE barcode_print_templates (
  id                  BIGSERIAL PRIMARY KEY,
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name                TEXT NOT NULL,
  description         TEXT,
  
  -- Paper size
  paper_size          TEXT DEFAULT 'letter' CHECK (paper_size IN ('letter','a4','legal','custom')),
  paper_width         NUMERIC(10,2), -- inches
  paper_height        NUMERIC(10,2), -- inches
  
  -- Label dimensions
  label_width         NUMERIC(10,2) NOT NULL, -- inches
  label_height        NUMERIC(10,2) NOT NULL, -- inches
  
  -- Layout
  columns             INT DEFAULT 1,
  rows                INT DEFAULT 1,
  horizontal_spacing  NUMERIC(10,2) DEFAULT 0,
  vertical_spacing    NUMERIC(10,2) DEFAULT 0,
  
  -- Margins
  margin_top          NUMERIC(10,2) DEFAULT 0.5,
  margin_bottom       NUMERIC(10,2) DEFAULT 0.5,
  margin_left         NUMERIC(10,2) DEFAULT 0.5,
  margin_right        NUMERIC(10,2) DEFAULT 0.5,
  
  -- Content layout
  layout_config       JSONB, -- {barcode_position, text_fields, logo_position, etc}
  
  -- Popular label sizes
  label_type          TEXT, -- avery_5160, dymo_30252, etc.
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. BARCODE-PRODUCT LINKING
-- =====================================================

-- Barcode-Product linking (many-to-many)
CREATE TABLE barcode_product_links (
  id              BIGSERIAL PRIMARY KEY,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  is_primary      BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(barcode_id, product_id)
);

-- =====================================================
-- 9. ASSET TRACKING
-- =====================================================

CREATE TABLE barcode_assets (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  
  asset_name      TEXT NOT NULL,
  asset_type      TEXT, -- equipment, furniture, vehicle, etc.
  
  -- Details
  serial_number   TEXT,
  model           TEXT,
  manufacturer    TEXT,
  
  -- Location
  location        TEXT,
  department      TEXT,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Financial
  purchase_date   DATE,
  purchase_price  NUMERIC(12,2),
  depreciation    NUMERIC(12,2),
  
  -- Status
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','retired','lost')),
  
  -- Maintenance
  last_maintenance DATE,
  next_maintenance DATE,
  
  notes           TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. SHIPPING & LOGISTICS
-- =====================================================

CREATE TABLE barcode_shipments (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  
  tracking_number TEXT NOT NULL,
  carrier         TEXT, -- ups, fedex, usps, dhl, etc.
  
  -- Addresses
  from_address    JSONB,
  to_address      JSONB,
  
  -- Package details
  weight          NUMERIC(10,2),
  weight_unit     TEXT DEFAULT 'lbs',
  dimensions      JSONB, -- {length, width, height}
  
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_transit','delivered','returned','cancelled')),
  
  -- Dates
  shipped_at      TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  
  notes           TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. CAMPAIGNS & PROMOTIONS
-- =====================================================

CREATE TABLE barcode_campaigns (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  campaign_type   TEXT, -- promotion, loyalty, event, etc.
  
  -- Campaign period
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  
  -- Goals
  target_scans    INT,
  
  status          TEXT DEFAULT 'active' CHECK (status IN ('draft','active','paused','completed')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE barcode_campaign_codes (
  id              BIGSERIAL PRIMARY KEY,
  campaign_id     BIGINT NOT NULL REFERENCES barcode_campaigns(id) ON DELETE CASCADE,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, barcode_id)
);

-- =====================================================
-- 12. VALIDATION RULES
-- =====================================================

CREATE TABLE barcode_validation_rules (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  barcode_type    TEXT NOT NULL,
  
  -- Validation rules
  min_length      INT,
  max_length      INT,
  pattern         TEXT, -- regex pattern
  checksum_type   TEXT, -- mod10, mod11, etc.
  
  -- Custom validation
  custom_validator TEXT, -- JavaScript function
  
  is_active       BOOLEAN DEFAULT TRUE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. SHARING & COLLABORATION
-- =====================================================

CREATE TABLE barcode_shares (
  id              BIGSERIAL PRIMARY KEY,
  barcode_id      UUID NOT NULL REFERENCES barcodes(id) ON DELETE CASCADE,
  shared_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  permission      TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view','edit','admin')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(barcode_id, shared_with)
);

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_barcodes_org_id ON barcodes(org_id);
CREATE INDEX idx_barcodes_user_id ON barcodes(user_id);
CREATE INDEX idx_barcodes_folder_id ON barcodes(folder_id);
CREATE INDEX idx_barcodes_barcode_type ON barcodes(barcode_type);
CREATE INDEX idx_barcodes_status ON barcodes(status);
CREATE INDEX idx_barcodes_created_at ON barcodes(created_at DESC);
CREATE INDEX idx_barcodes_tags ON barcodes USING GIN(tags);
CREATE INDEX idx_barcodes_content ON barcodes(content);
CREATE INDEX idx_barcodes_sku ON barcodes(sku);
CREATE INDEX idx_barcodes_product_id ON barcodes(product_id);

CREATE INDEX idx_barcode_folders_org_id ON barcode_folders(org_id);
CREATE INDEX idx_barcode_folders_parent_id ON barcode_folders(parent_id);

CREATE INDEX idx_barcode_templates_org_id ON barcode_templates(org_id);
CREATE INDEX idx_barcode_templates_is_global ON barcode_templates(is_global);
CREATE INDEX idx_barcode_templates_category ON barcode_templates(category);

CREATE INDEX idx_barcode_scan_events_barcode_id ON barcode_scan_events(barcode_id);
CREATE INDEX idx_barcode_scan_events_org_id ON barcode_scan_events(org_id);
CREATE INDEX idx_barcode_scan_events_scanned_at ON barcode_scan_events(scanned_at);
CREATE INDEX idx_barcode_scan_events_country ON barcode_scan_events(country);
CREATE INDEX idx_barcode_scan_events_device_type ON barcode_scan_events(device_type);
CREATE INDEX idx_barcode_scan_events_visitor_id ON barcode_scan_events(visitor_id);

CREATE INDEX idx_barcode_batches_org_id ON barcode_batches(org_id);
CREATE INDEX idx_barcode_batches_status ON barcode_batches(status);

CREATE INDEX idx_barcode_campaigns_org_id ON barcode_campaigns(org_id);
CREATE INDEX idx_barcode_campaigns_status ON barcode_campaigns(status);

CREATE INDEX idx_barcode_assets_org_id ON barcode_assets(org_id);
CREATE INDEX idx_barcode_assets_barcode_id ON barcode_assets(barcode_id);

CREATE INDEX idx_barcode_shipments_org_id ON barcode_shipments(org_id);
CREATE INDEX idx_barcode_shipments_tracking_number ON barcode_shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- =====================================================
-- 15. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_barcode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barcodes_updated_at
  BEFORE UPDATE ON barcodes
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

CREATE TRIGGER barcode_folders_updated_at
  BEFORE UPDATE ON barcode_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

CREATE TRIGGER barcode_templates_updated_at
  BEFORE UPDATE ON barcode_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

CREATE TRIGGER barcode_campaigns_updated_at
  BEFORE UPDATE ON barcode_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

CREATE TRIGGER barcode_assets_updated_at
  BEFORE UPDATE ON barcode_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

CREATE TRIGGER barcode_shipments_updated_at
  BEFORE UPDATE ON barcode_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_updated_at();

-- Update barcode scan stats
CREATE OR REPLACE FUNCTION update_barcode_scan_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE barcodes
  SET 
    total_scans = total_scans + 1,
    last_scanned_at = NEW.scanned_at
  WHERE id = NEW.barcode_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barcode_scan_stats_update
  AFTER INSERT ON barcode_scan_events
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_scan_stats();

-- =====================================================
-- 16. VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE OR REPLACE VIEW barcode_performance AS
SELECT 
  b.id,
  b.org_id,
  b.name,
  b.barcode_type,
  b.content,
  b.status,
  b.total_scans,
  b.unique_scans,
  b.print_count,
  b.created_at,
  b.last_scanned_at,
  f.name as folder_name,
  t.name as template_name,
  p.name as product_name,
  p.sku as product_sku,
  COUNT(DISTINCT bse.visitor_id) as unique_visitors_7d,
  COUNT(bse.id) as scans_7d
FROM barcodes b
LEFT JOIN barcode_folders f ON b.folder_id = f.id
LEFT JOIN barcode_templates t ON b.template_id = t.id
LEFT JOIN products p ON b.product_id = p.id
LEFT JOIN barcode_scan_events bse ON b.id = bse.barcode_id 
  AND bse.scanned_at > NOW() - INTERVAL '7 days'
GROUP BY b.id, f.name, t.name, p.name, p.sku;

-- =====================================================
-- 17. SAMPLE DATA & DEFAULTS
-- =====================================================

-- Insert default templates
INSERT INTO barcode_templates (name, description, category, is_global, barcode_type, width, height)
VALUES 
  ('Standard Product', 'Standard product barcode', 'product', true, 'code128', 200, 100),
  ('Small Label', 'Compact barcode for small labels', 'product', true, 'code128', 150, 75),
  ('Shipping Label', 'Large barcode for shipping', 'shipping', true, 'code128', 300, 150),
  ('Asset Tag', 'Durable asset tracking barcode', 'asset', true, 'code39', 200, 100),
  ('Retail EAN', 'Standard retail EAN-13', 'retail', true, 'ean13', 200, 100);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE barcodes IS 'Enterprise barcode generator - v2.0.0 - BarTender/Labeljoy benchmark features';
COMMENT ON TABLE barcode_scan_events IS 'Detailed scan analytics with geo, device, and scanner tracking';
COMMENT ON TABLE barcode_templates IS 'Reusable design templates for barcodes';
COMMENT ON TABLE barcode_batches IS 'Batch generation of multiple barcodes';
COMMENT ON TABLE barcode_print_templates IS 'Print label templates for various label sizes';