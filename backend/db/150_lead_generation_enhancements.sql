-- Lead Generation Module Enhancements
-- Adds popup builder, A/B testing, analytics, webhooks, and advanced features

-- Popup/Modal campaigns
CREATE TABLE lead_popups (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  form_id           UUID        REFERENCES lead_forms(id) ON DELETE SET NULL,
  popup_type        TEXT        NOT NULL DEFAULT 'modal' CHECK (popup_type IN ('modal', 'slide-in', 'bar', 'fullscreen')),
  trigger_type      TEXT        NOT NULL DEFAULT 'time' CHECK (trigger_type IN ('time', 'scroll', 'exit-intent', 'click', 'manual')),
  trigger_value     JSONB       NOT NULL DEFAULT '{}', -- e.g., {"delay": 5000} or {"scrollPercent": 50}
  targeting_rules   JSONB       NOT NULL DEFAULT '{}', -- URL patterns, device, geo, etc.
  design_config     JSONB       NOT NULL DEFAULT '{}', -- colors, fonts, position, animation
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A/B Testing variants
CREATE TABLE lead_form_variants (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id           UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  variant_name      TEXT        NOT NULL, -- 'A', 'B', 'C', etc.
  fields_json       JSONB       NOT NULL DEFAULT '[]',
  thank_you_message TEXT,
  traffic_split     INTEGER     NOT NULL DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form analytics events
CREATE TABLE lead_form_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  variant_id      UUID        REFERENCES lead_form_variants(id) ON DELETE SET NULL,
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL CHECK (event_type IN ('view', 'start', 'submit', 'abandon', 'error')),
  session_id      TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  referrer        TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conditional logic rules
CREATE TABLE lead_form_logic (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_type       TEXT        NOT NULL CHECK (rule_type IN ('show_field', 'hide_field', 'skip_to', 'redirect')),
  conditions      JSONB       NOT NULL DEFAULT '[]', -- [{field: 'x', operator: 'equals', value: 'y'}]
  actions         JSONB       NOT NULL DEFAULT '[]', -- [{action: 'show', target: 'field_id'}]
  priority        INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead scoring rules
CREATE TABLE lead_scoring_rules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  conditions      JSONB       NOT NULL DEFAULT '[]', -- [{field: 'company', operator: 'contains', value: 'enterprise'}]
  score_change    INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add score to submissions
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;

-- Webhooks
CREATE TABLE lead_webhooks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  events          TEXT[]      NOT NULL DEFAULT '{}', -- ['form_submitted', 'lead_converted']
  headers         JSONB       NOT NULL DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  last_triggered  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE lead_webhook_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID        NOT NULL REFERENCES lead_webhooks(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body   TEXT,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Multi-step form pages
ALTER TABLE lead_forms ADD COLUMN IF NOT EXISTS is_multi_step BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lead_forms ADD COLUMN IF NOT EXISTS pages_json JSONB NOT NULL DEFAULT '[]';

-- Custom branding
ALTER TABLE lead_forms ADD COLUMN IF NOT EXISTS branding_config JSONB NOT NULL DEFAULT '{}';

-- Spam protection
ALTER TABLE lead_forms ADD COLUMN IF NOT EXISTS spam_protection JSONB NOT NULL DEFAULT '{"honeypot": true, "captcha": false}';

-- Indexes
CREATE INDEX ON lead_popups (org_id);
CREATE INDEX ON lead_popups (form_id);
CREATE INDEX ON lead_form_variants (form_id);
CREATE INDEX ON lead_form_events (form_id);
CREATE INDEX ON lead_form_events (created_at);
CREATE INDEX ON lead_form_events (event_type);
CREATE INDEX ON lead_form_logic (form_id);
CREATE INDEX ON lead_scoring_rules (org_id);
CREATE INDEX ON lead_submissions (assigned_to);
CREATE INDEX ON lead_submissions (follow_up_at);
CREATE INDEX ON lead_webhooks (org_id);
CREATE INDEX ON lead_webhook_logs (webhook_id);
CREATE INDEX ON lead_webhook_logs (created_at);
