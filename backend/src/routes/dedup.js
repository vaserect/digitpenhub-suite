const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const dedupController = require('../controllers/dedupController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', dedupController.getAll);
router.get('/:id', dedupController.getById);
router.post('/', dedupController.create);
router.put('/:id', dedupController.update);
router.delete('/:id', dedupController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('dedup'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM dedup WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'dedup.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM dedup WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
