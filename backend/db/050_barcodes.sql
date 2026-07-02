CREATE TABLE IF NOT EXISTS barcodes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  content      TEXT NOT NULL,
  barcode_type TEXT DEFAULT 'code128',
  scans        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS color_palettes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  colors     JSONB NOT NULL DEFAULT '[]',
  tags       JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
