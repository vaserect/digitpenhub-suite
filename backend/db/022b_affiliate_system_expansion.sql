-- Milestone 22b: Affiliate System Expansion
-- Adds comprehensive affiliate tracking, payouts, materials, and fraud detection

-- ============================================================================
-- TRACKING LINKS
-- ============================================================================
CREATE TABLE affiliate_tracking_links (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id    UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_code       TEXT        NOT NULL, -- Short unique code (e.g., "ABC123")
  destination_url TEXT        NOT NULL,
  campaign_name   TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, link_code)
);

CREATE INDEX affiliate_tracking_links_org_idx ON affiliate_tracking_links (org_id);
CREATE INDEX affiliate_tracking_links_affiliate_idx ON affiliate_tracking_links (affiliate_id);
CREATE INDEX affiliate_tracking_links_code_idx ON affiliate_tracking_links (link_code);

-- ============================================================================
-- CLICK TRACKING
-- ============================================================================
CREATE TABLE affiliate_clicks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id  UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_id       UUID        REFERENCES affiliate_tracking_links(id) ON DELETE SET NULL,
  ip_address    INET,
  user_agent    TEXT,
  referrer      TEXT,
  country_code  TEXT,
  device_type   TEXT        CHECK (device_type IN ('desktop','mobile','tablet','unknown')),
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_clicks_affiliate_idx ON affiliate_clicks (affiliate_id, clicked_at DESC);
CREATE INDEX affiliate_clicks_org_date_idx ON affiliate_clicks (org_id, clicked_at DESC);
CREATE INDEX affiliate_clicks_link_idx ON affiliate_clicks (link_id);

-- ============================================================================
-- PAYOUT BATCHES
-- ============================================================================
CREATE TABLE affiliate_payout_batches (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_name        TEXT        NOT NULL,
  total_amount_ngn  BIGINT      NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','completed','failed')),
  payment_method    TEXT        CHECK (payment_method IN ('bank_transfer','paypal','stripe','manual')),
  payment_reference TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at      TIMESTAMPTZ
);

CREATE INDEX affiliate_payout_batches_org_idx ON affiliate_payout_batches (org_id);
CREATE INDEX affiliate_payout_batches_status_idx ON affiliate_payout_batches (org_id, status);

-- ============================================================================
-- PAYOUT ITEMS
-- ============================================================================
CREATE TABLE affiliate_payout_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_id       UUID        NOT NULL REFERENCES affiliate_payout_batches(id) ON DELETE CASCADE,
  affiliate_id   UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  conversion_ids UUID[],     -- Array of conversion IDs included in this payout
  amount_ngn     BIGINT      NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','failed')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_payout_items_batch_idx ON affiliate_payout_items (batch_id);
CREATE INDEX affiliate_payout_items_affiliate_idx ON affiliate_payout_items (affiliate_id);
CREATE INDEX affiliate_payout_items_org_idx ON affiliate_payout_items (org_id);

-- ============================================================================
-- MARKETING MATERIALS
-- ============================================================================
CREATE TABLE affiliate_marketing_materials (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  description    TEXT,
  material_type  TEXT        NOT NULL
                   CHECK (material_type IN ('banner','email','social','video','landing_page','document')),
  file_url       TEXT,
  thumbnail_url  TEXT,
  dimensions     TEXT,       -- e.g., "300x250" for banners
  file_size      BIGINT,     -- in bytes
  download_count INT         NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_marketing_materials_org_idx ON affiliate_marketing_materials (org_id);
CREATE INDEX affiliate_marketing_materials_type_idx ON affiliate_marketing_materials (org_id, material_type);
CREATE INDEX affiliate_marketing_materials_active_idx ON affiliate_marketing_materials (org_id, is_active);

-- ============================================================================
-- COMMISSION TIERS
-- ============================================================================
CREATE TABLE affiliate_commission_tiers (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_name        TEXT           NOT NULL,
  tier_level       INT            NOT NULL DEFAULT 1,
  min_conversions  INT            NOT NULL DEFAULT 0,
  min_revenue_ngn  BIGINT         NOT NULL DEFAULT 0,
  commission_type  TEXT           NOT NULL DEFAULT 'percentage'
                     CHECK (commission_type IN ('percentage','flat')),
  commission_value NUMERIC(10,2)  NOT NULL,
  bonus_amount_ngn BIGINT         NOT NULL DEFAULT 0,
  is_active        BOOLEAN        NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (org_id, tier_level)
);

CREATE INDEX affiliate_commission_tiers_org_idx ON affiliate_commission_tiers (org_id);
CREATE INDEX affiliate_commission_tiers_level_idx ON affiliate_commission_tiers (org_id, tier_level);

-- ============================================================================
-- FRAUD ALERTS
-- ============================================================================
CREATE TABLE affiliate_fraud_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  alert_type   TEXT        NOT NULL
                 CHECK (alert_type IN ('suspicious_clicks','duplicate_conversions','invalid_traffic','unusual_pattern','high_refund_rate','bot_traffic')),
  severity     TEXT        NOT NULL DEFAULT 'medium'
                 CHECK (severity IN ('low','medium','high','critical')),
  description  TEXT,
  metadata     JSONB,      -- Additional context data
  is_resolved  BOOLEAN     NOT NULL DEFAULT false,
  resolved_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_fraud_alerts_org_idx ON affiliate_fraud_alerts (org_id);
CREATE INDEX affiliate_fraud_alerts_affiliate_idx ON affiliate_fraud_alerts (affiliate_id);
CREATE INDEX affiliate_fraud_alerts_unresolved_idx ON affiliate_fraud_alerts (org_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX affiliate_fraud_alerts_severity_idx ON affiliate_fraud_alerts (org_id, severity);

-- ============================================================================
-- PERFORMANCE CACHE
-- ============================================================================
CREATE TABLE affiliate_performance_cache (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id          UUID           NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  period_start          DATE           NOT NULL,
  period_end            DATE           NOT NULL,
  total_clicks          INT            NOT NULL DEFAULT 0,
  total_conversions     INT            NOT NULL DEFAULT 0,
  total_revenue_ngn     BIGINT         NOT NULL DEFAULT 0,
  total_commission_ngn  BIGINT         NOT NULL DEFAULT 0,
  conversion_rate       NUMERIC(5,2)   NOT NULL DEFAULT 0,
  avg_order_value_ngn   BIGINT         NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (org_id, affiliate_id, period_start, period_end)
);

CREATE INDEX affiliate_performance_cache_org_idx ON affiliate_performance_cache (org_id);
CREATE INDEX affiliate_performance_cache_affiliate_idx ON affiliate_performance_cache (affiliate_id);
CREATE INDEX affiliate_performance_cache_period_idx ON affiliate_performance_cache (org_id, period_start, period_end);

-- ============================================================================
-- ENHANCEMENTS TO EXISTING TABLES
-- ============================================================================

-- Add tier tracking to affiliates table
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS current_tier_id UUID REFERENCES affiliate_commission_tiers(id) ON DELETE SET NULL;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMPTZ;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS lifetime_conversions INT NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS lifetime_revenue_ngn BIGINT NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS lifetime_commission_ngn BIGINT NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS last_conversion_at TIMESTAMPTZ;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('bank_transfer','paypal','stripe','manual'));
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payment_details JSONB; -- Bank account, PayPal email, etc.
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS cookie_duration_days INT NOT NULL DEFAULT 30;

-- Add more tracking to conversions table
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES affiliate_tracking_links(id) ON DELETE SET NULL;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE affiliate_conversions ADD COLUMN IF NOT EXISTS payout_item_id UUID REFERENCES affiliate_payout_items(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS affiliates_tier_idx ON affiliates (org_id, current_tier_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_click_idx ON affiliate_conversions (click_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_link_idx ON affiliate_conversions (link_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_payout_idx ON affiliate_conversions (payout_item_id);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update affiliate lifetime stats
CREATE OR REPLACE FUNCTION update_affiliate_lifetime_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
    
    UPDATE affiliates
    SET 
      lifetime_conversions = lifetime_conversions + 1,
      lifetime_revenue_ngn = lifetime_revenue_ngn + NEW.amount_ngn,
      lifetime_commission_ngn = lifetime_commission_ngn + NEW.commission_ngn,
      last_conversion_at = NEW.conversion_date
    WHERE id = NEW.affiliate_id;
    
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved') THEN
    
    UPDATE affiliates
    SET 
      lifetime_conversions = GREATEST(0, lifetime_conversions - 1),
      lifetime_revenue_ngn = GREATEST(0, lifetime_revenue_ngn - OLD.amount_ngn),
      lifetime_commission_ngn = GREATEST(0, lifetime_commission_ngn - OLD.commission_ngn)
    WHERE id = OLD.affiliate_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for affiliate lifetime stats
DROP TRIGGER IF EXISTS trigger_update_affiliate_lifetime_stats ON affiliate_conversions;
CREATE TRIGGER trigger_update_affiliate_lifetime_stats
  AFTER INSERT OR UPDATE ON affiliate_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_lifetime_stats();

-- Function to update material download count
CREATE OR REPLACE FUNCTION increment_material_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE affiliate_marketing_materials
  SET download_count = download_count + 1
  WHERE id = NEW.material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger will be created when we add material_downloads tracking table in future

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert default commission tiers (commented out - org-specific)
-- INSERT INTO affiliate_commission_tiers (org_id, tier_name, tier_level, min_conversions, min_revenue_ngn, commission_type, commission_value)
-- VALUES 
--   ('org-uuid-here', 'Bronze', 1, 0, 0, 'percentage', 10.00),
--   ('org-uuid-here', 'Silver', 2, 10, 100000000, 'percentage', 15.00),
--   ('org-uuid-here', 'Gold', 3, 50, 500000000, 'percentage', 20.00),
--   ('org-uuid-here', 'Platinum', 4, 100, 1000000000, 'percentage', 25.00);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE affiliate_tracking_links IS 'Unique tracking URLs for each affiliate';
COMMENT ON TABLE affiliate_clicks IS 'Click tracking and analytics for affiliate links';
COMMENT ON TABLE affiliate_payout_batches IS 'Batch processing of affiliate payouts';
COMMENT ON TABLE affiliate_payout_items IS 'Individual payout line items per affiliate';
COMMENT ON TABLE affiliate_marketing_materials IS 'Marketing materials library for affiliates';
COMMENT ON TABLE affiliate_commission_tiers IS 'Multi-tier commission structures';
COMMENT ON TABLE affiliate_fraud_alerts IS 'Fraud detection and prevention alerts';
COMMENT ON TABLE affiliate_performance_cache IS 'Cached performance metrics for fast dashboard loading';

COMMENT ON COLUMN affiliate_tracking_links.link_code IS 'Short unique code used in tracking URLs (e.g., /track/ABC123)';
COMMENT ON COLUMN affiliate_clicks.device_type IS 'Device type: desktop, mobile, tablet, or unknown';
COMMENT ON COLUMN affiliate_payout_batches.status IS 'Batch status: pending, processing, completed, or failed';
COMMENT ON COLUMN affiliate_marketing_materials.material_type IS 'Type: banner, email, social, video, landing_page, or document';
COMMENT ON COLUMN affiliate_commission_tiers.tier_level IS 'Tier level (1=lowest, higher=better)';
COMMENT ON COLUMN affiliate_fraud_alerts.alert_type IS 'Type: suspicious_clicks, duplicate_conversions, invalid_traffic, unusual_pattern, high_refund_rate, bot_traffic';
COMMENT ON COLUMN affiliate_fraud_alerts.severity IS 'Severity: low, medium, high, or critical';
COMMENT ON COLUMN affiliates.cookie_duration_days IS 'Number of days to track conversions after click (default 30)';
COMMENT ON COLUMN affiliates.payment_details IS 'JSON object with payment details (bank account, PayPal email, etc.)';
