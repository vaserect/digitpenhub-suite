-- Outgoing Webhooks — allows users to subscribe their own URLs to platform events
-- The webhook delivery service listens to EventBus events and POSTs to subscribed URLs.

CREATE TABLE IF NOT EXISTS outgoing_webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  secret          TEXT NOT NULL DEFAULT gen_random_uuid()::text,  -- used to sign payloads
  event_types     TEXT[] NOT NULL DEFAULT '{}',                   -- e.g. {'deal.created','deal.won','invoice.paid'}
  is_active       BOOLEAN NOT NULL DEFAULT true,
  retry_count     INT NOT NULL DEFAULT 3,
  timeout_ms      INT NOT NULL DEFAULT 5000,
  last_sent_at    TIMESTAMPTZ,
  last_status     INT,                                            -- HTTP status code from last delivery
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_org ON outgoing_webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_active ON outgoing_webhooks(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS outgoing_webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID NOT NULL REFERENCES outgoing_webhooks(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','delivered','failed','retrying')),
  status_code     INT,
  response_body   TEXT,
  error_message   TEXT,
  attempt         INT NOT NULL DEFAULT 1,
  max_attempts    INT NOT NULL DEFAULT 3,
  delivered_at    TIMESTAMPTZ,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outgoing_deliveries_status ON outgoing_webhook_deliveries(status, next_retry_at)
  WHERE status IN ('pending','retrying');
CREATE INDEX IF NOT EXISTS idx_outgoing_deliveries_webhook ON outgoing_webhook_deliveries(webhook_id, created_at DESC);
