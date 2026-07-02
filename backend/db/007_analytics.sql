-- Milestone 8: Analytics Dashboard
-- Lightweight event log for module opens and key user actions.

CREATE TABLE org_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,            -- e.g. 'module.open', 'invoice.created'
  properties JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON org_events (org_id, created_at DESC);
CREATE INDEX ON org_events (org_id, name);
