CREATE TABLE asset_items (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  asset_tag      TEXT,
  category       TEXT,
  description    TEXT,
  serial_number  TEXT,
  purchase_date  DATE,
  purchase_cost  NUMERIC(14,2),
  current_value  NUMERIC(14,2),
  status         TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','assigned','maintenance','retired')),
  assigned_to    TEXT,
  location       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
