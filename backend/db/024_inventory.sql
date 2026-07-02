CREATE TABLE inventory_categories (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_products (
  id                  BIGSERIAL PRIMARY KEY,
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id         BIGINT REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  sku                 TEXT,
  description         TEXT,
  price               NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost                NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_qty           NUMERIC(14,2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(14,2) NOT NULL DEFAULT 5,
  unit                TEXT NOT NULL DEFAULT 'pcs',
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_transactions (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('purchase','sale','adjustment','return')),
  qty        NUMERIC(14,2) NOT NULL,
  note       TEXT,
  reference  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
