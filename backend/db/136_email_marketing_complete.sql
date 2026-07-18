-- Email Marketing Module - Complete Feature Set (Mailchimp/Klaviyo benchmark)
-- Migration 136: Advanced email marketing features

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. SEGMENTATION ENGINE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  list_id UUID REFERENCES email_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]', -- Array of condition objects
  match_type TEXT NOT NULL DEFAULT 'all' CHECK (match_type IN ('all', 'any')),
  subscriber_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_segments_org ON email_segments(org_id);
CREATE INDEX idx_email_segments_list ON email_segments(list_id);

-- Segment membership cache (recalculated periodically)
CREATE TABLE IF NOT EXISTS email_segment_members (
  segment_id UUID NOT NULL REFERENCES email_segments(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (segment_id, subscriber_id)
);

CREATE INDEX idx_segment_members_subscriber ON email_segment_members(subscriber_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. AUTOMATION WORKFLOWS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'list_subscribe', 'segment_enter', 'tag_added', 'date_based',
    'api_trigger', 'form_submit', 'purchase', 'abandoned_cart',
    'birthday', 'anniversary', 'inactivity'
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  entry_count INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_automations_org ON email_automations(org_id);
CREATE INDEX idx_email_automations_status ON email_automations(status) WHERE status = 'active';

-- Automation steps (emails, delays, conditions, actions)
CREATE TABLE IF NOT EXISTS email_automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES email_automations(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'send_email', 'delay', 'condition', 'add_tag', 'remove_tag',
    'move_list', 'webhook', 'update_field'
  )),
  config JSONB NOT NULL DEFAULT '{}', -- Step-specific configuration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_steps_automation ON email_automation_steps(automation_id, step_order);

-- Track individual subscriber journeys through automations
CREATE TABLE IF NOT EXISTS email_automation_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES email_automations(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES email_automation_steps(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ, -- When next step should execute
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_automation_subs_automation ON email_automation_subscribers(automation_id);
CREATE INDEX idx_automation_subs_subscriber ON email_automation_subscribers(subscriber_id);
CREATE INDEX idx_automation_subs_next_action ON email_automation_subscribers(next_action_at) WHERE status = 'active';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ADVANCED CAMPAIGN FEATURES
-- ══════════════════════════════════════════════════════════════════════════════

-- Extend campaigns table with missing features
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES email_segments(id) ON DELETE SET NULL;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS from_name TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_to TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS track_opens BOOLEAN DEFAULT true;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS track_clicks BOOLEAN DEFAULT true;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS google_analytics BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT 'email';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT 'email';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_time_optimization BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS timezone_sending BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS resend_to_unopened BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS resend_after_hours INT;

-- A/B test results tracking (schema exists from 106, add missing fields)
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_metric TEXT CHECK (ab_test_metric IN ('open_rate', 'click_rate', 'conversion_rate'));
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_duration_hours INT DEFAULT 24;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_started_at TIMESTAMPTZ;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_completed_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. DELIVERABILITY & ENGAGEMENT TRACKING
-- ══════════════════════════════════════════════════════════════════════════════

-- Track individual email sends
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  variant TEXT, -- 'a', 'b', or NULL
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
  bounce_reason TEXT,
  unsubscribed_at TIMESTAMPTZ,
  spam_reported_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_automation ON email_sends(automation_id);
CREATE INDEX idx_email_sends_subscriber ON email_sends(subscriber_id);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at);

-- Track link clicks with detailed analytics
CREATE TABLE IF NOT EXISTS email_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  os TEXT,
  browser TEXT,
  location_country TEXT,
  location_city TEXT
);

CREATE INDEX idx_link_clicks_send ON email_link_clicks(send_id);
CREATE INDEX idx_link_clicks_url ON email_link_clicks(url);

-- Subscriber engagement scoring
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS total_opens INT DEFAULT 0;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS total_clicks INT DEFAULT 0;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS bounce_count INT DEFAULT 0;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS complaint_count INT DEFAULT 0;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. PERSONALIZATION & MERGE TAGS
-- ══════════════════════════════════════════════════════════════════════════════

-- Custom fields for subscribers (beyond name/email)
CREATE TABLE IF NOT EXISTS email_subscriber_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'url')),
  default_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, field_name)
);

CREATE INDEX idx_subscriber_fields_org ON email_subscriber_fields(org_id);

-- Subscriber field values
CREATE TABLE IF NOT EXISTS email_subscriber_field_values (
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES email_subscriber_fields(id) ON DELETE CASCADE,
  value TEXT,
  PRIMARY KEY (subscriber_id, field_id)
);

CREATE INDEX idx_subscriber_field_values_field ON email_subscriber_field_values(field_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. EMAIL TEMPLATES & CONTENT BLOCKS
-- ══════════════════════════════════════════════════════════════════════════════

-- Reusable content blocks
CREATE TABLE IF NOT EXISTS email_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'header', 'footer', 'hero', 'text', 'image', 'button',
    'social', 'divider', 'spacer', 'columns', 'product'
  )),
  content_html TEXT NOT NULL,
  content_json JSONB, -- Structured representation for drag-and-drop builder
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_blocks_org ON email_content_blocks(org_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. TRANSACTIONAL EMAIL
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_transactional_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL, -- e.g., 'order_confirmation', 'password_reset'
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, template_key)
);

CREATE INDEX idx_transactional_templates_org ON email_transactional_templates(org_id);

-- Transactional email log
CREATE TABLE IF NOT EXISTS email_transactional_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_transactional_templates(id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactional_log_org ON email_transactional_log(org_id);
CREATE INDEX idx_transactional_log_template ON email_transactional_log(template_id);
CREATE INDEX idx_transactional_log_sent_at ON email_transactional_log(sent_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RSS-TO-EMAIL
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_rss_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  list_id UUID REFERENCES email_lists(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES email_segments(id) ON DELETE SET NULL,
  subject_template TEXT NOT NULL, -- e.g., "{{feed_title}}: {{item_title}}"
  body_template TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'on_new_item')),
  send_time TIME, -- Time of day to send (for scheduled frequencies)
  send_day INT, -- Day of week (1-7) or month (1-31)
  last_sent_at TIMESTAMPTZ,
  last_item_date TIMESTAMPTZ, -- Track last processed item to avoid duplicates
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rss_campaigns_org ON email_rss_campaigns(org_id);
CREATE INDEX idx_rss_campaigns_status ON email_rss_campaigns(status) WHERE status = 'active';

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. LIST HYGIENE & VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- Email verification results
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('verified', 'invalid', 'risky', 'unknown'));
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS verification_reason TEXT;

-- List cleaning history
CREATE TABLE IF NOT EXISTS email_list_cleaning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  list_id UUID REFERENCES email_lists(id) ON DELETE CASCADE,
  cleaned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_count INT DEFAULT 0,
  reason TEXT NOT NULL CHECK (reason IN (
    'hard_bounce', 'soft_bounce_threshold', 'complaint', 'invalid_email',
    'inactive', 'duplicate', 'manual'
  )),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_list_cleaning_org ON email_list_cleaning_log(org_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. ANALYTICS & REPORTING
-- ══════════════════════════════════════════════════════════════════════════════

-- Campaign performance snapshots (for historical reporting)
CREATE TABLE IF NOT EXISTS email_campaign_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  recipients INT DEFAULT 0,
  delivered INT DEFAULT 0,
  opens INT DEFAULT 0,
  unique_opens INT DEFAULT 0,
  clicks INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  bounces INT DEFAULT 0,
  complaints INT DEFAULT 0,
  unsubscribes INT DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  click_to_open_rate NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, snapshot_date)
);

CREATE INDEX idx_campaign_snapshots_campaign ON email_campaign_snapshots(campaign_id);
CREATE INDEX idx_campaign_snapshots_date ON email_campaign_snapshots(snapshot_date);

-- Heatmap data for email clicks
CREATE TABLE IF NOT EXISTS email_click_heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL, -- HTML element ID or data-track-id
  click_count INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, element_id)
);

CREATE INDEX idx_click_heatmaps_campaign ON email_click_heatmaps(campaign_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 11. SUBSCRIBER PREFERENCES & CONSENT
-- ══════════════════════════════════════════════════════════════════════════════

-- Subscriber communication preferences
CREATE TABLE IF NOT EXISTS email_subscriber_preferences (
  subscriber_id UUID PRIMARY KEY REFERENCES email_subscribers(id) ON DELETE CASCADE,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'never')),
  topics TEXT[], -- Array of topic preferences
  html_emails BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GDPR consent tracking (enhanced from migration 123)
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS consent_ip INET;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS consent_user_agent TEXT;
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS consent_method TEXT CHECK (consent_method IN ('form', 'api', 'import', 'manual'));
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS double_optin_completed BOOLEAN DEFAULT false;

-- ══════════════════════════════════════════════════════════════════════════════
-- 12. PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_subscribers_engagement ON email_subscribers(engagement_score DESC) WHERE status = 'subscribed';
CREATE INDEX IF NOT EXISTS idx_subscribers_last_opened ON email_subscribers(last_opened_at DESC) WHERE status = 'subscribed';
CREATE INDEX IF NOT EXISTS idx_campaigns_sent_at ON email_campaigns(sent_at DESC) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_sends_opened ON email_sends(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sends_clicked ON email_sends(clicked_at) WHERE clicked_at IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE email_segments IS 'Dynamic subscriber segments based on conditions';
COMMENT ON TABLE email_automations IS 'Automated email workflows triggered by events';
COMMENT ON TABLE email_sends IS 'Individual email send tracking for deliverability analytics';
COMMENT ON TABLE email_transactional_templates IS 'Transactional email templates (order confirmations, password resets, etc.)';
COMMENT ON TABLE email_rss_campaigns IS 'Automated campaigns from RSS feeds';
