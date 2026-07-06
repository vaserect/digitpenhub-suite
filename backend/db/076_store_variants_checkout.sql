-- Product variants for Marketplace / Online Store Builder products.
CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  value       TEXT NOT NULL,
  price_delta NUMERIC(12,2) DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  sku         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- Orders.items JSONB convention (no ALTER needed — items is already JSONB):
-- When an order originates from the public storefront checkout
-- (backend/src/routes/storeBuilder.js POST /public/:orgId/checkout), each
-- element of the `items` array carries these keys:
--   { productId, variantId (nullable), name, qty, price }
-- The name/qty/price keys are the same ones the existing Order Management
-- UI already reads (see frontend/components/AppShell.jsx ~line 14931-14934
-- and ~line 14838-14840); productId/variantId are additive and safe to
-- ignore for orders created through any other flow (e.g. manual order
-- creation in Order Management), where they will simply be absent.
