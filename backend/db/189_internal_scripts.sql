-- Internal Tooling / Script Library
CREATE TABLE IF NOT EXISTS internal_scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  language      TEXT NOT NULL DEFAULT 'javascript' CHECK (language IN ('javascript','python','sql','bash')),
  source_code   TEXT NOT NULL,
  timeout_sec   INT NOT NULL DEFAULT 30,
  is_active     BOOLEAN DEFAULT true,
  last_run_at   TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success','error')),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_scripts_org ON internal_scripts(org_id);

-- Script execution log
CREATE TABLE IF NOT EXISTS script_executions (
  id            BIGSERIAL PRIMARY KEY,
  script_id     UUID NOT NULL REFERENCES internal_scripts(id) ON DELETE CASCADE,
  triggered_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error')),
  output        TEXT,
  error_output  TEXT,
  duration_ms   INT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_script_executions_script ON script_executions(script_id, started_at DESC);
