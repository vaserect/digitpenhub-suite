const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { listFunnels, getFunnel, createFunnel, updateFunnel, deleteFunnel, addStep, removeStep, reorderSteps } = require('../controllers/funnelsController');

const router = Router();
router.use(requireAuth);

router.get('/', listFunnels);
router.get('/export', async (req, res) => { const { sendCsv, autoColumns } = require('../utils/csv'); const { rows } = await db.query('SELECT id, name, status, created_at FROM funnels WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'funnels.csv', rows, autoColumns(rows)); });
router.get('/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM funnels WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });
router.post('/bulk-delete', bulkDeleteHandler('funnels'));
router.get('/:id', getFunnel);
router.post('/', createFunnel);
router.put('/:id', updateFunnel);
router.delete('/:id', deleteFunnel);

router.post('/:id/steps', addStep);
router.delete('/:id/steps/:stepId', removeStep);
router.put('/:id/steps/reorder', reorderSteps);

module.exports = router;
