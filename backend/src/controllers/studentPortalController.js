const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM edu_students WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]);
  res.json({ students: rows });
});
exports.create = asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO edu_students (org_id, user_id) VALUES ($1, $2) RETURNING *', [req.user.orgId, req.user.id]);
  res.status(201).json({ student: rows[0] });
});
