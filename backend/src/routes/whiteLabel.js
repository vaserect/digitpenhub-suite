const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { getStatus, upsertBranding, connectDomain, verifyDomain, activate, deactivate } = require('../controllers/whiteLabelController');

const router = Router();
router.use(requireAuth);

// Root handler — returns full white-label status
router.get('/', getStatus);
router.get('/status', getStatus);
router.put('/branding', requireRole('owner', 'admin'), upsertBranding);
router.post('/domain', requireRole('owner', 'admin'), connectDomain);
router.post('/verify-domain', requireRole('owner', 'admin'), verifyDomain);
router.post('/activate', requireRole('owner', 'admin'), activate);
router.post('/deactivate', requireRole('owner', 'admin'), deactivate);

module.exports = router;
