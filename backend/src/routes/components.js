const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const componentsController = require('../controllers/componentsController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', componentsController.getComponents);
router.get('/:id', componentsController.getComponentById);
router.post('/', componentsController.createComponent);
router.put('/:id', componentsController.updateComponent);
router.delete('/:id', componentsController.deleteComponent);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('components'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM components WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'components.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM components WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
