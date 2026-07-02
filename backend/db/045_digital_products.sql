CREATE TABLE IF NOT EXISTS digital_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  price         NUMERIC(15,2) NOT NULL DEFAULT 0,
  file_url      TEXT,
  file_name     TEXT,
  file_size     BIGINT,
  cover_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  sales_count   INT NOT NULL DEFAULT 0,
  revenue       NUMERIC(15,2) NOT NULL DEFAULT 0,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_product_sales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  buyer_name   TEXT NOT NULL,
  buyer_email  TEXT NOT NULL,
  amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_ref  TEXT,
  downloaded   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
