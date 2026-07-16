const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const dataTablesController = require('../controllers/dataTablesController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', dataTablesController.getAll);
router.get('/:id', dataTablesController.getById);
router.post('/', dataTablesController.create);
router.put('/:id', dataTablesController.update);
router.delete('/:id', dataTablesController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('dataTables'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM dataTables WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'dataTables.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM dataTables WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
