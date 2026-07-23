-- Guided Data Migration Tool
CREATE TABLE IF NOT EXISTS migration_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  source_type   TEXT NOT NULL CHECK (source_type IN ('csv','google_sheets','api','manual')),
  source_config JSONB DEFAULT '{}',
  field_mapping JSONB DEFAULT '{}',
  target_type   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validating','validated','running','completed','failed','rolled_back')),
  stats         JSONB DEFAULT '{}',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_tasks_org ON migration_tasks(org_id, status);

-- Migration task records (individual row results)
CREATE TABLE IF NOT EXISTS migration_records (
  id              BIGSERIAL PRIMARY KEY,
  task_id         UUID NOT NULL REFERENCES migration_tasks(id) ON DELETE CASCADE,
  row_index       INT NOT NULL,
  source_data     JSONB NOT NULL,
  transformed_data JSONB,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','valid','error','imported','skipped')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_records_task ON migration_records(task_id);
