const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/inventoryController');
const r = Router();

r.use(requireAuth);

// Dashboard & Stats
r.get('/dashboard', c.getDashboard);
r.get('/stats', c.getStats);

// Categories (Legacy)
r.get('/categories', c.listCategories);
r.post('/categories', c.createCategory);
r.delete('/categories/:id', c.deleteCategory);

// Products (Legacy)
r.get('/products', c.listProducts);
r.post('/products', c.createProduct);
r.put('/products/:id', c.updateProduct);
r.delete('/products/:id', c.deleteProduct);

// Transactions (Legacy)
r.get('/transactions', c.listTransactions);
r.post('/transactions', c.addTransaction);

// Warehouses
r.get('/warehouses', c.listWarehouses);
r.get('/warehouses/:id', c.getWarehouse);
r.post('/warehouses', c.createWarehouse);
r.put('/warehouses/:id', c.updateWarehouse);
r.delete('/warehouses/:id', c.deleteWarehouse);
r.get('/warehouses/:id/stock', c.getWarehouseStock);

// Suppliers
r.get('/suppliers', c.listSuppliers);
r.get('/suppliers/:id', c.getSupplier);
r.post('/suppliers', c.createSupplier);
r.put('/suppliers/:id', c.updateSupplier);
r.delete('/suppliers/:id', c.deleteSupplier);
r.get('/suppliers/:id/products', c.getSupplierProducts);
r.post('/product-suppliers', c.addProductSupplier);
r.put('/product-suppliers/:id', c.updateProductSupplier);

// Purchase Orders
r.get('/purchase-orders', c.listPurchaseOrders);
r.get('/purchase-orders/:id', c.getPurchaseOrder);
r.post('/purchase-orders', c.createPurchaseOrder);
r.put('/purchase-orders/:id/status', c.updatePurchaseOrderStatus);
r.post('/purchase-orders/:id/receive', c.receivePurchaseOrder);

// Batches & Serial Numbers
r.get('/batches', c.listBatches);
r.get('/batches/:id', c.getBatch);
r.get('/serial-numbers', c.listSerialNumbers);
r.post('/serial-numbers', c.addSerialNumber);
r.put('/serial-numbers/:id/status', c.updateSerialNumberStatus);

// Stock Transfers
r.get('/stock-transfers', c.listStockTransfers);
r.get('/stock-transfers/:id', c.getStockTransfer);
r.post('/stock-transfers', c.createStockTransfer);
r.put('/stock-transfers/:id/status', c.updateStockTransferStatus);

// Stock Adjustments
r.get('/stock-adjustments', c.listStockAdjustments);
r.get('/stock-adjustments/:id', c.getStockAdjustment);
r.post('/stock-adjustments', c.createStockAdjustment);
r.post('/stock-adjustments/:id/approve', c.approveStockAdjustment);

// Product Variants
r.get('/product-variants', c.listProductVariants);
r.post('/product-variants', c.createProductVariant);
r.put('/product-variants/:id', c.updateProductVariant);

// Alerts
r.get('/alerts', c.listLowStockAlerts);
r.post('/alerts/:id/acknowledge', c.acknowledgeAlert);
r.post('/alerts/:id/resolve', c.resolveAlert);

// Reports
r.get('/reports/stock-movement', c.getStockMovementReport);
r.get('/reports/valuation', c.getValuationReport);
r.get('/reports/expiring-batches', c.getExpiringBatchesReport);
r.get('/reports/reorder', c.getReorderReport);

// Legacy bulk operations
r.post("/bulk-delete", bulkDeleteHandler("inventory_items"));
r.get("/export", async (req, res) => { 
  const { rows } = await db.query("SELECT * FROM inventory_items WHERE org_id = $1", [req.user.orgId]); 
  sendCsv(res, "inventory_items.csv", rows, autoColumns(rows)); 
});

module.exports = r;