const db = require('../db');

class InventoryService {
  // =====================================================
  // WAREHOUSE MANAGEMENT
  // =====================================================

  async listWarehouses(orgId, filters = {}) {
    const { isActive, type } = filters;
    const conditions = ['org_id = $1'];
    const values = [orgId];
    let paramIndex = 2;

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(type);
    }

    const query = `
      SELECT w.*, 
        u.full_name as manager_name,
        (SELECT COUNT(*) FROM inventory_warehouse_stock WHERE warehouse_id = w.id) as product_count
      FROM inventory_warehouses w
      LEFT JOIN users u ON u.id = w.manager_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY w.is_default DESC, w.name
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  async getWarehouse(orgId, warehouseId) {
    const { rows } = await db.query(
      `SELECT w.*, 
        u.full_name as manager_name,
        (SELECT COUNT(*) FROM inventory_warehouse_stock WHERE warehouse_id = w.id) as product_count,
        (SELECT COALESCE(SUM(qty_available), 0) FROM inventory_warehouse_stock WHERE warehouse_id = w.id) as total_units
      FROM inventory_warehouses w
      LEFT JOIN users u ON u.id = w.manager_id
      WHERE w.id = $1 AND w.org_id = $2`,
      [warehouseId, orgId]
    );
    return rows[0] || null;
  }

  async createWarehouse(orgId, data) {
    const {
      name, code, type, address, city, state, country, postalCode,
      phone, email, managerId, isDefault, capacity, notes
    } = data;

    const { rows } = await db.query(
      `INSERT INTO inventory_warehouses 
        (org_id, name, code, type, address, city, state, country, postal_code, 
         phone, email, manager_id, is_default, capacity, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [orgId, name, code, type || 'warehouse', address, city, state, country, postalCode,
       phone, email, managerId, isDefault || false, capacity, notes]
    );

    return rows[0];
  }

  async updateWarehouse(orgId, warehouseId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = ['name', 'code', 'type', 'address', 'city', 'state', 'country', 
                    'postal_code', 'phone', 'email', 'manager_id', 'is_default', 
                    'is_active', 'capacity', 'notes'];

    for (const field of fields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(data[camelField]);
      }
    }

    if (updates.length === 0) return null;

    values.push(warehouseId, orgId);
    const { rows } = await db.query(
      `UPDATE inventory_warehouses 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  async deleteWarehouse(orgId, warehouseId) {
    // Check if warehouse has stock
    const { rows: stockCheck } = await db.query(
      'SELECT COUNT(*) as count FROM inventory_warehouse_stock WHERE warehouse_id = $1 AND qty_available > 0',
      [warehouseId]
    );

    if (parseInt(stockCheck[0].count) > 0) {
      throw new Error('Cannot delete warehouse with existing stock');
    }

    await db.query(
      'DELETE FROM inventory_warehouses WHERE id = $1 AND org_id = $2',
      [warehouseId, orgId]
    );

    return true;
  }

  async getWarehouseStock(orgId, warehouseId, filters = {}) {
    const { search, lowStock } = filters;
    const conditions = ['ws.org_id = $1', 'ws.warehouse_id = $2'];
    const values = [orgId, warehouseId];
    let paramIndex = 3;

    if (search) {
      conditions.push(`p.name ILIKE $${paramIndex++}`);
      values.push(`%${search}%`);
    }

    if (lowStock) {
      conditions.push('ws.qty_available <= p.reorder_point');
    }

    const query = `
      SELECT ws.*, p.name, p.sku, p.barcode, p.reorder_point, p.unit,
        CASE 
          WHEN ws.qty_available = 0 THEN 'out_of_stock'
          WHEN ws.qty_available <= p.reorder_point THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM inventory_warehouse_stock ws
      JOIN inventory_products p ON p.id = ws.product_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.name
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  // =====================================================
  // SUPPLIER MANAGEMENT
  // =====================================================

  async listSuppliers(orgId, filters = {}) {
    const { isActive, search } = filters;
    const conditions = ['org_id = $1'];
    const values = [orgId];
    let paramIndex = 2;

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (search) {
      conditions.push(`name ILIKE $${paramIndex++}`);
      values.push(`%${search}%`);
    }

    const query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM inventory_product_suppliers WHERE supplier_id = s.id) as products_count,
        (SELECT COUNT(*) FROM inventory_purchase_orders WHERE supplier_id = s.id) as orders_count
      FROM inventory_suppliers s
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.name
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  async getSupplier(orgId, supplierId) {
    const { rows } = await db.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM inventory_product_suppliers WHERE supplier_id = s.id) as products_count,
        (SELECT COUNT(*) FROM inventory_purchase_orders WHERE supplier_id = s.id) as orders_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM inventory_purchase_orders WHERE supplier_id = s.id AND status = 'received') as total_spent
      FROM inventory_suppliers s
      WHERE s.id = $1 AND s.org_id = $2`,
      [supplierId, orgId]
    );
    return rows[0] || null;
  }

  async createSupplier(orgId, data) {
    const {
      name, code, contactPerson, email, phone, website, address, city, state,
      country, postalCode, taxId, paymentTerms, currency, creditLimit, rating, notes
    } = data;

    const { rows } = await db.query(
      `INSERT INTO inventory_suppliers 
        (org_id, name, code, contact_person, email, phone, website, address, city, state,
         country, postal_code, tax_id, payment_terms, currency, credit_limit, rating, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [orgId, name, code, contactPerson, email, phone, website, address, city, state,
       country, postalCode, taxId, paymentTerms, currency || 'USD', creditLimit || 0, rating, notes]
    );

    return rows[0];
  }

  async updateSupplier(orgId, supplierId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = ['name', 'code', 'contact_person', 'email', 'phone', 'website', 
                    'address', 'city', 'state', 'country', 'postal_code', 'tax_id',
                    'payment_terms', 'currency', 'credit_limit', 'rating', 'is_active', 'notes'];

    for (const field of fields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(data[camelField]);
      }
    }

    if (updates.length === 0) return null;

    values.push(supplierId, orgId);
    const { rows } = await db.query(
      `UPDATE inventory_suppliers 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  async deleteSupplier(orgId, supplierId) {
    // Check if supplier has active POs
    const { rows: poCheck } = await db.query(
      `SELECT COUNT(*) as count FROM inventory_purchase_orders 
       WHERE supplier_id = $1 AND status NOT IN ('received', 'cancelled')`,
      [supplierId]
    );

    if (parseInt(poCheck[0].count) > 0) {
      throw new Error('Cannot delete supplier with active purchase orders');
    }

    await db.query(
      'DELETE FROM inventory_suppliers WHERE id = $1 AND org_id = $2',
      [supplierId, orgId]
    );

    return true;
  }

  async getSupplierProducts(orgId, supplierId) {
    const { rows } = await db.query(
      `SELECT ps.*, p.name, p.sku, p.barcode
      FROM inventory_product_suppliers ps
      JOIN inventory_products p ON p.id = ps.product_id
      WHERE ps.org_id = $1 AND ps.supplier_id = $2
      ORDER BY p.name`,
      [orgId, supplierId]
    );
    return rows;
  }

  async addProductSupplier(orgId, data) {
    const { productId, supplierId, supplierSku, cost, currency, leadTimeDays, minOrderQty, isPreferred } = data;

    const { rows } = await db.query(
      `INSERT INTO inventory_product_suppliers 
        (org_id, product_id, supplier_id, supplier_sku, cost, currency, lead_time_days, min_order_qty, is_preferred)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [orgId, productId, supplierId, supplierSku, cost, currency || 'USD', leadTimeDays || 0, minOrderQty || 1, isPreferred || false]
    );

    return rows[0];
  }

  async updateProductSupplier(orgId, productSupplierId, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = ['supplier_sku', 'cost', 'currency', 'lead_time_days', 'min_order_qty', 'is_preferred', 'is_active'];

    for (const field of fields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(data[camelField]);
      }
    }

    if (updates.length === 0) return null;

    values.push(productSupplierId, orgId);
    const { rows } = await db.query(
      `UPDATE inventory_product_suppliers 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  // =====================================================
  // ANALYTICS & REPORTING
  // =====================================================

  async getInventoryDashboard(orgId) {
    const [
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      activeWarehouses,
      activePOs,
      pendingTransfers,
      activeAlerts
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM inventory_products WHERE org_id = $1 AND status = $2', [orgId, 'active']),
      db.query(`SELECT COALESCE(SUM(ws.qty_available * p.price), 0) as value 
                FROM inventory_warehouse_stock ws 
                JOIN inventory_products p ON p.id = ws.product_id 
                WHERE ws.org_id = $1`, [orgId]),
      db.query(`SELECT COUNT(*) as count FROM inventory_products p
                WHERE p.org_id = $1 AND p.status = 'active' 
                AND EXISTS (SELECT 1 FROM inventory_warehouse_stock ws 
                           WHERE ws.product_id = p.id 
                           AND ws.qty_available > 0 
                           AND ws.qty_available <= p.reorder_point)`, [orgId]),
      db.query(`SELECT COUNT(*) as count FROM inventory_products p
                WHERE p.org_id = $1 AND p.status = 'active'
                AND NOT EXISTS (SELECT 1 FROM inventory_warehouse_stock ws 
                               WHERE ws.product_id = p.id AND ws.qty_available > 0)`, [orgId]),
      db.query('SELECT COUNT(*) as count FROM inventory_warehouses WHERE org_id = $1 AND is_active = true', [orgId]),
      db.query(`SELECT COUNT(*) as count FROM inventory_purchase_orders 
                WHERE org_id = $1 AND status NOT IN ('received', 'cancelled')`, [orgId]),
      db.query(`SELECT COUNT(*) as count FROM inventory_stock_transfers 
                WHERE org_id = $1 AND status IN ('pending', 'in_transit')`, [orgId]),
      db.query('SELECT COUNT(*) as count FROM inventory_low_stock_alerts WHERE org_id = $1 AND status = $2', [orgId, 'active'])
    ]);

    return {
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalValue: parseFloat(totalValue.rows[0].value),
      lowStockCount: parseInt(lowStockCount.rows[0].count),
      outOfStockCount: parseInt(outOfStockCount.rows[0].count),
      activeWarehouses: parseInt(activeWarehouses.rows[0].count),
      activePurchaseOrders: parseInt(activePOs.rows[0].count),
      pendingTransfers: parseInt(pendingTransfers.rows[0].count),
      activeAlerts: parseInt(activeAlerts.rows[0].count)
    };
  }

  async getStockMovementReport(orgId, filters = {}) {
    const { startDate, endDate, productId, warehouseId } = filters;
    const conditions = ['t.org_id = $1'];
    const values = [orgId];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`t.created_at >= $${paramIndex++}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`t.created_at <= $${paramIndex++}`);
      values.push(endDate);
    }
    if (productId) {
      conditions.push(`t.product_id = $${paramIndex++}`);
      values.push(productId);
    }
    if (warehouseId) {
      conditions.push(`t.warehouse_id = $${paramIndex++}`);
      values.push(warehouseId);
    }

    const query = `
      SELECT t.*, p.name as product_name, p.sku, w.name as warehouse_name, u.full_name as user_name
      FROM inventory_transactions t
      JOIN inventory_products p ON p.id = t.product_id
      LEFT JOIN inventory_warehouses w ON w.id = t.warehouse_id
      LEFT JOIN users u ON u.id = t.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT 1000
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  async getValuationReport(orgId, warehouseId = null) {
    const conditions = ['ws.org_id = $1'];
    const values = [orgId];
    let paramIndex = 2;

    if (warehouseId) {
      conditions.push(`ws.warehouse_id = $${paramIndex++}`);
      values.push(warehouseId);
    }

    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name,
        ws.qty_available,
        p.cost as unit_cost,
        p.price as unit_price,
        ws.qty_available * p.cost as total_cost,
        ws.qty_available * p.price as total_value,
        (ws.qty_available * p.price) - (ws.qty_available * p.cost) as potential_profit
      FROM inventory_warehouse_stock ws
      JOIN inventory_products p ON p.id = ws.product_id
      JOIN inventory_warehouses w ON w.id = ws.warehouse_id
      WHERE ${conditions.join(' AND ')} AND ws.qty_available > 0
      ORDER BY total_value DESC
    `;

    const { rows } = await db.query(query, values);
    
    const summary = {
      totalCost: rows.reduce((sum, r) => sum + parseFloat(r.total_cost || 0), 0),
      totalValue: rows.reduce((sum, r) => sum + parseFloat(r.total_value || 0), 0),
      potentialProfit: rows.reduce((sum, r) => sum + parseFloat(r.potential_profit || 0), 0),
      items: rows
    };

    return summary;
  }

  async getExpiringBatchesReport(orgId, daysAhead = 30) {
    const { rows } = await db.query(
      `SELECT b.*, p.name as product_name, p.sku, w.name as warehouse_name,
        b.expiry_date - CURRENT_DATE as days_until_expiry
      FROM inventory_batches b
      JOIN inventory_products p ON p.id = b.product_id
      LEFT JOIN inventory_warehouses w ON w.id = b.warehouse_id
      WHERE b.org_id = $1 
        AND b.status = 'active'
        AND b.expiry_date IS NOT NULL
        AND b.expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
        AND b.qty_current > 0
      ORDER BY b.expiry_date ASC`,
      [orgId, daysAhead]
    );

    return rows;
  }

  async getReorderReport(orgId) {
    const { rows } = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.sku,
        p.reorder_point,
        p.reorder_qty,
        p.lead_time_days,
        COALESCE(SUM(ws.qty_available), 0) as current_stock,
        COALESCE(SUM(ws.qty_on_order), 0) as qty_on_order,
        p.reorder_qty as suggested_order_qty,
        ps.supplier_id,
        s.name as preferred_supplier,
        ps.cost as unit_cost,
        ps.lead_time_days as supplier_lead_time
      FROM inventory_products p
      LEFT JOIN inventory_warehouse_stock ws ON ws.product_id = p.id
      LEFT JOIN inventory_product_suppliers ps ON ps.product_id = p.id AND ps.is_preferred = true
      LEFT JOIN inventory_suppliers s ON s.id = ps.supplier_id
      WHERE p.org_id = $1 
        AND p.status = 'active'
        AND p.track_inventory = true
      GROUP BY p.id, p.name, p.sku, p.reorder_point, p.reorder_qty, p.lead_time_days, 
               ps.supplier_id, s.name, ps.cost, ps.lead_time_days
      HAVING COALESCE(SUM(ws.qty_available), 0) <= p.reorder_point
      ORDER BY (p.reorder_point - COALESCE(SUM(ws.qty_available), 0)) DESC`,
      [orgId]
    );

    return rows;
  }
}

module.exports = new InventoryService();
