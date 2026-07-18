-- ══════════════════════════════════════════════════════════════════════════════
-- SMS Marketing Complete Implementation
-- Benchmark: Attentive / SimpleTexting
-- Migration: 137
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Extend sms_contacts with engagement & compliance fields ──────────────

ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS opt_in_method TEXT CHECK (opt_in_method IN ('manual','form','api','keyword','imported'));
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS opt_in_date TIMESTAMPTZ;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS opt_in_ip TEXT;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS double_opt_in BOOLEAN DEFAULT false;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS total_messages_received INT DEFAULT 0;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS total_messages_sent INT DEFAULT 0;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS total_clicks INT DEFAULT 0;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- ── 2. SMS Segments (reuse email segmentation pattern) ──────────────────────

CREATE TABLE IF NOT EXISTS sms_segments (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  conditions      JSONB NOT NULL DEFAULT '[]',
  is_dynamic      BOOLEAN DEFAULT true,
  member_count    INT DEFAULT 0,
  last_calculated TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_segment_members (
  segment_id BIGINT NOT NULL REFERENCES sms_segments(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (segment_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_sms_segments_org ON sms_segments(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_segment_members_contact ON sms_segment_members(contact_id);

-- ── 3. SMS Automation Workflows ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_automations (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'contact_added','tag_added','tag_removed','keyword_received',
    'date_based','engagement_score','inactivity','custom_field_change',
    'opt_in','purchase','abandoned_cart'
  )),
  trigger_config JSONB DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  entry_count INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_automation_steps (
  id            BIGSERIAL PRIMARY KEY,
  automation_id BIGINT NOT NULL REFERENCES sms_automations(id) ON DELETE CASCADE,
  step_order    INT NOT NULL,
  step_type     TEXT NOT NULL CHECK (step_type IN (
    'send_sms','send_mms','delay','condition','add_tag','remove_tag',
    'update_field','webhook','end_automation'
  )),
  step_config   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_automation_subscribers (
  id              BIGSERIAL PRIMARY KEY,
  automation_id   BIGINT NOT NULL REFERENCES sms_automations(id) ON DELETE CASCADE,
  contact_id      BIGINT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE,
  current_step_id BIGINT REFERENCES sms_automation_steps(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','exited','paused')),
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  next_action_at  TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE(automation_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_sms_automations_org ON sms_automations(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_automation_steps_automation ON sms_automation_steps(automation_id);
CREATE INDEX IF NOT EXISTS idx_sms_automation_subscribers_next_action ON sms_automation_subscribers(next_action_at) WHERE status='active';

-- ── 4. Two-Way Conversations & Keyword Responses ─────────────────────────────

CREATE TABLE IF NOT EXISTS sms_conversations (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      BIGINT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE,
  phone_number    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES sms_conversations(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      BIGINT REFERENCES sms_contacts(id) ON DELETE SET NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_body    TEXT NOT NULL,
  media_urls      TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','received')),
  provider_id     TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_keywords (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,
  response    TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('reply','opt_in','opt_out','add_tag','trigger_automation')),
  action_config JSONB DEFAULT '{}',
  match_type  TEXT NOT NULL DEFAULT 'exact' CHECK (match_type IN ('exact','contains','starts_with')),
  is_active   BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_conversations_org_contact ON sms_conversations(org_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_conversation ON sms_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_org_created ON sms_messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_keywords_org_keyword ON sms_keywords(org_id, keyword);

-- ── 5. Link Tracking & Click Analytics ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_links (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  short_code  TEXT NOT NULL UNIQUE,
  click_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_link_clicks (
  id         BIGSERIAL PRIMARY KEY,
  link_id    BIGINT NOT NULL REFERENCES sms_links(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES sms_contacts(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  device     TEXT,
  location   TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_links_org_campaign ON sms_links(org_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_links_short_code ON sms_links(short_code);
CREATE INDEX IF NOT EXISTS idx_sms_link_clicks_link ON sms_link_clicks(link_id);

-- ── 6. Extend sms_campaigns with advanced features ───────────────────────────

ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS segment_id BIGINT REFERENCES sms_segments(id) ON DELETE SET NULL;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'sms' CHECK (message_type IN ('sms','mms'));
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS link_tracking BOOLEAN DEFAULT false;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS ab_test_config JSONB;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS delivered_count INT DEFAULT 0;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS clicked_count INT DEFAULT 0;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS conversion_count INT DEFAULT 0;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS simulated BOOLEAN DEFAULT false;

-- ── 7. SMS Campaign A/B Testing ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_campaign_variants (
  id          BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  message     TEXT NOT NULL,
  media_urls  TEXT[] DEFAULT '{}',
  split_percentage INT NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  sent_count  INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  is_winner   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaign_variants_campaign ON sms_campaign_variants(campaign_id);

-- ── 8. SMS Sends Tracking (individual message tracking) ──────────────────────

CREATE TABLE IF NOT EXISTS sms_sends (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  contact_id  BIGINT REFERENCES sms_contacts(id) ON DELETE SET NULL,
  variant_id  BIGINT REFERENCES sms_campaign_variants(id) ON DELETE SET NULL,
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','clicked')),
  provider_id TEXT,
  error_code  TEXT,
  error_message TEXT,
  sent_at     TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  clicked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_sends_org_campaign ON sms_sends(org_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_contact ON sms_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_status ON sms_sends(status);

-- ── 9. SMS Analytics & Reporting ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_campaign_analytics (
  id              BIGSERIAL PRIMARY KEY,
  campaign_id     BIGINT NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  sent_count      INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count    INT DEFAULT 0,
  clicked_count   INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  revenue         DECIMAL(10,2) DEFAULT 0,
  opt_out_count   INT DEFAULT 0,
  UNIQUE(campaign_id, date)
);

CREATE TABLE IF NOT EXISTS sms_daily_stats (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  contacts_added  INT DEFAULT 0,
  messages_sent   INT DEFAULT 0,
  messages_delivered INT DEFAULT 0,
  messages_failed INT DEFAULT 0,
  clicks          INT DEFAULT 0,
  opt_ins         INT DEFAULT 0,
  opt_outs        INT DEFAULT 0,
  conversations_started INT DEFAULT 0,
  UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sms_campaign_analytics_campaign_date ON sms_campaign_analytics(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_sms_daily_stats_org_date ON sms_daily_stats(org_id, date);

-- ── 10. Compliance & Audit Trail ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_opt_in_log (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id  BIGINT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('opt_in','opt_out','resubscribe')),
  method      TEXT NOT NULL CHECK (method IN ('manual','form','api','keyword','imported')),
  ip_address  TEXT,
  user_agent  TEXT,
  consent_text TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_compliance_settings (
  id                  BIGSERIAL PRIMARY KEY,
  org_id              UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  require_double_opt_in BOOLEAN DEFAULT false,
  opt_in_confirmation_message TEXT,
  opt_out_keywords    TEXT[] DEFAULT '{STOP,UNSUBSCRIBE,CANCEL,END,QUIT}',
  opt_in_keywords     TEXT[] DEFAULT '{START,SUBSCRIBE,YES}',
  help_keywords       TEXT[] DEFAULT '{HELP,INFO}',
  help_response       TEXT,
  quiet_hours_start   TIME,
  quiet_hours_end     TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_in_log_org_contact ON sms_opt_in_log(org_id, contact_id);

-- ── 11. Scheduled Campaigns (enhance existing scheduled_at) ──────────────────

CREATE TABLE IF NOT EXISTS sms_scheduled_sends (
  id              BIGSERIAL PRIMARY KEY,
  campaign_id     BIGINT NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  scheduled_for   TIMESTAMPTZ NOT NULL,
  timezone        TEXT DEFAULT 'UTC',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_scheduled_sends_scheduled_for ON sms_scheduled_sends(scheduled_for) WHERE status='pending';

-- ── 12. SMS Templates ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_templates (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT CHECK (category IN ('promotional','transactional','reminder','notification','welcome','abandoned_cart')),
  message     TEXT NOT NULL,
  media_urls  TEXT[] DEFAULT '{}',
  merge_fields TEXT[] DEFAULT '{}',
  usage_count INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_org ON sms_templates(org_id);

-- ── 13. Subscriber Custom Fields ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_contact_fields (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name  TEXT NOT NULL,
  field_type  TEXT NOT NULL CHECK (field_type IN ('text','number','date','boolean','url')),
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, field_name)
);

-- Note: custom_fields JSONB already added to sms_contacts above

-- ── 14. Indexes for performance ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sms_contacts_org_status ON sms_contacts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_contacts_engagement ON sms_contacts(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_sms_contacts_last_message ON sms_contacts(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_org_status ON sms_campaigns(org_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled ON sms_campaigns(scheduled_at) WHERE status='scheduled';
