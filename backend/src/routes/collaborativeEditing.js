const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/collaborativeEditingController');

const router = Router();
router.use(requireAuth);

router.get('/',              c.listDocuments);
router.get('/stats',         c.getStats);
router.post('/',             c.createDocument);
router.get('/:id',           c.getDocument);
router.put('/:id',           c.updateDocument);
router.delete('/:id',        c.deleteDocument);
router.post('/:id/lock',     c.lockDocument);
router.post('/:id/unlock',   c.unlockDocument);
router.get('/:id/versions',  c.getVersions);
router.get('/:id/versions/:version', c.getVersion);
router.post('/:id/heartbeat', c.heartbeat);
router.get('/:id/sessions',  c.getActiveSessions);

// Bulk operations
const { bulkDeleteHandler } = require('../utils/bulkDelete');
router.post('/bulk-delete',  bulkDeleteHandler('shared_documents', 'org_id'));

module.exports = router;
