-- Feature Flags & A/B Experimentation Engine (platform-wide)
--
-- Two-tier system:
--   1. Feature flags — simple on/off/percentage-rollout toggles per org
--   2. A/B experiments — structured experiments with variants, traffic splits,
--      and metric tracking. Built on top of the feature flag system.

-- ── Feature flags ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,                  -- e.g. "new-invoice-designer", "ai-suggestions-v2"
  name        TEXT NOT NULL,
  description TEXT,
  enabled     BOOLEAN NOT NULL DEFAULT false,  -- master toggle
  rollout_pct INT NOT NULL DEFAULT 0           -- 0–100, percentage of users who see it
              CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

-- User-level overrides: force a flag on/off for specific users regardless of rollout
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id     UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flag_id, user_id)
);

-- ── A/B experiments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','running','paused','completed')),
  flag_key      TEXT NOT NULL,               -- the feature flag this experiment controls
  start_at      TIMESTAMPTZ,
  end_at        TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Variants within an experiment (at least 2: control + treatment)
CREATE TABLE IF NOT EXISTS experiment_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                -- "control", "variant-a", "variant-b", etc.
  traffic_pct   INT NOT NULL DEFAULT 50       -- 0–100, percentage of experiment traffic
                CHECK (traffic_pct >= 0 AND traffic_pct <= 100),
  is_control    BOOLEAN NOT NULL DEFAULT false,
  config_json   JSONB NOT NULL DEFAULT '{}',  -- arbitrary config the experiment reads
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, name)
);

-- Assignments: which user saw which variant (for analysis)
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, user_id)
);

-- Events: actions users take during an experiment (clicks, conversions, etc.)
CREATE TABLE IF NOT EXISTS experiment_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,                -- e.g. "view", "click", "conversion", "signup"
  event_value   NUMERIC,                      -- optional numeric value (revenue, time, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exp_events_experiment ON experiment_events(experiment_id, event_type);

-- ── System-level feature flags ────────────────────────────────────────────────
-- Platform-wide flags that apply to all orgs (set by super admin).
CREATE TABLE IF NOT EXISTS system_feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed some system-level flags for the platform itself
INSERT INTO system_feature_flags (key, name, description, enabled) VALUES
  ('global-search', 'Global Search (Cmd/Ctrl+K)', 'Cross-module global search with unified results.', false),
  ('unified-inbox', 'Unified Inbox', 'Combined inbox for tickets, emails, and notifications.', false),
  ('collaborative-docs', 'Collaborative Document Co-editing', 'Real-time multiplayer document editing.', false)
ON CONFLICT (key) DO NOTHING;
