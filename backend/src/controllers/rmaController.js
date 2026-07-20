const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM commerce_rma WHERE org_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user.orgId]);
  res.json({ items: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'INSERT INTO commerce_rma (org_id, data) VALUES ($1, $2) RETURNING *',
    [req.user.orgId, JSON.stringify(req.body || {})]
  );
  res.status(201).json({ item: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM commerce_rma WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});
