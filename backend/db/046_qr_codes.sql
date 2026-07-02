CREATE TABLE IF NOT EXISTS qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'url' CHECK (type IN ('url','text','email','phone','sms','wifi','vcard')),
  color       TEXT NOT NULL DEFAULT '#000000',
  bg_color    TEXT NOT NULL DEFAULT '#ffffff',
  size        INT NOT NULL DEFAULT 200,
  scans       INT NOT NULL DEFAULT 0,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
