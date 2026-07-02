CREATE TABLE IF NOT EXISTS saved_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  module       TEXT NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  last_run_at  TIMESTAMPTZ,
  run_count    INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
