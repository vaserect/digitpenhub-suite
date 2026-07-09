const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM data_tables WHERE org_id = $1 ORDER BY name`, [req.user.orgId]);
  res.json({ tables: rows });
}));

router.get('/export', async (req, res) => { const { sendCsv, autoColumns } = require('../utils/csv'); const { rows } = await db.query('SELECT id, name, slug, row_count, created_at FROM data_tables WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'data_tables.csv', rows, autoColumns(rows)); });
router.get('/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total, COALESCE(sum(row_count),0)::int AS total_rows FROM data_tables WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });
const { bulkDeleteHandler } = require('../utils/bulkDelete');
router.post('/bulk-delete', bulkDeleteHandler('data_tables'));

router.post('/', asyncHandler(async (req, res) => {
  const { name, schema } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { rows } = await db.query(
    `INSERT INTO data_tables (org_id, name, slug, schema_json, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, name.trim(), slug, JSON.stringify(schema || []), req.user.id]
  );
  res.status(201).json({ table: rows[0] });
}));

router.get('/:slug/rows', asyncHandler(async (req, res) => {
  const { rows: tables } = await db.query(`SELECT id FROM data_tables WHERE org_id = $1 AND slug = $2`, [req.user.orgId, req.params.slug]);
  if (!tables.length) return res.status(404).json({ error: 'Table not found.' });
  const { rows } = await db.query(`SELECT * FROM data_table_rows WHERE table_id = $1 ORDER BY created_at DESC LIMIT 100`, [tables[0].id]);
  res.json({ rows });
}));

router.post('/:slug/rows', asyncHandler(async (req, res) => {
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: 'data is required.' });
  const { rows: tables } = await db.query(`SELECT id FROM data_tables WHERE org_id = $1 AND slug = $2`, [req.user.orgId, req.params.slug]);
  if (!tables.length) return res.status(404).json({ error: 'Table not found.' });
  const { rows } = await db.query(
    `INSERT INTO data_table_rows (table_id, data, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [tables[0].id, JSON.stringify(data), req.user.id]
  );
  await db.query(`UPDATE data_tables SET row_count = row_count + 1 WHERE id = $1`, [tables[0].id]);
  res.status(201).json({ row: rows[0] });
}));

module.exports = router;
