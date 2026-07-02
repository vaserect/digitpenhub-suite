CREATE TABLE notes (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  color      TEXT NOT NULL DEFAULT '#ffffff',
  pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
