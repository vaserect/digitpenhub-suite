-- Cloud Storage / File Manager
CREATE TABLE IF NOT EXISTS storage_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES storage_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder_id     UUID REFERENCES storage_folders(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT DEFAULT 0,
  disk_path     TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Automation
CREATE TABLE IF NOT EXISTS workflows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  trigger_type   TEXT DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  steps          JSONB DEFAULT '[]',
  is_active      BOOLEAN DEFAULT TRUE,
  run_count      INTEGER DEFAULT 0,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'success',
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  log         JSONB DEFAULT '[]'
);

-- Marketplace Products
CREATE TABLE IF NOT EXISTS marketplace_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'General',
  price       NUMERIC(12,2) DEFAULT 0,
  currency    TEXT DEFAULT 'NGN',
  images      JSONB DEFAULT '[]',
  tags        JSONB DEFAULT '[]',
  stock       INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'draft',
  views       INTEGER DEFAULT 0,
  sales       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
