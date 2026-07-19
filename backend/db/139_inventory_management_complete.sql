-- =====================================================
-- MODULE 24: INVENTORY MANAGEMENT - ENTERPRISE UPGRADE
-- =====================================================
-- Benchmark: TradeGecko, Cin7, Zoho Inventory, Fishbowl
-- Upgrade from basic 3-table system to enterprise-grade
-- inventory management with multi-warehouse, suppliers,
-- batch tracking, serial numbers, and advanced analytics
-- =====================================================

-- =====================================================
-- PART 1: ENHANCE EXISTING TABLES
-- =====================================================

-- Enhance inventory_categories with hierarchy and metadata
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES inventory_categories(id) ON DELETE SET NULL;
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enhance inventory_products with enterprise features
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS model_number TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS weight NUMERIC(10,3);
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS dimensions TEXT; -- JSON: {length, width, height, unit}
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS images TEXT; -- JSON array of image URLs
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS track_serial BOOLEAN DEFAULT false;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS track_batch BOOLEAN DEFAULT false;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(14,2) DEFAULT 0;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS reorder_qty NUMERIC(14,2) DEFAULT 0;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 0;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS valuation_method TEXT DEFAULT 'fifo' CHECK (valuation_method IN ('fifo','lifo','average','standard'));
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS bundle_items TEXT; -- JSON array of {product_id, qty}
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS tags TEXT; -- JSON array of tags
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS custom_fields TEXT; -- JSON object
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enhance inventory_transactions with more details
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS warehouse_id BIGINT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS batch_id BIGINT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14,2);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS total_cost NUMERIC(14,2);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending','approved','completed','cancelled'));

-- =====================================================
-- PART 2: NEW CORE TABLES
-- =====================================================

-- Warehouses/Locations
CREATE TABLE IF NOT EXISTS inventory_warehouses (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- Short code like "WH01", "NYC", "LA"
  type TEXT DEFAULT 'warehouse' CHECK (type IN ('warehouse','store','dropship','virtual')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  capacity NUMERIC(14,2), -- Total capacity in units
  current_utilization NUMERIC(5,2) DEFAULT 0, -- Percentage
  notes TEXT,
  custom_fields TEXT, -- JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouse Stock Levels (replaces single stock_qty in products)
CREATE TABLE IF NOT EXISTS inventory_warehouse_stock (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  qty_available NUMERIC(14,2) DEFAULT 0,
  qty_reserved NUMERIC(14,2) DEFAULT 0, -- Reserved for orders
  qty_on_order NUMERIC(14,2) DEFAULT 0, -- Incoming from suppliers
  qty_allocated NUMERIC(14,2) DEFAULT 0, -- Allocated to production/kits
  bin_location TEXT, -- Physical location in warehouse
  last_counted_at TIMESTAMPTZ,
  last_counted_qty NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- Supplier code
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  tax_id TEXT,
  payment_terms TEXT, -- e.g., "Net 30", "COD"
  currency TEXT DEFAULT 'USD',
  credit_limit NUMERIC(14,2) DEFAULT 0,
  current_balance NUMERIC(14,2) DEFAULT 0,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  custom_fields TEXT, -- JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Suppliers (many-to-many with pricing)
CREATE TABLE IF NOT EXISTS inventory_product_suppliers (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  supplier_id BIGINT NOT NULL REFERENCES inventory_suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  cost NUMERIC(14,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  lead_time_days INT DEFAULT 0,
  min_order_qty NUMERIC(14,2) DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_purchase_date TIMESTAMPTZ,
  last_purchase_cost NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS inventory_purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id BIGINT NOT NULL REFERENCES inventory_suppliers(id) ON DELETE RESTRICT,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','partial','received','cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  shipping_cost NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS inventory_purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_id BIGINT NOT NULL REFERENCES inventory_purchase_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,
  qty_ordered NUMERIC(14,2) NOT NULL,
  qty_received NUMERIC(14,2) DEFAULT 0,
  unit_cost NUMERIC(14,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch/Lot Tracking
CREATE TABLE IF NOT EXISTS inventory_batches (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE SET NULL,
  qty_initial NUMERIC(14,2) NOT NULL,
  qty_current NUMERIC(14,2) NOT NULL,
  unit_cost NUMERIC(14,2),
  manufacture_date DATE,
  expiry_date DATE,
  supplier_id BIGINT REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
  po_id BIGINT REFERENCES inventory_purchase_orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','recalled','depleted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, product_id, batch_number)
);

-- Serial Number Tracking
CREATE TABLE IF NOT EXISTS inventory_serial_numbers (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','reserved','sold','returned','defective')),
  purchase_date DATE,
  sale_date DATE,
  warranty_expiry DATE,
  customer_id BIGINT, -- Reference to customer/contact
  order_id BIGINT, -- Reference to sales order
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, product_id, serial_number)
);

-- Stock Transfers between warehouses
CREATE TABLE IF NOT EXISTS inventory_stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transfer_number TEXT NOT NULL,
  from_warehouse_id BIGINT NOT NULL REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id BIGINT NOT NULL REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','in_transit','received','cancelled')),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS inventory_stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transfer_id BIGINT NOT NULL REFERENCES inventory_stock_transfers(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,
  batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  qty_requested NUMERIC(14,2) NOT NULL,
  qty_sent NUMERIC(14,2) DEFAULT 0,
  qty_received NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Adjustments (for corrections, damage, theft, etc.)
CREATE TABLE IF NOT EXISTS inventory_stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adjustment_number TEXT NOT NULL,
  warehouse_id BIGINT NOT NULL REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('count','damage','theft','loss','found','correction','write_off')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS inventory_stock_adjustment_items (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adjustment_id BIGINT NOT NULL REFERENCES inventory_stock_adjustments(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,
  batch_id BIGINT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  qty_before NUMERIC(14,2) NOT NULL,
  qty_after NUMERIC(14,2) NOT NULL,
  qty_change NUMERIC(14,2) NOT NULL,
  unit_cost NUMERIC(14,2),
  value_change NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS inventory_product_variants (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- e.g., "Red / Large"
  sku TEXT,
  barcode TEXT,
  attributes TEXT NOT NULL, -- JSON: {color: "Red", size: "Large"}
  price NUMERIC(14,2),
  cost NUMERIC(14,2),
  weight NUMERIC(10,3),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Low Stock Alerts
CREATE TABLE IF NOT EXISTS inventory_low_stock_alerts (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  alert_type TEXT DEFAULT 'low_stock' CHECK (alert_type IN ('low_stock','out_of_stock','expiring_soon','expired')),
  current_qty NUMERIC(14,2),
  threshold_qty NUMERIC(14,2),
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Valuation History (for financial reporting)
CREATE TABLE IF NOT EXISTS inventory_valuation_snapshots (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  total_products INT DEFAULT 0,
  total_qty NUMERIC(14,2) DEFAULT 0,
  total_value NUMERIC(14,2) DEFAULT 0,
  valuation_method TEXT,
  details TEXT, -- JSON: per-product breakdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, snapshot_date, warehouse_id)
);

-- Inventory Forecasting
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecast_period TEXT DEFAULT 'monthly' CHECK (forecast_period IN ('daily','weekly','monthly','quarterly')),
  predicted_demand NUMERIC(14,2),
  predicted_stock NUMERIC(14,2),
  reorder_suggestion NUMERIC(14,2),
  confidence_score NUMERIC(5,2), -- 0-100
  algorithm TEXT, -- e.g., "moving_average", "exponential_smoothing"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Audit Trail
CREATE TABLE IF NOT EXISTS inventory_audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'product', 'transaction', 'warehouse', etc.
  entity_id BIGINT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 3: PERFORMANCE INDEXES
-- =====================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_inventory_categories_org_active ON inventory_categories(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_parent ON inventory_categories(parent_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_inventory_products_org_status ON inventory_products(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON inventory_products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_sku ON inventory_products(org_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_products_barcode ON inventory_products(org_id, barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_products_reorder ON inventory_products(org_id) WHERE stock_qty <= reorder_point;
CREATE INDEX IF NOT EXISTS idx_inventory_products_bundle ON inventory_products(org_id, is_bundle);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_org_date ON inventory_transactions(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_batch ON inventory_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_status ON inventory_transactions(org_id, status);

-- Warehouses indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouses_org_active ON inventory_warehouses(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouses_code ON inventory_warehouses(org_id, code);

-- Warehouse stock indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_stock_org ON inventory_warehouse_stock(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_stock_product ON inventory_warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_stock_warehouse ON inventory_warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_stock_low ON inventory_warehouse_stock(org_id) WHERE qty_available <= 0;

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_org_active ON inventory_suppliers(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_code ON inventory_suppliers(org_id, code);

-- Product suppliers indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_suppliers_product ON inventory_product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_suppliers_supplier ON inventory_product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_suppliers_preferred ON inventory_product_suppliers(org_id, is_preferred);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_org_status ON inventory_purchase_orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_supplier ON inventory_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_number ON inventory_purchase_orders(org_id, po_number);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_date ON inventory_purchase_orders(org_id, order_date DESC);

-- PO items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_po_items_po ON inventory_purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_inventory_po_items_product ON inventory_purchase_order_items(product_id);

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_inventory_batches_org_product ON inventory_batches(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_number ON inventory_batches(org_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(org_id, expiry_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_inventory_batches_warehouse ON inventory_batches(warehouse_id);

-- Serial numbers indexes
CREATE INDEX IF NOT EXISTS idx_inventory_serial_numbers_org_product ON inventory_serial_numbers(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_serial_numbers_number ON inventory_serial_numbers(org_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_serial_numbers_status ON inventory_serial_numbers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_serial_numbers_warehouse ON inventory_serial_numbers(warehouse_id);

-- Stock transfers indexes
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transfers_org_status ON inventory_stock_transfers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transfers_from ON inventory_stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transfers_to ON inventory_stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_transfers_number ON inventory_stock_transfers(org_id, transfer_number);

-- Transfer items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_transfer ON inventory_stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_product ON inventory_stock_transfer_items(product_id);

-- Stock adjustments indexes
CREATE INDEX IF NOT EXISTS idx_inventory_stock_adjustments_org_status ON inventory_stock_adjustments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_adjustments_warehouse ON inventory_stock_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_adjustments_number ON inventory_stock_adjustments(org_id, adjustment_number);

-- Adjustment items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_adjustment ON inventory_stock_adjustment_items(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_product ON inventory_stock_adjustment_items(product_id);

-- Variants indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_variants_parent ON inventory_product_variants(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_variants_sku ON inventory_product_variants(org_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_product_variants_active ON inventory_product_variants(org_id, is_active);

-- Low stock alerts indexes
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_alerts_org_status ON inventory_low_stock_alerts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_alerts_product ON inventory_low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_alerts_warehouse ON inventory_low_stock_alerts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_alerts_type ON inventory_low_stock_alerts(org_id, alert_type);

-- Valuation snapshots indexes
CREATE INDEX IF NOT EXISTS idx_inventory_valuation_snapshots_org_date ON inventory_valuation_snapshots(org_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_valuation_snapshots_warehouse ON inventory_valuation_snapshots(warehouse_id);

-- Forecasts indexes
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_org_product ON inventory_forecasts(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_date ON inventory_forecasts(org_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_warehouse ON inventory_forecasts(warehouse_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_inventory_audit_log_org_date ON inventory_audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_log_entity ON inventory_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_log_user ON inventory_audit_log(user_id);

-- =====================================================
-- PART 4: AUTOMATIC TRIGGERS
-- =====================================================

-- Trigger: Update warehouse stock when transaction is created
CREATE OR REPLACE FUNCTION update_warehouse_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warehouse_id IS NOT NULL THEN
    -- Update warehouse stock based on transaction type
    IF NEW.type IN ('purchase', 'return', 'adjustment') THEN
      -- Increase stock
      INSERT INTO inventory_warehouse_stock (org_id, product_id, warehouse_id, qty_available)
      VALUES (NEW.org_id, NEW.product_id, NEW.warehouse_id, NEW.qty)
      ON CONFLICT (product_id, warehouse_id)
      DO UPDATE SET 
        qty_available = inventory_warehouse_stock.qty_available + NEW.qty,
        updated_at = NOW();
    ELSIF NEW.type = 'sale' THEN
      -- Decrease stock
      UPDATE inventory_warehouse_stock
      SET qty_available = qty_available - NEW.qty,
          updated_at = NOW()
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_warehouse_stock_on_transaction
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_stock_on_transaction();

-- Trigger: Update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory_product_timestamp
BEFORE UPDATE ON inventory_products
FOR EACH ROW
EXECUTE FUNCTION update_inventory_product_timestamp();

-- Trigger: Create low stock alert when stock falls below threshold
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_product_reorder_point NUMERIC(14,2);
BEGIN
  -- Get product reorder point
  SELECT reorder_point INTO v_product_reorder_point
  FROM inventory_products
  WHERE id = NEW.product_id;

  -- Create alert if stock is low
  IF NEW.qty_available <= v_product_reorder_point AND NEW.qty_available > 0 THEN
    INSERT INTO inventory_low_stock_alerts (org_id, product_id, warehouse_id, alert_type, current_qty, threshold_qty, status)
    VALUES (NEW.org_id, NEW.product_id, NEW.warehouse_id, 'low_stock', NEW.qty_available, v_product_reorder_point, 'active')
    ON CONFLICT DO NOTHING;
  ELSIF NEW.qty_available = 0 THEN
    INSERT INTO inventory_low_stock_alerts (org_id, product_id, warehouse_id, alert_type, current_qty, threshold_qty, status)
    VALUES (NEW.org_id, NEW.product_id, NEW.warehouse_id, 'out_of_stock', NEW.qty_available, v_product_reorder_point, 'active')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_low_stock_alert
AFTER INSERT OR UPDATE ON inventory_warehouse_stock
FOR EACH ROW
EXECUTE FUNCTION check_low_stock_alert();

-- Trigger: Update batch quantity when used
CREATE OR REPLACE FUNCTION update_batch_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE inventory_batches
    SET qty_current = qty_current - NEW.qty,
        updated_at = NOW()
    WHERE id = NEW.batch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_batch_quantity
AFTER INSERT ON inventory_transactions
FOR EACH ROW
WHEN (NEW.type = 'sale')
EXECUTE FUNCTION update_batch_quantity();

-- Trigger: Calculate PO totals
CREATE OR REPLACE FUNCTION calculate_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(14,2);
BEGIN
  -- Calculate subtotal from items
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM inventory_purchase_order_items
  WHERE po_id = NEW.po_id;

  -- Update PO totals
  UPDATE inventory_purchase_orders
  SET subtotal = v_subtotal,
      total_amount = v_subtotal + COALESCE(tax_amount, 0) + COALESCE(shipping_cost, 0),
      updated_at = NOW()
  WHERE id = NEW.po_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_po_totals
AFTER INSERT OR UPDATE OR DELETE ON inventory_purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION calculate_po_totals();

-- Trigger: Update warehouse utilization
CREATE OR REPLACE FUNCTION update_warehouse_utilization()
RETURNS TRIGGER AS $$
DECLARE
  v_total_qty NUMERIC(14,2);
  v_capacity NUMERIC(14,2);
  v_utilization NUMERIC(5,2);
BEGIN
  -- Get total quantity in warehouse
  SELECT COALESCE(SUM(qty_available), 0) INTO v_total_qty
  FROM inventory_warehouse_stock
  WHERE warehouse_id = NEW.warehouse_id;

  -- Get warehouse capacity
  SELECT capacity INTO v_capacity
  FROM inventory_warehouses
  WHERE id = NEW.warehouse_id;

  -- Calculate utilization percentage
  IF v_capacity > 0 THEN
    v_utilization := (v_total_qty / v_capacity) * 100;
  ELSE
    v_utilization := 0;
  END IF;

  -- Update warehouse
  UPDATE inventory_warehouses
  SET current_utilization = v_utilization,
      updated_at = NOW()
  WHERE id = NEW.warehouse_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_warehouse_utilization
AFTER INSERT OR UPDATE ON inventory_warehouse_stock
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_utilization();

-- =====================================================
-- PART 5: DATABASE VIEWS FOR COMPLEX QUERIES
-- =====================================================

-- View: Product stock summary across all warehouses
CREATE OR REPLACE VIEW inventory_product_stock_summary AS
SELECT 
  p.id AS product_id,
  p.org_id,
  p.name AS product_name,
  p.sku,
  p.barcode,
  COALESCE(SUM(ws.qty_available), 0) AS total_available,
  COALESCE(SUM(ws.qty_reserved), 0) AS total_reserved,
  COALESCE(SUM(ws.qty_on_order), 0) AS total_on_order,
  COALESCE(SUM(ws.qty_allocated), 0) AS total_allocated,
  p.reorder_point,
  p.reorder_qty,
  CASE 
    WHEN COALESCE(SUM(ws.qty_available), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(ws.qty_available), 0) <= p.reorder_point THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  COUNT(DISTINCT ws.warehouse_id) AS warehouse_count
FROM inventory_products p
LEFT JOIN inventory_warehouse_stock ws ON ws.product_id = p.id
WHERE p.track_inventory = true
GROUP BY p.id, p.org_id, p.name, p.sku, p.barcode, p.reorder_point, p.reorder_qty;

-- View: Supplier performance metrics
CREATE OR REPLACE VIEW inventory_supplier_performance AS
SELECT 
  s.id AS supplier_id,
  s.org_id,
  s.name AS supplier_name,
  COUNT(DISTINCT po.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) AS completed_orders,
  COALESCE(SUM(CASE WHEN po.status = 'received' THEN po.total_amount ELSE 0 END), 0) AS total_spent,
  COALESCE(AVG(CASE WHEN po.status = 'received' THEN po.received_date - po.order_date END), 0) AS avg_delivery_days,
  COUNT(DISTINCT ps.product_id) AS products_supplied,
  s.rating,
  s.is_active
FROM inventory_suppliers s
LEFT JOIN inventory_purchase_orders po ON po.supplier_id = s.id
LEFT JOIN inventory_product_suppliers ps ON ps.supplier_id = s.id
GROUP BY s.id, s.org_id, s.name, s.rating, s.is_active;

-- View: Warehouse performance metrics
CREATE OR REPLACE VIEW inventory_warehouse_performance AS
SELECT 
  w.id AS warehouse_id,
  w.org_id,
  w.name AS warehouse_name,
  w.type,
  COUNT(DISTINCT ws.product_id) AS unique_products,
  COALESCE(SUM(ws.qty_available), 0) AS total_units,
  COALESCE(SUM(ws.qty_available * p.price), 0) AS total_value,
  w.capacity,
  w.current_utilization,
  COUNT(DISTINCT CASE WHEN ws.qty_available <= p.reorder_point THEN ws.product_id END) AS low_stock_products,
  w.is_active
FROM inventory_warehouses w
LEFT JOIN inventory_warehouse_stock ws ON ws.warehouse_id = w.id
LEFT JOIN inventory_products p ON p.id = ws.product_id
GROUP BY w.id, w.org_id, w.name, w.type, w.capacity, w.current_utilization, w.is_active;

-- View: Expiring batches alert
CREATE OR REPLACE VIEW inventory_expiring_batches AS
SELECT 
  b.id AS batch_id,
  b.org_id,
  b.batch_number,
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  b.qty_current,
  b.expiry_date,
  b.expiry_date - CURRENT_DATE AS days_until_expiry,
  w.name AS warehouse_name,
  CASE 
    WHEN b.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
    WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_this_month'
    ELSE 'ok'
  END AS expiry_status
FROM inventory_batches b
JOIN inventory_products p ON p.id = b.product_id
LEFT JOIN inventory_warehouses w ON w.id = b.warehouse_id
WHERE b.status = 'active' 
  AND b.expiry_date IS NOT NULL
  AND b.qty_current > 0
ORDER BY b.expiry_date ASC;

-- =====================================================
-- PART 6: SEED DEFAULT WAREHOUSE
-- =====================================================

-- Create default warehouse for each organization that doesn't have one
INSERT INTO inventory_warehouses (org_id, name, code, type, is_default, is_active)
SELECT DISTINCT org_id, 'Main Warehouse', 'MAIN', 'warehouse', true, true
FROM inventory_products
WHERE org_id NOT IN (SELECT DISTINCT org_id FROM inventory_warehouses)
ON CONFLICT DO NOTHING;

-- Migrate existing stock_qty to warehouse_stock table
INSERT INTO inventory_warehouse_stock (org_id, product_id, warehouse_id, qty_available)
SELECT 
  p.org_id,
  p.id,
  w.id,
  p.stock_qty
FROM inventory_products p
JOIN inventory_warehouses w ON w.org_id = p.org_id AND w.is_default = true
WHERE p.track_inventory = true
  AND NOT EXISTS (
    SELECT 1 FROM inventory_warehouse_stock ws 
    WHERE ws.product_id = p.id AND ws.warehouse_id = w.id
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 7: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE inventory_warehouses IS 'Multi-location warehouse/store management';
COMMENT ON TABLE inventory_warehouse_stock IS 'Stock levels per product per warehouse';
COMMENT ON TABLE inventory_suppliers IS 'Supplier/vendor management';
COMMENT ON TABLE inventory_product_suppliers IS 'Product-supplier relationships with pricing';
COMMENT ON TABLE inventory_purchase_orders IS 'Purchase orders to suppliers';
COMMENT ON TABLE inventory_purchase_order_items IS 'Line items in purchase orders';
COMMENT ON TABLE inventory_batches IS 'Batch/lot tracking with expiry dates';
COMMENT ON TABLE inventory_serial_numbers IS 'Serial number tracking for individual units';
COMMENT ON TABLE inventory_stock_transfers IS 'Inter-warehouse stock transfers';
COMMENT ON TABLE inventory_stock_transfer_items IS 'Items in stock transfers';
COMMENT ON TABLE inventory_stock_adjustments IS 'Stock corrections and adjustments';
COMMENT ON TABLE inventory_stock_adjustment_items IS 'Items in stock adjustments';
COMMENT ON TABLE inventory_product_variants IS 'Product variants (size, color, etc.)';
COMMENT ON TABLE inventory_low_stock_alerts IS 'Automated low stock notifications';
COMMENT ON TABLE inventory_valuation_snapshots IS 'Historical inventory valuation for reporting';
COMMENT ON TABLE inventory_forecasts IS 'Demand forecasting and reorder suggestions';
COMMENT ON TABLE inventory_audit_log IS 'Complete audit trail of all inventory changes';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Module 24: Inventory Management upgraded to enterprise-grade
-- 17 new tables, 60+ indexes, 6 triggers, 4 views
-- Benchmark: TradeGecko, Cin7, Zoho Inventory, Fishbowl
-- =====================================================
