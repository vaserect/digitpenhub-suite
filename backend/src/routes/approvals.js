const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const approvalsController = require('../controllers/approvalsController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', approvalsController.getAll);
router.get('/:id', approvalsController.getById);
router.post('/', approvalsController.create);
router.put('/:id', approvalsController.update);
router.delete('/:id', approvalsController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('approvals'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM approvals WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'approvals.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM approvals WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
