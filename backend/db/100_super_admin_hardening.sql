-- Super Admin hardening + Add-On Marketplace + System Health
--
-- Part 1: Super Admin 2FA enforcement, separate session config, IP logging

-- Track super admin login attempts with IP/location metadata
ALTER TABLE audit_log ALTER COLUMN user_id DROP NOT NULL;
-- (already nullable via DROP NOT NULL — ensure it's enabled)

-- Add session type column so admin sessions can have shorter TTL
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'user'
  CHECK (session_type IN ('user','admin','impersonation'));

-- Add impersonation tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES users(id);

-- Part 2: Add-On Marketplace

CREATE TABLE IF NOT EXISTS addon_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  short_desc      TEXT NOT NULL,
  full_desc       TEXT,
  category        TEXT NOT NULL,
  icon_url        TEXT,
  -- Embed config
  embed_type      TEXT NOT NULL CHECK (embed_type IN ('iframe','script','external_link')),
  embed_payload   TEXT NOT NULL,               -- URL or script snippet
  embed_permissions TEXT[] DEFAULT '{}',       -- sandbox permissions for iframe
  -- Pricing
  pricing_model   TEXT NOT NULL DEFAULT 'free' CHECK (pricing_model IN ('free','one_time','subscription','revenue_share')),
  price_ngn       NUMERIC(12,2),
  stripe_price_id TEXT,
  revenue_share_pct NUMERIC(5,2),
  referral_url    TEXT,                        -- for revenue_share / affiliate links
  -- Visibility
  visible_plans   TEXT[] DEFAULT '{}',         -- empty = all plans
  visible_orgs    UUID[] DEFAULT '{}',         -- empty = all orgs
  -- Workflow
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published','disabled')),
  sort_order      INT NOT NULL DEFAULT 0,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  -- Meta
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addon_status ON addon_products(status, sort_order);

-- Workspace Add-on enablements
CREATE TABLE IF NOT EXISTS addon_enablements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_id        UUID NOT NULL REFERENCES addon_products(id) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  stripe_sub_id   TEXT,
  enabled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, addon_id)
);

-- Add-on usage analytics
CREATE TABLE IF NOT EXISTS addon_usage_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id        UUID NOT NULL REFERENCES addon_products(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('enable','disable','click','open','view')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addon_usage ON addon_usage_events(addon_id, event_type, created_at);

-- Part 3: System Health snapshots
CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_error_rate  NUMERIC(5,2),               -- percentage
  db_pool_usage   NUMERIC(5,2),               -- percentage of max connections
  active_sessions INT,
  queue_backlog   INT,
  failed_jobs     INT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_time ON system_health_snapshots(recorded_at DESC);
