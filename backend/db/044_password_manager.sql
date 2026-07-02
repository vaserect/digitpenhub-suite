CREATE TABLE IF NOT EXISTS password_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  username    TEXT,
  password    TEXT NOT NULL,
  url         TEXT,
  notes       TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  strength    TEXT GENERATED ALWAYS AS (
    CASE
      WHEN length(password) < 6                        THEN 'weak'
      WHEN length(password) < 10                       THEN 'fair'
      WHEN length(password) >= 10 AND length(password) < 16 THEN 'good'
      ELSE                                                  'strong'
    END
  ) STORED,
  last_used   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
