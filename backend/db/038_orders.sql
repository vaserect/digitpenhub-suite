CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE TABLE orders (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT,
  customer_address TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping        NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status  TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','partial','refunded')),
  payment_method  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
