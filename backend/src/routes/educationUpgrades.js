const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const educationUpgradesController = require('../controllers/educationUpgradesController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// CRUD operations
router.get('/', educationUpgradesController.getAll);
router.get('/:id', educationUpgradesController.getById);
router.post('/', educationUpgradesController.create);
router.put('/:id', educationUpgradesController.update);
router.delete('/:id', educationUpgradesController.delete);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('educationUpgrades'));

// Export
router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM educationUpgrades WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'educationUpgrades.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS total FROM educationUpgrades WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
