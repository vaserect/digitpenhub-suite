const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
exports.list = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super admin only' });
  const { rows } = await db.query('SELECT * FROM pa_incidents ORDER BY created_at DESC LIMIT 100');
  res.json({ items: rows });
});
exports.create = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super admin only' });
  const { rows } = await db.query('INSERT INTO pa_incidents (data) VALUES ($1) RETURNING *', [JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
});
