-- Zapier / Make Native Connector
CREATE TABLE IF NOT EXISTS zapier_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('zapier', 'make', 'n8n', 'custom')),
  webhook_url   TEXT NOT NULL,
  api_key_hash  TEXT NOT NULL,
  label         TEXT,
  is_active     BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  error_count   INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zapier_conn_org ON zapier_connections(org_id);

-- Outgoing webhook delivery log
CREATE TABLE IF NOT EXISTS zapier_deliveries (
  id              BIGSERIAL PRIMARY KEY,
  connection_id   UUID NOT NULL REFERENCES zapier_connections(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
  response_code   INT,
  response_body   TEXT,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zapier_deliveries_conn ON zapier_deliveries(connection_id, created_at DESC);
