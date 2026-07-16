const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const cbtController = require('../controllers/cbtController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', cbtController.getAll);
router.get('/:id', cbtController.getById);
router.post('/', cbtController.create);
router.put('/:id', cbtController.update);
router.delete('/:id', cbtController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('cbt'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM cbt WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'cbt.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM cbt WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
