const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const contentController = require('../controllers/contentController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', contentController.getAll);
router.get('/:id', contentController.getById);
router.post('/', contentController.create);
router.put('/:id', contentController.update);
router.delete('/:id', contentController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('content'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM content WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'content.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM content WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
