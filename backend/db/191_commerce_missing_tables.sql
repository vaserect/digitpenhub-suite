-- Inventory warehouse stock (referenced by InventoryService dashboard)
CREATE TABLE IF NOT EXISTS inventory_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID,
  product_id UUID NOT NULL,
  qty_available INT DEFAULT 0,
  qty_reserved INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iws_org ON inventory_warehouse_stock(org_id);
CREATE INDEX IF NOT EXISTS idx_iws_product ON inventory_warehouse_stock(product_id);

-- Commerce extension tables (10 new modules)
CREATE TABLE IF NOT EXISTS commerce_gift_cards (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cgc_org ON commerce_gift_cards(org_id);

CREATE TABLE IF NOT EXISTS commerce_wishlists (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cwl_org ON commerce_wishlists(org_id);

CREATE TABLE IF NOT EXISTS commerce_product_reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cpr_org ON commerce_product_reviews(org_id);

CREATE TABLE IF NOT EXISTS commerce_rma (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_crma_org ON commerce_rma(org_id);

CREATE TABLE IF NOT EXISTS commerce_loyalty (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cl_org ON commerce_loyalty(org_id);

CREATE TABLE IF NOT EXISTS commerce_print_on_demand (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cpod_org ON commerce_print_on_demand(org_id);

CREATE TABLE IF NOT EXISTS commerce_dropshipping (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cds_org ON commerce_dropshipping(org_id);

CREATE TABLE IF NOT EXISTS commerce_shipping (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cs_org ON commerce_shipping(org_id);

CREATE TABLE IF NOT EXISTS commerce_marketplace_payouts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cmp_org ON commerce_marketplace_payouts(org_id);

CREATE TABLE IF NOT EXISTS commerce_dispute_resolution (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cdr_org ON commerce_dispute_resolution(org_id);
