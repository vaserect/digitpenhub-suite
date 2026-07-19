const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/qrCodesController');

const r = Router();

// Public scan endpoint (no auth required)
r.get('/scan/:id', c.scanQrCode);

// All other routes require authentication
r.use(requireAuth);

// =====================================================
// DASHBOARD & STATS
// =====================================================
r.get('/stats', c.getDashboardStats);

// =====================================================
// QR CODES CRUD
// =====================================================
r.get('/', c.listQrCodes);
r.get('/:id', c.getQrCode);
r.post('/', c.createQrCode);
r.put('/:id', c.updateQrCode);
r.delete('/:id', c.deleteQrCode);

// =====================================================
// BULK OPERATIONS
// =====================================================
r.post('/bulk-delete', c.bulkDeleteQrCodes);
r.post('/bulk-update', c.bulkUpdateQrCodes);

// =====================================================
// ANALYTICS
// =====================================================
r.get('/:id/analytics', c.getQrAnalytics);

// =====================================================
// FOLDERS
// =====================================================
r.get('/folders/list', c.listFolders);
r.post('/folders', c.createFolder);
r.put('/folders/:id', c.updateFolder);
r.delete('/folders/:id', c.deleteFolder);

// =====================================================
// TEMPLATES
// =====================================================
r.get('/templates/list', c.listTemplates);
r.post('/templates', c.createTemplate);
r.delete('/templates/:id', c.deleteTemplate);

// =====================================================
// BATCH GENERATION
// =====================================================
r.post('/batches', c.createBatch);
r.get('/batches/:id', c.getBatchStatus);

// =====================================================
// EXPORT
// =====================================================
r.get('/export/csv', c.exportQrCodes);

module.exports = r;