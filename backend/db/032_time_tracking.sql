CREATE TABLE time_projects (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  client      TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#2563eb',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_entries (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id  BIGINT REFERENCES time_projects(id) ON DELETE SET NULL,
  description TEXT,
  started_at  TIMESTAMPTZ NOT NULL,
  stopped_at  TIMESTAMPTZ,
  duration_s  INT GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (stopped_at - started_at))::INT) STORED,
  is_running  BOOLEAN NOT NULL DEFAULT FALSE,
  billable    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
