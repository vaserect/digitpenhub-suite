const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const cloudStorageController = require('../controllers/cloudStorageController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', cloudStorageController.getAll);
router.get('/:id', cloudStorageController.getById);
router.post('/', cloudStorageController.create);
router.put('/:id', cloudStorageController.update);
router.delete('/:id', cloudStorageController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('storage_files'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM storage_files WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'storage-files.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM storage_files WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
