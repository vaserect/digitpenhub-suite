CREATE TABLE calendar_events (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  all_day     BOOLEAN NOT NULL DEFAULT FALSE,
  color       TEXT NOT NULL DEFAULT '#2563eb',
  location    TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
