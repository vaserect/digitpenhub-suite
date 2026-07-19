-- Ad Campaign Manager Schema Migrations
-- Designed for tracking, optimization, custom audience synching, and A/B creative testing.

CREATE TABLE IF NOT EXISTS ad_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform            VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'linkedin'
  account_name        VARCHAR(255) NOT NULL,
  platform_account_id VARCHAR(255) NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'disconnected'
  credentials         JSONB NOT NULL DEFAULT '{}', -- tokens, scopes, settings
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_org ON ad_accounts(org_id);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_account_id       UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  platform            VARCHAR(50) NOT NULL,
  name                VARCHAR(255) NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'archived'
  budget_type         VARCHAR(50) NOT NULL DEFAULT 'daily', -- 'daily', 'lifetime'
  budget              DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  bid_strategy        VARCHAR(100),
  objective           VARCHAR(100), -- 'leads', 'conversions', 'awareness', 'clicks'
  start_date          TIMESTAMPTZ,
  end_date            TIMESTAMPTZ,
  platform_campaign_id VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_org ON ad_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_account ON ad_campaigns(ad_account_id);

CREATE TABLE IF NOT EXISTS ad_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id         UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused'
  target_audience     JSONB NOT NULL DEFAULT '{}', -- demographics, locations, interests
  platform_ad_group_id VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_groups_org ON ad_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_ad_groups_campaign ON ad_groups(campaign_id);

CREATE TABLE IF NOT EXISTS ads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_group_id         UUID NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused'
  creative_data       JSONB NOT NULL DEFAULT '{}', -- headlines, description, image_url, destination_url
  platform_ad_id      VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ads_org ON ads(org_id);
CREATE INDEX IF NOT EXISTS idx_ads_group ON ads(ad_group_id);

CREATE TABLE IF NOT EXISTS ad_analytics_daily (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id         UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  ad_group_id         UUID NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
  ad_id               UUID REFERENCES ads(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  impressions         INTEGER NOT NULL DEFAULT 0,
  clicks              INTEGER NOT NULL DEFAULT 0,
  spend               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  conversions         INTEGER NOT NULL DEFAULT 0,
  revenue             DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  clicks_unique       INTEGER NOT NULL DEFAULT 0,
  conversions_unique  INTEGER NOT NULL DEFAULT 0,
  social_actions      JSONB NOT NULL DEFAULT '{"likes": 0, "shares": 0, "comments": 0}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_org_date ON ad_analytics_daily(org_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_campaign ON ad_analytics_daily(campaign_id);

CREATE TABLE IF NOT EXISTS ad_optimization_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  conditions          JSONB NOT NULL DEFAULT '[]', -- rules trigger conditions
  actions             JSONB NOT NULL DEFAULT '[]', -- pause campaign/ad, change budget, send notification
  target_type         VARCHAR(50) NOT NULL, -- 'campaign', 'ad_group', 'ad'
  target_ids          UUID[] NOT NULL DEFAULT '{}',
  status              VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  last_run_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_optimization_rules_org ON ad_optimization_rules(org_id);

CREATE TABLE IF NOT EXISTS ad_custom_audiences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  segment_id          UUID, -- optional link to segment table if present
  platform            VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'linkedin'
  platform_audience_id VARCHAR(255),
  status              VARCHAR(50) NOT NULL DEFAULT 'ready', -- 'ready', 'updating', 'error'
  member_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ad_custom_audiences_org ON ad_custom_audiences(org_id);
