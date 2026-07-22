const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

r.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT id, name, description, thumbnail_url, category FROM site_templates ORDER BY sort_order, name');
  res.json({ templates: rows });
});

r.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM site_templates WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ template: rows[0] });
});

module.exports = r;
