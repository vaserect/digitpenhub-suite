CREATE SEQUENCE IF NOT EXISTS delivery_number_seq START 1001;

CREATE TABLE IF NOT EXISTS deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delivery_number   TEXT NOT NULL,
  order_ref         TEXT,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT,
  delivery_address  TEXT NOT NULL,
  courier_name      TEXT,
  tracking_code     TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned')),
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','express','same_day')),
  estimated_date    DATE,
  delivered_at      TIMESTAMPTZ,
  notes             TEXT,
  items             JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
