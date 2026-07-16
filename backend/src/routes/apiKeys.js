const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const apiKeysController = require('../controllers/apiKeysController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', apiKeysController.getAll);
router.get('/:id', apiKeysController.getById);
router.post('/', apiKeysController.create);
router.put('/:id', apiKeysController.update);
router.delete('/:id', apiKeysController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('apiKeys'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM apiKeys WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'apiKeys.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM apiKeys WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
