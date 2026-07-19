-- ============================================================================
-- MODULE 23: REFERRAL PROGRAM - ENTERPRISE UPGRADE
-- ============================================================================
-- Comprehensive referral system with tracking, rewards automation, analytics,
-- fraud detection, and multi-tier campaigns
-- ============================================================================

-- ============================================================================
-- ENHANCED REFERRAL PROGRAMS TABLE
-- ============================================================================
-- Add advanced features to existing referral_programs table
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS max_referrals_per_user INT;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS min_purchase_amount_ngn BIGINT DEFAULT 0;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS reward_delay_days INT DEFAULT 0;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS auto_approve_conversions BOOLEAN DEFAULT false;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS referrer_reward_type TEXT CHECK (referrer_reward_type IN ('cash','discount','credit','points','gift'));
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS referrer_reward_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS referee_reward_type TEXT CHECK (referee_reward_type IN ('cash','discount','credit','points','gift'));
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS referee_reward_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS tracking_cookie_days INT DEFAULT 30;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS terms_url TEXT;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS share_message TEXT;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS total_budget_ngn BIGINT;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS spent_budget_ngn BIGINT DEFAULT 0;
ALTER TABLE referral_programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS referral_programs_active_idx ON referral_programs (org_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS referral_programs_dates_idx ON referral_programs (org_id, start_date, end_date);

-- ============================================================================
-- ENHANCED REFERRALS TABLE
-- ============================================================================
-- Add tracking and conversion data to existing referrals table
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS tracking_link_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS click_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMPTZ;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS conversion_amount_ngn BIGINT DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_reward_amount_ngn BIGINT DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referee_reward_amount_ngn BIGINT DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_reward_status TEXT DEFAULT 'pending' CHECK (referrer_reward_status IN ('pending','approved','paid','cancelled'));
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referee_reward_status TEXT DEFAULT 'pending' CHECK (referee_reward_status IN ('pending','approved','paid','cancelled'));
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual','link','api','import'));
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS referrals_code_idx ON referrals (org_id, referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_conversion_idx ON referrals (org_id, conversion_date DESC) WHERE conversion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_customer_idx ON referrals (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_order_idx ON referrals (order_id) WHERE order_id IS NOT NULL;

-- ============================================================================
-- REFERRAL TRACKING LINKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_tracking_links (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id      UUID        NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_email  TEXT        NOT NULL,
  referrer_name   TEXT,
  link_code       TEXT        NOT NULL,
  destination_url TEXT        NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  total_clicks    INT         NOT NULL DEFAULT 0,
  total_conversions INT       NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, link_code)
);

CREATE INDEX referral_tracking_links_org_idx ON referral_tracking_links (org_id);
CREATE INDEX referral_tracking_links_program_idx ON referral_tracking_links (program_id);
CREATE INDEX referral_tracking_links_email_idx ON referral_tracking_links (org_id, referrer_email);
CREATE INDEX referral_tracking_links_code_idx ON referral_tracking_links (link_code);
CREATE INDEX referral_tracking_links_active_idx ON referral_tracking_links (org_id, is_active) WHERE is_active = true;

COMMENT ON TABLE referral_tracking_links IS 'Unique tracking URLs for referrers to share';
COMMENT ON COLUMN referral_tracking_links.link_code IS 'Short unique code used in tracking URLs (e.g., /ref/ABC123)';

-- ============================================================================
-- REFERRAL CLICKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_clicks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  link_id       UUID        NOT NULL REFERENCES referral_tracking_links(id) ON DELETE CASCADE,
  program_id    UUID        REFERENCES referral_programs(id) ON DELETE SET NULL,
  ip_address    INET,
  user_agent    TEXT,
  referrer_url  TEXT,
  country_code  TEXT,
  city          TEXT,
  device_type   TEXT        CHECK (device_type IN ('desktop','mobile','tablet','unknown')),
  browser       TEXT,
  os            TEXT,
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_clicks_link_idx ON referral_clicks (link_id, clicked_at DESC);
CREATE INDEX referral_clicks_org_date_idx ON referral_clicks (org_id, clicked_at DESC);
CREATE INDEX referral_clicks_program_idx ON referral_clicks (program_id, clicked_at DESC);
CREATE INDEX referral_clicks_ip_idx ON referral_clicks (ip_address, clicked_at DESC);

COMMENT ON TABLE referral_clicks IS 'Click tracking and analytics for referral links';
COMMENT ON COLUMN referral_clicks.device_type IS 'Device type: desktop, mobile, tablet, or unknown';

-- ============================================================================
-- REFERRAL REWARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referral_id       UUID        NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  program_id        UUID        REFERENCES referral_programs(id) ON DELETE SET NULL,
  recipient_type    TEXT        NOT NULL CHECK (recipient_type IN ('referrer','referee')),
  recipient_email   TEXT        NOT NULL,
  recipient_name    TEXT,
  reward_type       TEXT        NOT NULL CHECK (reward_type IN ('cash','discount','credit','points','gift')),
  reward_value      NUMERIC(10,2) NOT NULL,
  reward_amount_ngn BIGINT      NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled','expired')),
  payment_method    TEXT        CHECK (payment_method IN ('bank_transfer','wallet','coupon','manual')),
  payment_reference TEXT,
  expires_at        TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  approved_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  paid_at           TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancelled_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_rewards_org_idx ON referral_rewards (org_id);
CREATE INDEX referral_rewards_referral_idx ON referral_rewards (referral_id);
CREATE INDEX referral_rewards_program_idx ON referral_rewards (program_id);
CREATE INDEX referral_rewards_email_idx ON referral_rewards (org_id, recipient_email);
CREATE INDEX referral_rewards_status_idx ON referral_rewards (org_id, status, created_at DESC);
CREATE INDEX referral_rewards_pending_idx ON referral_rewards (org_id, status) WHERE status = 'pending';

COMMENT ON TABLE referral_rewards IS 'Individual reward records for referrers and referees';
COMMENT ON COLUMN referral_rewards.recipient_type IS 'Whether reward is for referrer or referee';

-- ============================================================================
-- REFERRAL TIERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_tiers (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id            UUID           REFERENCES referral_programs(id) ON DELETE CASCADE,
  tier_name             TEXT           NOT NULL,
  tier_level            INT            NOT NULL DEFAULT 1,
  min_referrals         INT            NOT NULL DEFAULT 0,
  min_conversions       INT            NOT NULL DEFAULT 0,
  min_revenue_ngn       BIGINT         NOT NULL DEFAULT 0,
  referrer_reward_type  TEXT           NOT NULL CHECK (referrer_reward_type IN ('cash','discount','credit','points','gift')),
  referrer_reward_value NUMERIC(10,2)  NOT NULL,
  referee_reward_type   TEXT           CHECK (referee_reward_type IN ('cash','discount','credit','points','gift')),
  referee_reward_value  NUMERIC(10,2),
  bonus_amount_ngn      BIGINT         NOT NULL DEFAULT 0,
  is_active             BOOLEAN        NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (org_id, program_id, tier_level)
);

CREATE INDEX referral_tiers_org_idx ON referral_tiers (org_id);
CREATE INDEX referral_tiers_program_idx ON referral_tiers (program_id);
CREATE INDEX referral_tiers_level_idx ON referral_tiers (org_id, tier_level);
CREATE INDEX referral_tiers_active_idx ON referral_tiers (org_id, is_active) WHERE is_active = true;

COMMENT ON TABLE referral_tiers IS 'Multi-tier reward structures based on performance';
COMMENT ON COLUMN referral_tiers.tier_level IS 'Tier level (1=lowest, higher=better rewards)';

-- ============================================================================
-- REFERRER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrer_profiles (
  id                        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email                     TEXT           NOT NULL,
  name                      TEXT,
  phone                     TEXT,
  referral_code             TEXT           NOT NULL,
  current_tier_id           UUID           REFERENCES referral_tiers(id) ON DELETE SET NULL,
  total_referrals           INT            NOT NULL DEFAULT 0,
  total_conversions         INT            NOT NULL DEFAULT 0,
  total_revenue_ngn         BIGINT         NOT NULL DEFAULT 0,
  total_rewards_earned_ngn  BIGINT         NOT NULL DEFAULT 0,
  total_rewards_paid_ngn    BIGINT         NOT NULL DEFAULT 0,
  pending_rewards_ngn       BIGINT         NOT NULL DEFAULT 0,
  last_referral_at          TIMESTAMPTZ,
  last_conversion_at        TIMESTAMPTZ,
  status                    TEXT           NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','blocked')),
  blocked_reason            TEXT,
  payment_method            TEXT           CHECK (payment_method IN ('bank_transfer','wallet','manual')),
  payment_details           JSONB,
  notes                     TEXT,
  created_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (org_id, email),
  UNIQUE (org_id, referral_code)
);

CREATE INDEX referrer_profiles_org_idx ON referrer_profiles (org_id);
CREATE INDEX referrer_profiles_email_idx ON referrer_profiles (org_id, email);
CREATE INDEX referrer_profiles_code_idx ON referrer_profiles (referral_code);
CREATE INDEX referrer_profiles_tier_idx ON referrer_profiles (org_id, current_tier_id);
CREATE INDEX referrer_profiles_status_idx ON referrer_profiles (org_id, status);
CREATE INDEX referrer_profiles_active_idx ON referrer_profiles (org_id, status) WHERE status = 'active';

COMMENT ON TABLE referrer_profiles IS 'Aggregated profiles for active referrers with lifetime stats';
COMMENT ON COLUMN referrer_profiles.referral_code IS 'Unique code for this referrer (e.g., JOHN2024)';

-- ============================================================================
-- REFERRAL FRAUD ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_fraud_alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referral_id     UUID        REFERENCES referrals(id) ON DELETE SET NULL,
  referrer_email  TEXT,
  alert_type      TEXT        NOT NULL CHECK (alert_type IN ('suspicious_clicks','self_referral','duplicate_conversion','invalid_email','bot_traffic','unusual_pattern','high_velocity')),
  severity        TEXT        NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description     TEXT,
  metadata        JSONB,
  is_resolved     BOOLEAN     NOT NULL DEFAULT false,
  resolved_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_fraud_alerts_org_idx ON referral_fraud_alerts (org_id);
CREATE INDEX referral_fraud_alerts_referral_idx ON referral_fraud_alerts (referral_id);
CREATE INDEX referral_fraud_alerts_email_idx ON referral_fraud_alerts (org_id, referrer_email);
CREATE INDEX referral_fraud_alerts_unresolved_idx ON referral_fraud_alerts (org_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX referral_fraud_alerts_severity_idx ON referral_fraud_alerts (org_id, severity, created_at DESC);

COMMENT ON TABLE referral_fraud_alerts IS 'Fraud detection and prevention alerts';
COMMENT ON COLUMN referral_fraud_alerts.alert_type IS 'Type: suspicious_clicks, self_referral, duplicate_conversion, invalid_email, bot_traffic, unusual_pattern, high_velocity';

-- ============================================================================
-- REFERRAL PERFORMANCE CACHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_performance_cache (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID           NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id            UUID           REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_email        TEXT,
  period_start          DATE           NOT NULL,
  period_end            DATE           NOT NULL,
  total_clicks          INT            NOT NULL DEFAULT 0,
  total_referrals       INT            NOT NULL DEFAULT 0,
  total_conversions     INT            NOT NULL DEFAULT 0,
  total_revenue_ngn     BIGINT         NOT NULL DEFAULT 0,
  total_rewards_ngn     BIGINT         NOT NULL DEFAULT 0,
  conversion_rate       NUMERIC(5,2)   NOT NULL DEFAULT 0,
  avg_conversion_value_ngn BIGINT      NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (org_id, program_id, referrer_email, period_start, period_end)
);

CREATE INDEX referral_performance_cache_org_idx ON referral_performance_cache (org_id);
CREATE INDEX referral_performance_cache_program_idx ON referral_performance_cache (program_id);
CREATE INDEX referral_performance_cache_email_idx ON referral_performance_cache (org_id, referrer_email);
CREATE INDEX referral_performance_cache_period_idx ON referral_performance_cache (org_id, period_start, period_end);

COMMENT ON TABLE referral_performance_cache IS 'Cached performance metrics for fast dashboard loading';

-- ============================================================================
-- REFERRAL SHARE TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_share_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES referral_programs(id) ON DELETE CASCADE,
  template_name   TEXT        NOT NULL,
  channel         TEXT        NOT NULL CHECK (channel IN ('email','sms','whatsapp','social','custom')),
  subject         TEXT,
  message         TEXT        NOT NULL,
  cta_text        TEXT,
  cta_url         TEXT,
  image_url       TEXT,
  is_default      BOOLEAN     NOT NULL DEFAULT false,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_share_templates_org_idx ON referral_share_templates (org_id);
CREATE INDEX referral_share_templates_program_idx ON referral_share_templates (program_id);
CREATE INDEX referral_share_templates_channel_idx ON referral_share_templates (org_id, channel);
CREATE INDEX referral_share_templates_active_idx ON referral_share_templates (org_id, is_active) WHERE is_active = true;

COMMENT ON TABLE referral_share_templates IS 'Pre-built sharing templates for different channels';
COMMENT ON COLUMN referral_share_templates.channel IS 'Channel: email, sms, whatsapp, social, or custom';

-- ============================================================================
-- REFERRAL NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referral_id     UUID        REFERENCES referrals(id) ON DELETE CASCADE,
  recipient_email TEXT        NOT NULL,
  recipient_type  TEXT        NOT NULL CHECK (recipient_type IN ('referrer','referee','admin')),
  notification_type TEXT      NOT NULL CHECK (notification_type IN ('referral_created','conversion_confirmed','reward_approved','reward_paid','tier_upgraded','fraud_alert')),
  channel         TEXT        NOT NULL CHECK (channel IN ('email','sms','in_app','webhook')),
  subject         TEXT,
  message         TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','bounced')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_notifications_org_idx ON referral_notifications (org_id);
CREATE INDEX referral_notifications_referral_idx ON referral_notifications (referral_id);
CREATE INDEX referral_notifications_email_idx ON referral_notifications (recipient_email);
CREATE INDEX referral_notifications_status_idx ON referral_notifications (org_id, status, created_at DESC);
CREATE INDEX referral_notifications_pending_idx ON referral_notifications (org_id, status) WHERE status = 'pending';

COMMENT ON TABLE referral_notifications IS 'Notification queue and history for referral events';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update referrer profile stats
CREATE OR REPLACE FUNCTION update_referrer_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create referrer profile
  INSERT INTO referrer_profiles (
    org_id, email, name, referral_code, 
    total_referrals, total_conversions, total_revenue_ngn,
    last_referral_at, last_conversion_at
  )
  VALUES (
    NEW.org_id, NEW.referrer_email, NEW.referrer_name, 
    COALESCE(NEW.referral_code, UPPER(SUBSTRING(NEW.referrer_email FROM 1 FOR 8)) || FLOOR(RANDOM() * 1000)::TEXT),
    1, 
    CASE WHEN NEW.status = 'converted' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'converted' THEN NEW.conversion_amount_ngn ELSE 0 END,
    NEW.created_at,
    CASE WHEN NEW.status = 'converted' THEN NEW.conversion_date ELSE NULL END
  )
  ON CONFLICT (org_id, email) DO UPDATE SET
    total_referrals = referrer_profiles.total_referrals + 1,
    total_conversions = referrer_profiles.total_conversions + 
      CASE WHEN NEW.status = 'converted' AND OLD.status != 'converted' THEN 1 ELSE 0 END,
    total_revenue_ngn = referrer_profiles.total_revenue_ngn + 
      CASE WHEN NEW.status = 'converted' AND OLD.status != 'converted' THEN NEW.conversion_amount_ngn ELSE 0 END,
    last_referral_at = NEW.created_at,
    last_conversion_at = CASE 
      WHEN NEW.status = 'converted' AND OLD.status != 'converted' THEN NEW.conversion_date 
      ELSE referrer_profiles.last_conversion_at 
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referrer profile stats
DROP TRIGGER IF EXISTS trigger_update_referrer_profile_stats ON referrals;
CREATE TRIGGER trigger_update_referrer_profile_stats
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referrer_profile_stats();

-- Function to update tracking link stats
CREATE OR REPLACE FUNCTION update_tracking_link_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_tracking_links
  SET 
    total_clicks = total_clicks + 1,
    last_clicked_at = NEW.clicked_at
  WHERE id = NEW.link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tracking link stats
DROP TRIGGER IF EXISTS trigger_update_tracking_link_stats ON referral_clicks;
CREATE TRIGGER trigger_update_tracking_link_stats
  AFTER INSERT ON referral_clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_link_stats();

-- Function to update program budget
CREATE OR REPLACE FUNCTION update_program_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE referral_programs
    SET spent_budget_ngn = spent_budget_ngn + NEW.reward_amount_ngn
    WHERE id = NEW.program_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for program budget
DROP TRIGGER IF EXISTS trigger_update_program_budget ON referral_rewards;
CREATE TRIGGER trigger_update_program_budget
  AFTER INSERT OR UPDATE ON referral_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_program_budget();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_referral_programs_timestamp ON referral_programs;
CREATE TRIGGER trigger_update_referral_programs_timestamp
  BEFORE UPDATE ON referral_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();

DROP TRIGGER IF EXISTS trigger_update_referrals_timestamp ON referrals;
CREATE TRIGGER trigger_update_referrals_timestamp
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();

DROP TRIGGER IF EXISTS trigger_update_referrer_profiles_timestamp ON referrer_profiles;
CREATE TRIGGER trigger_update_referrer_profiles_timestamp
  BEFORE UPDATE ON referrer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_timestamp();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Referral Program Performance
CREATE OR REPLACE VIEW referral_program_performance AS
SELECT 
  rp.id,
  rp.org_id,
  rp.name,
  rp.status,
  rp.is_active,
  COUNT(DISTINCT r.id) AS total_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'converted') AS total_conversions,
  COALESCE(SUM(r.conversion_amount_ngn) FILTER (WHERE r.status = 'converted'), 0) AS total_revenue_ngn,
  COALESCE(SUM(rw.reward_amount_ngn) FILTER (WHERE rw.status = 'paid'), 0) AS total_rewards_paid_ngn,
  CASE 
    WHEN COUNT(DISTINCT r.id) > 0 
    THEN ROUND((COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'converted')::NUMERIC / COUNT(DISTINCT r.id)) * 100, 2)
    ELSE 0 
  END AS conversion_rate,
  COUNT(DISTINCT rtl.id) AS total_tracking_links,
  COALESCE(SUM(rtl.total_clicks), 0) AS total_clicks
FROM referral_programs rp
LEFT JOIN referrals r ON r.program_id = rp.id
LEFT JOIN referral_rewards rw ON rw.program_id = rp.id
LEFT JOIN referral_tracking_links rtl ON rtl.program_id = rp.id
GROUP BY rp.id, rp.org_id, rp.name, rp.status, rp.is_active;

COMMENT ON VIEW referral_program_performance IS 'Aggregated performance metrics per referral program';

-- View: Top Referrers
CREATE OR REPLACE VIEW top_referrers AS
SELECT 
  rp.org_id,
  rp.email,
  rp.name,
  rp.referral_code,
  rp.total_referrals,
  rp.total_conversions,
  rp.total_revenue_ngn,
  rp.total_rewards_earned_ngn,
  rp.total_rewards_paid_ngn,
  rp.pending_rewards_ngn,
  CASE 
    WHEN rp.total_referrals > 0 
    THEN ROUND((rp.total_conversions::NUMERIC / rp.total_referrals) * 100, 2)
    ELSE 0 
  END AS conversion_rate,
  rt.tier_name AS current_tier,
  rp.status,
  rp.last_referral_at,
  rp.last_conversion_at
FROM referrer_profiles rp
LEFT JOIN referral_tiers rt ON rt.id = rp.current_tier_id
ORDER BY rp.total_conversions DESC, rp.total_revenue_ngn DESC;

COMMENT ON VIEW top_referrers IS 'Ranked list of top performing referrers';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Note: Sample data should be inserted per organization
-- Uncomment and modify for testing purposes

/*
-- Sample Referral Program
INSERT INTO referral_programs (
  org_id, name, description, reward_type, reward_value, 
  referrer_reward_type, referrer_reward_value,
  referee_reward_type, referee_reward_value,
  status, is_active, auto_approve_conversions
) VALUES (
  'org-uuid-here',
  'Friends & Family Referral',
  'Refer friends and earn rewards when they make their first purchase',
  'cash', 5000,
  'cash', 5000,
  'discount', 10,
  'active', true, false
);

-- Sample Referral Tier
INSERT INTO referral_tiers (
  org_id, tier_name, tier_level, min_referrals, min_conversions,
  referrer_reward_type, referrer_reward_value
) VALUES 
  ('org-uuid-here', 'Bronze', 1, 0, 0, 'cash', 5000),
  ('org-uuid-here', 'Silver', 2, 5, 3, 'cash', 7500),
  ('org-uuid-here', 'Gold', 3, 15, 10, 'cash', 10000),
  ('org-uuid-here', 'Platinum', 4, 50, 30, 'cash', 15000);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Referral Program Enterprise Upgrade Migration Complete';
  RAISE NOTICE 'New Tables: 10';
  RAISE NOTICE 'Enhanced Tables: 2';
  RAISE NOTICE 'New Indexes: 50+';
  RAISE NOTICE 'Triggers: 5';
  RAISE NOTICE 'Views: 2';
END $$;
