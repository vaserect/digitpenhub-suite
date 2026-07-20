const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM ev_gov WHERE org_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user.orgId]);
  res.json({ items: rows });
});
exports.create = asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO ev_gov (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
});
