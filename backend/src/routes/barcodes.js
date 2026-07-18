const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/barcodesController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const r = Router();

// =====================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================

// Public barcode resolution - must be before requireAuth
r.get('/resolve/:id', c.resolveBarcode);

// =====================================================
// PROTECTED ROUTES (Authentication Required)
// =====================================================

r.use(requireAuth);
r.use(requireModuleAccess('barcode-generator'));

// ── Core Barcode Management ──────────────────────────
r.get('/stats', c.getStats);
r.get('/', c.listBarcodes);
r.get('/:id', c.getBarcode);
r.post('/', c.createBarcode);
r.put('/:id', c.updateBarcode);
r.delete('/:id', c.deleteBarcode);
r.post('/bulk-delete', c.bulkDeleteBarcodes);

// ── Folders & Organization ───────────────────────────
r.get('/folders/list', c.listFolders);
r.post('/folders', c.createFolder);
r.put('/folders/:id', c.updateFolder);
r.delete('/folders/:id', c.deleteFolder);

// ── Templates ────────────────────────────────────────
r.get('/templates/list', c.listTemplates);
r.post('/templates', c.createTemplate);
r.put('/templates/:id', c.updateTemplate);
r.delete('/templates/:id', c.deleteTemplate);

// ── Batch Generation ─────────────────────────────────
r.get('/batches/list', c.listBatches);
r.get('/batches/:id', c.getBatch);
r.post('/batches', c.createBatch);
r.post('/batches/:id/process', c.processBatch);

// ── Analytics & Tracking ─────────────────────────────
r.get('/:id/analytics', c.getAnalytics);
r.post('/:id/scan', c.trackScan);

// ── Print Templates ──────────────────────────────────
r.get('/print-templates/list', c.listPrintTemplates);
r.post('/print-templates', c.createPrintTemplate);

// ── Asset Management ─────────────────────────────────
r.post('/:id/asset', c.linkAsset);
r.get('/:id/asset', c.getAsset);

// ── Export ───────────────────────────────────────────
r.get('/export', async (req, res) => {
  const { rows } = await db.query(
    `SELECT 
      id, name, content, barcode_type, status, 
      total_scans, unique_scans, print_count,
      created_at, last_scanned_at
    FROM barcodes 
    WHERE org_id = $1 
    ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'barcodes.csv', rows, autoColumns(rows));
});

module.exports = r;