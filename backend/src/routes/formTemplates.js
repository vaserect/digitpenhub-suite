const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (category) { conditions.push(`category = $${idx++}`); params.push(category); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(`SELECT id, category, name, description, sort_order FROM form_templates ${where} ORDER BY sort_order, name`, params);
  res.json({ templates: rows });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT category, count(*) AS count FROM form_templates GROUP BY category ORDER BY category');
  res.json({ categories: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM form_templates WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ template: rows[0] });
}));

router.post('/:id/use', asyncHandler(async (req, res) => {
  const { rows: tRows } = await db.query('SELECT * FROM form_templates WHERE id = $1', [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Not found.' });
  const t = tRows[0];
  const fields = typeof t.fields_json === 'string' ? t.fields_json : JSON.stringify(t.fields_json);
  const { rows } = await db.query(
    `INSERT INTO forms (org_id, name, description, fields) VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
    [req.user.orgId, t.name, t.description, fields]
  );
  res.status(201).json({ form: rows[0] });
}));

module.exports = router;
