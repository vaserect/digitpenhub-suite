-- Online Store Builder: shipping rules + abandoned-cart recovery
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS shipping_flat_rate NUMERIC DEFAULT 0;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC;

CREATE TABLE IF NOT EXISTS store_abandoned_carts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_email    TEXT NOT NULL,
  customer_name     TEXT,
  items             JSONB DEFAULT '[]',
  subtotal          NUMERIC DEFAULT 0,
  recovered         BOOLEAN DEFAULT FALSE,
  recovery_sent_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_store_abandoned_carts_org ON store_abandoned_carts(org_id, recovered, updated_at DESC);
