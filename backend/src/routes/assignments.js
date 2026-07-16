const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const assignmentsController = require('../controllers/assignmentsController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', assignmentsController.getAll);
router.get('/:id', assignmentsController.getById);
router.post('/', assignmentsController.create);
router.put('/:id', assignmentsController.update);
router.delete('/:id', assignmentsController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('assignments'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM assignments WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'assignments.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM assignments WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
