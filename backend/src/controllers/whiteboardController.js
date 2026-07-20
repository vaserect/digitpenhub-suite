const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT id, org_id, name, content_json, is_locked, created_by, created_at, updated_at FROM whiteboards WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]);
  res.json({ items: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'INSERT INTO whiteboards (org_id, name, created_by) VALUES ($1, $2, $3) RETURNING *',
    [req.user.orgId, req.body.name || 'Untitled', req.user.id]
  );
  res.status(201).json({ item: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM whiteboards WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});
