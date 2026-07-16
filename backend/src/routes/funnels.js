const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { listFunnels, getFunnel, createFunnel, updateFunnel, deleteFunnel, addStep, removeStep, reorderSteps } = require('../controllers/funnelsController');

const router = Router();
router.use(requireAuth);

router.get('/', listFunnels);
router.get('/export', async (req, res) => { const { sendCsv, autoColumns } = require('../utils/csv'); const { rows } = await db.query('SELECT id, name, status, created_at FROM funnels WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'funnels.csv', rows, autoColumns(rows)); });
router.get('/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM funnels WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });
router.post('/bulk-delete', uploadLimiter, bulkDeleteHandler('funnels'));
router.get('/:id', getFunnel);
router.post('/', uploadLimiter, createFunnel);
router.put('/:id', uploadLimiter, updateFunnel);
router.delete('/:id', uploadLimiter, deleteFunnel);

router.post('/:id/steps', uploadLimiter, addStep);
router.delete('/:id/steps/:stepId', removeStep);
router.put('/:id/steps/reorder', uploadLimiter, reorderSteps);

module.exports = router;
