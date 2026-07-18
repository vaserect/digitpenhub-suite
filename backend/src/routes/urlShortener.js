const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/urlShortenerController');

const r = Router();

// Public redirect endpoint (no auth required)
r.get('/r/:slug', c.redirectLink);

// All other routes require authentication
r.use(requireAuth);

// =====================================================
// DASHBOARD & STATS
// =====================================================
r.get('/stats', c.getDashboardStats);

// =====================================================
// LINKS CRUD
// =====================================================
r.get('/', c.listLinks);
r.get('/:id', c.getLink);
r.post('/', c.createLink);
r.put('/:id', c.updateLink);
r.delete('/:id', c.deleteLink);

// =====================================================
// BULK OPERATIONS
// =====================================================
r.post('/bulk-delete', c.bulkDeleteLinks);
r.post('/bulk-update', c.bulkUpdateLinks);

// =====================================================
// ANALYTICS
// =====================================================
r.get('/:id/analytics', c.getLinkAnalytics);

// =====================================================
// FOLDERS
// =====================================================
r.get('/folders/list', c.listFolders);
r.post('/folders', c.createFolder);
r.put('/folders/:id', c.updateFolder);
r.delete('/folders/:id', c.deleteFolder);

// =====================================================
// CUSTOM DOMAINS
// =====================================================
r.get('/domains/list', c.listCustomDomains);
r.post('/domains', c.createCustomDomain);
r.post('/domains/:id/verify', c.verifyCustomDomain);
r.delete('/domains/:id', c.deleteCustomDomain);

// =====================================================
// QR CODES
// =====================================================
r.post('/:id/qr-code', c.generateQRCode);

// =====================================================
// EXPORT
// =====================================================
r.get('/export/csv', c.exportLinks);

module.exports = r;