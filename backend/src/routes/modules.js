const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listModules } = require('../controllers/modulesController');
const db = require('../db');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.tier, m.status
       FROM categories c
       JOIN modules m ON m.category_id = c.id`
    );
    const tier1 = rows.filter(r => r.tier === 1);
    const totalModules = tier1.length;
    const activeModules = tier1.filter(r => r.status === 'active').length;
    
    const catRows = await db.query("SELECT count(*)::int as count FROM categories WHERE tier = 1");
    const totalCategories = catRows.rows[0].count;

    res.json({
      totalCategories,
      totalModules,
      activeModules
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAuth, listModules);

module.exports = router;
