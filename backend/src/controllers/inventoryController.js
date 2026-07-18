const db = require('../db');
const InventoryService = require('../services/InventoryService');

// =====================================================
// DASHBOARD & STATS
// =====================================================

async function getDashboard(req, res) {
  try {
    const dashboard = await InventoryService.getInventoryDashboard(req.user.orgId);
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting inventory dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
}

async function getStats(req, res) {
  const [prodRes, lowRes, outRes, valRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active' AND stock_qty<=low_stock_threshold AND stock_qty>0`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active' AND stock_qty=0`, [req.user.orgId]),
    db.query(`SELECT COALESCE(SUM(stock_qty*price),0) AS v FROM inventory_products WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
  ]);
  res.json({ totalProducts: prodRes.rows[0].c, lowStock: lowRes.rows[0].c, outOfStock: outRes.rows[0].c, totalValue: Number(valRes.rows[0].v) });
}

// =====================================================
// CATEGORIES (Legacy - keeping for backward compatibility)
// =====================================================

async function listCategories(req, res) {
  const { rows } = await db.query(`SELECT * FROM inventory_categories WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ categories: rows });
}

async function createCategory(req, res) {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(`INSERT INTO inventory_categories (org_id,name) VALUES ($1,$2) RETURNING *`, [req.user.orgId, name.trim()]);
  res.status(201).json({ category: rows[0] });
}

async function deleteCategory(req, res) {
  await db.query(`DELETE FROM inventory_categories WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// =====================================================
// PRODUCTS (Legacy - keeping for backward compatibility)
// =====================================================

async function listProducts(req, res) {
  const { category, status, search } = req.query;
  const conditions = ['p.org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (category) { conditions.push(`p.category_id=$${i++}`); vals.push(category); }
  if (status)   { conditions.push(`p.status=$${i++}`);      vals.push(status); }
  if (search)   { conditions.push(`p.name ILIKE $${i++}`);  vals.push(`%${search}%`); }
  const { rows } = await db.query(
    `SELECT p.*, c.name AS category_name FROM inventory_products p
     LEFT JOIN inventory_categories c ON c.id=p.category_id
     WHERE ${conditions.join(' AND ')} ORDER BY p.name`,
    vals
  );
  res.json({ products: rows });
}

async function createProduct(req, res) {
  const { name, sku, description, categoryId, price, cost, stockQty, lowStockThreshold, unit, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO inventory_products (org_id,category_id,name,sku,description,price,cost,stock_qty,low_stock_threshold,unit,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.orgId, categoryId||null, name.trim(), sku||null, description||null, Number(price)||0, Number(cost)||0, Number(stockQty)||0, Number(lowStockThreshold)||5, unit||'pcs', status||'active']
  );
  res.status(201).json({ product: rows[0] });
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, sku, description, categoryId, price, cost, stockQty, lowStockThreshold, unit, status } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name              !== undefined) { updates.push(`name=$${i++}`);                vals.push(name.trim()); }
  if (sku               !== undefined) { updates.push(`sku=$${i++}`);                 vals.push(sku||null); }
  if (description       !== undefined) { updates.push(`description=$${i++}`);         vals.push(description||null); }
  if (categoryId        !== undefined) { updates.push(`category_id=$${i++}`);         vals.push(categoryId||null); }
  if (price             !== undefined) { updates.push(`price=$${i++}`);               vals.push(Number(price)); }
  if (cost              !== undefined) { updates.push(`cost=$${i++}`);                vals.push(Number(cost)); }
  if (stockQty          !== undefined) { updates.push(`stock_qty=$${i++}`);           vals.push(Number(stockQty)); }
  if (lowStockThreshold !== undefined) { updates.push(`low_stock_threshold=$${i++}`); vals.push(Number(lowStockThreshold)); }
  if (unit              !== undefined) { updates.push(`unit=$${i++}`);                vals.push(unit||'pcs'); }
  if (status            !== undefined) { updates.push(`status=$${i++}`);              vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE inventory_products SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: rows[0] });
}

async function deleteProduct(req, res) {
  await db.query(`DELETE FROM inventory_products WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// =====================================================
// TRANSACTIONS (Legacy - keeping for backward compatibility)
// =====================================================

async function listTransactions(req, res) {
  const { productId } = req.query;
  const vals = [req.user.orgId];
  const extra = productId ? ' AND t.product_id=$2' : '';
  if (productId) vals.push(productId);
  const { rows } = await db.query(
    `SELECT t.*, p.name AS product_name FROM inventory_transactions t
     JOIN inventory_products p ON p.id=t.product_id
     WHERE t.org_id=$1${extra} ORDER BY t.created_at DESC LIMIT 200`,
    vals
  );
  res.json({ transactions: rows });
}

async function addTransaction(req, res) {
  const { productId, type, qty, note, reference } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  if (!type)      return res.status(400).json({ error: 'type required' });
  const q = Number(qty);
  if (!q)         return res.status(400).json({ error: 'qty required' });
  await db.query('BEGIN');
  try {
    const delta = type === 'sale' ? -Math.abs(q) : type === 'purchase' || type === 'return' ? Math.abs(q) : q;
    await db.query(`UPDATE inventory_products SET stock_qty=stock_qty+$1 WHERE id=$2 AND org_id=$3`, [delta, productId, req.user.orgId]);
    const { rows } = await db.query(
      `INSERT INTO inventory_transactions (org_id,product_id,type,qty,note,reference) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.orgId, productId, type, q, note||null, reference||null]
    );
    await db.query('COMMIT');
    res.status(201).json({ transaction: rows[0] });
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

// =====================================================
// WAREHOUSES
// =====================================================

async function listWarehouses(req, res) {
  try {
    const { isActive, type } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (type) filters.type = type;

    const warehouses = await InventoryService.listWarehouses(req.user.orgId, filters);
    res.json({ warehouses });
  } catch (error) {
    console.error('Error listing warehouses:', error);
    res.status(500).json({ error: 'Failed to list warehouses' });
  }
}

async function getWarehouse(req, res) {
  try {
    const warehouse = await InventoryService.getWarehouse(req.user.orgId, req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (error) {
    console.error('Error getting warehouse:', error);
    res.status(500).json({ error: 'Failed to get warehouse' });
  }
}

async function createWarehouse(req, res) {
  try {
    const warehouse = await InventoryService.createWarehouse(req.user.orgId, req.body);
    res.status(201).json({ warehouse });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ error: error.message || 'Failed to create warehouse' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const warehouse = await InventoryService.updateWarehouse(req.user.orgId, req.params.id, req.body);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ error: error.message || 'Failed to update warehouse' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    await InventoryService.deleteWarehouse(req.user.orgId, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ error: error.message || 'Failed to delete warehouse' });
  }
}

async function getWarehouseStock(req, res) {
  try {
    const { search, lowStock } = req.query;
    const filters = {};
    if (search) filters.search = search;
    if (lowStock) filters.lowStock = lowStock === 'true';

    const stock = await InventoryService.getWarehouseStock(req.user.orgId, req.params.id, filters);
    res.json({ stock });
  } catch (error) {
    console.error('Error getting warehouse stock:', error);
    res.status(500).json({ error: 'Failed to get warehouse stock' });
  }
}

// =====================================================
// SUPPLIERS
// =====================================================

async function listSuppliers(req, res) {
  try {
    const { isActive, search } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const suppliers = await InventoryService.listSuppliers(req.user.orgId, filters);
    res.json({ suppliers });
  } catch (error) {
    console.error('Error listing suppliers:', error);
    res.status(500).json({ error: 'Failed to list suppliers' });
  }
}

async function getSupplier(req, res) {
  try {
    const supplier = await InventoryService.getSupplier(req.user.orgId, req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
}

async function createSupplier(req, res) {
  try {
    const supplier = await InventoryService.createSupplier(req.user.orgId, req.body);
    res.status(201).json({ supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to create supplier' });
  }
}

async function updateSupplier(req, res) {
  try {
    const supplier = await InventoryService.updateSupplier(req.user.orgId, req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to update supplier' });
  }
}

async function deleteSupplier(req, res) {
  try {
    await InventoryService.deleteSupplier(req.user.orgId, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to delete supplier' });
  }
}

async function getSupplierProducts(req, res) {
  try {
    const products = await InventoryService.getSupplierProducts(req.user.orgId, req.params.id);
    res.json({ products });
  } catch (error) {
    console.error('Error getting supplier products:', error);
    res.status(500).json({ error: 'Failed to get supplier products' });
  }
}

async function addProductSupplier(req, res) {
  try {
    const productSupplier = await InventoryService.addProductSupplier(req.user.orgId, req.body);
    res.status(201).json({ productSupplier });
  } catch (error) {
    console.error('Error adding product supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to add product supplier' });
  }
}

async function updateProductSupplier(req, res) {
  try {
    const productSupplier = await InventoryService.updateProductSupplier(req.user.orgId, req.params.id, req.body);
    if (!productSupplier) return res.status(404).json({ error: 'Product supplier not found' });
    res.json({ productSupplier });
  } catch (error) {
    console.error('Error updating product supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to update product supplier' });
  }
}

// =====================================================
// PURCHASE ORDERS
// =====================================================

async function listPurchaseOrders(req, res) {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const purchaseOrders = await InventoryService.listPurchaseOrders(req.user.orgId, filters);
    res.json({ purchaseOrders });
  } catch (error) {
    console.error('Error listing purchase orders:', error);
    res.status(500).json({ error: 'Failed to list purchase orders' });
  }
}

async function getPurchaseOrder(req, res) {
  try {
    const purchaseOrder = await InventoryService.getPurchaseOrder(req.user.orgId, req.params.id);
    if (!purchaseOrder) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ purchaseOrder });
  } catch (error) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ error: 'Failed to get purchase order' });
  }
}

async function createPurchaseOrder(req, res) {
  try {
    const purchaseOrder = await InventoryService.createPurchaseOrder(req.user.orgId, req.user.id, req.body);
    res.status(201).json({ purchaseOrder });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: error.message || 'Failed to create purchase order' });
  }
}

async function updatePurchaseOrderStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    const purchaseOrder = await InventoryService.updatePurchaseOrderStatus(req.user.orgId, req.params.id, status, req.user.id);
    if (!purchaseOrder) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ purchaseOrder });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ error: error.message || 'Failed to update purchase order status' });
  }
}

async function receivePurchaseOrder(req, res) {
  try {
    const { receivedItems } = req.body;
    if (!receivedItems || !Array.isArray(receivedItems)) {
      return res.status(400).json({ error: 'receivedItems array required' });
    }

    const purchaseOrder = await InventoryService.receivePurchaseOrder(req.user.orgId, req.params.id, req.user.id, receivedItems);
    res.json({ purchaseOrder });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    res.status(500).json({ error: error.message || 'Failed to receive purchase order' });
  }
}

// =====================================================
// BATCHES & SERIAL NUMBERS
// =====================================================

async function listBatches(req, res) {
  try {
    const { productId, warehouseId, status, expiringSoon } = req.query;
    const filters = {};
    if (productId) filters.productId = productId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (status) filters.status = status;
    if (expiringSoon) filters.expiringSoon = expiringSoon === 'true';

    const batches = await InventoryService.listBatches(req.user.orgId, filters);
    res.json({ batches });
  } catch (error) {
    console.error('Error listing batches:', error);
    res.status(500).json({ error: 'Failed to list batches' });
  }
}

async function getBatch(req, res) {
  try {
    const batch = await InventoryService.getBatch(req.user.orgId, req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json({ batch });
  } catch (error) {
    console.error('Error getting batch:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
}

async function listSerialNumbers(req, res) {
  try {
    const { productId, warehouseId, status } = req.query;
    const filters = {};
    if (productId) filters.productId = productId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (status) filters.status = status;

    const serialNumbers = await InventoryService.listSerialNumbers(req.user.orgId, filters);
    res.json({ serialNumbers });
  } catch (error) {
    console.error('Error listing serial numbers:', error);
    res.status(500).json({ error: 'Failed to list serial numbers' });
  }
}

async function addSerialNumber(req, res) {
  try {
    const serialNumber = await InventoryService.addSerialNumber(req.user.orgId, req.body);
    res.status(201).json({ serialNumber });
  } catch (error) {
    console.error('Error adding serial number:', error);
    res.status(500).json({ error: error.message || 'Failed to add serial number' });
  }
}

async function updateSerialNumberStatus(req, res) {
  try {
    const { status, customerId, orderId } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    const serialNumber = await InventoryService.updateSerialNumberStatus(req.user.orgId, req.params.id, status, customerId, orderId);
    if (!serialNumber) return res.status(404).json({ error: 'Serial number not found' });
    res.json({ serialNumber });
  } catch (error) {
    console.error('Error updating serial number status:', error);
    res.status(500).json({ error: error.message || 'Failed to update serial number status' });
  }
}

// =====================================================
// STOCK TRANSFERS
// =====================================================

async function listStockTransfers(req, res) {
  try {
    const { status, fromWarehouseId, toWarehouseId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (fromWarehouseId) filters.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) filters.toWarehouseId = toWarehouseId;

    const stockTransfers = await InventoryService.listStockTransfers(req.user.orgId, filters);
    res.json({ stockTransfers });
  } catch (error) {
    console.error('Error listing stock transfers:', error);
    res.status(500).json({ error: 'Failed to list stock transfers' });
  }
}

async function getStockTransfer(req, res) {
  try {
    const stockTransfer = await InventoryService.getStockTransfer(req.user.orgId, req.params.id);
    if (!stockTransfer) return res.status(404).json({ error: 'Stock transfer not found' });
    res.json({ stockTransfer });
  } catch (error) {
    console.error('Error getting stock transfer:', error);
    res.status(500).json({ error: 'Failed to get stock transfer' });
  }
}

async function createStockTransfer(req, res) {
  try {
    const stockTransfer = await InventoryService.createStockTransfer(req.user.orgId, req.user.id, req.body);
    res.status(201).json({ stockTransfer });
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    res.status(500).json({ error: error.message || 'Failed to create stock transfer' });
  }
}

async function updateStockTransferStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    const stockTransfer = await InventoryService.updateStockTransferStatus(req.user.orgId, req.params.id, status, req.user.id);
    if (!stockTransfer) return res.status(404).json({ error: 'Stock transfer not found' });
    res.json({ stockTransfer });
  } catch (error) {
    console.error('Error updating stock transfer status:', error);
    res.status(500).json({ error: error.message || 'Failed to update stock transfer status' });
  }
}

// =====================================================
// STOCK ADJUSTMENTS
// =====================================================

async function listStockAdjustments(req, res) {
  try {
    const { status, warehouseId, type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (type) filters.type = type;

    const stockAdjustments = await InventoryService.listStockAdjustments(req.user.orgId, filters);
    res.json({ stockAdjustments });
  } catch (error) {
    console.error('Error listing stock adjustments:', error);
    res.status(500).json({ error: 'Failed to list stock adjustments' });
  }
}

async function getStockAdjustment(req, res) {
  try {
    const stockAdjustment = await InventoryService.getStockAdjustment(req.user.orgId, req.params.id);
    if (!stockAdjustment) return res.status(404).json({ error: 'Stock adjustment not found' });
    res.json({ stockAdjustment });
  } catch (error) {
    console.error('Error getting stock adjustment:', error);
    res.status(500).json({ error: 'Failed to get stock adjustment' });
  }
}

async function createStockAdjustment(req, res) {
  try {
    const stockAdjustment = await InventoryService.createStockAdjustment(req.user.orgId, req.user.id, req.body);
    res.status(201).json({ stockAdjustment });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ error: error.message || 'Failed to create stock adjustment' });
  }
}

async function approveStockAdjustment(req, res) {
  try {
    const stockAdjustment = await InventoryService.approveStockAdjustment(req.user.orgId, req.params.id, req.user.id);
    res.json({ stockAdjustment });
  } catch (error) {
    console.error('Error approving stock adjustment:', error);
    res.status(500).json({ error: error.message || 'Failed to approve stock adjustment' });
  }
}

// =====================================================
// PRODUCT VARIANTS
// =====================================================

async function listProductVariants(req, res) {
  try {
    const { parentProductId } = req.query;
    if (!parentProductId) return res.status(400).json({ error: 'parentProductId required' });

    const variants = await InventoryService.listProductVariants(req.user.orgId, parentProductId);
    res.json({ variants });
  } catch (error) {
    console.error('Error listing product variants:', error);
    res.status(500).json({ error: 'Failed to list product variants' });
  }
}

async function createProductVariant(req, res) {
  try {
    const variant = await InventoryService.createProductVariant(req.user.orgId, req.body);
    res.status(201).json({ variant });
  } catch (error) {
    console.error('Error creating product variant:', error);
    res.status(500).json({ error: error.message || 'Failed to create product variant' });
  }
}

async function updateProductVariant(req, res) {
  try {
    const variant = await InventoryService.updateProductVariant(req.user.orgId, req.params.id, req.body);
    if (!variant) return res.status(404).json({ error: 'Product variant not found' });
    res.json({ variant });
  } catch (error) {
    console.error('Error updating product variant:', error);
    res.status(500).json({ error: error.message || 'Failed to update product variant' });
  }
}

// =====================================================
// ALERTS
// =====================================================

async function listLowStockAlerts(req, res) {
  try {
    const { status, alertType, warehouseId } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (alertType) filters.alertType = alertType;
    if (warehouseId) filters.warehouseId = warehouseId;

    const alerts = await InventoryService.listLowStockAlerts(req.user.orgId, filters);
    res.json({ alerts });
  } catch (error) {
    console.error('Error listing low stock alerts:', error);
    res.status(500).json({ error: 'Failed to list low stock alerts' });
  }
}

async function acknowledgeAlert(req, res) {
  try {
    const alert = await InventoryService.acknowledgeAlert(req.user.orgId, req.params.id, req.user.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
  }
}

async function resolveAlert(req, res) {
  try {
    const alert = await InventoryService.resolveAlert(req.user.orgId, req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve alert' });
  }
}

// =====================================================
// REPORTS
// =====================================================

async function getStockMovementReport(req, res) {
  try {
    const { startDate, endDate, productId, warehouseId } = req.query;
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (productId) filters.productId = productId;
    if (warehouseId) filters.warehouseId = warehouseId;

    const report = await InventoryService.getStockMovementReport(req.user.orgId, filters);
    res.json({ report });
  } catch (error) {
    console.error('Error getting stock movement report:', error);
    res.status(500).json({ error: 'Failed to get stock movement report' });
  }
}

async function getValuationReport(req, res) {
  try {
    const { warehouseId } = req.query;
    const report = await InventoryService.getValuationReport(req.user.orgId, warehouseId || null);
    res.json(report);
  } catch (error) {
    console.error('Error getting valuation report:', error);
    res.status(500).json({ error: 'Failed to get valuation report' });
  }
}

async function getExpiringBatchesReport(req, res) {
  try {
    const { daysAhead } = req.query;
    const report = await InventoryService.getExpiringBatchesReport(req.user.orgId, parseInt(daysAhead) || 30);
    res.json({ report });
  } catch (error) {
    console.error('Error getting expiring batches report:', error);
    res.status(500).json({ error: 'Failed to get expiring batches report' });
  }
}

async function getReorderReport(req, res) {
  try {
    const report = await InventoryService.getReorderReport(req.user.orgId);
    res.json({ report });
  } catch (error) {
    console.error('Error getting reorder report:', error);
    res.status(500).json({ error: 'Failed to get reorder report' });
  }
}

module.exports = { 
  getDashboard,
  getStats, 
  listCategories, 
  createCategory, 
  deleteCategory, 
  listProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  listTransactions, 
  addTransaction,
  // Warehouses
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseStock,
  // Suppliers
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  addProductSupplier,
  updateProductSupplier,
  // Purchase Orders
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  // Batches & Serial Numbers
  listBatches,
  getBatch,
  listSerialNumbers,
  addSerialNumber,
  updateSerialNumberStatus,
  // Stock Transfers
  listStockTransfers,
  getStockTransfer,
  createStockTransfer,
  updateStockTransferStatus,
  // Stock Adjustments
  listStockAdjustments,
  getStockAdjustment,
  createStockAdjustment,
  approveStockAdjustment,
  // Product Variants
  listProductVariants,
  createProductVariant,
  updateProductVariant,
  // Alerts
  listLowStockAlerts,
  acknowledgeAlert,
  resolveAlert,
  // Reports
  getStockMovementReport,
  getValuationReport,
  getExpiringBatchesReport,
  getReorderReport
};