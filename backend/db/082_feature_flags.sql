-- Feature Flags: platform-wide kill-switches + per-org overrides,
-- independent of plan.all_modules gating in planAccess.js
CREATE TABLE IF NOT EXISTS feature_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  is_global_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_feature_overrides (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key   TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  enabled    BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org ON org_feature_overrides(org_id);
