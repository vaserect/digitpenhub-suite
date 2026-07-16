const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const contractsController = require('../controllers/contractsController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', contractsController.getAll);
router.get('/:id', contractsController.getById);
router.post('/', contractsController.create);
router.put('/:id', contractsController.update);
router.delete('/:id', contractsController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('contracts'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM contracts WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'contracts.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM contracts WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
