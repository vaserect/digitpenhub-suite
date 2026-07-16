const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const damController = require('../controllers/damController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', damController.getAll);
router.get('/:id', damController.getById);
router.post('/', damController.create);
router.put('/:id', damController.update);
router.delete('/:id', damController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('dam'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM dam WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'dam.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM dam WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
