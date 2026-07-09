const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM segments WHERE org_id = $1 ORDER BY name`, [req.user.orgId]
  );
  res.json({ segments: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, criteria } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO segments (org_id, name, description, criteria_json)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, name.trim(), description || null, JSON.stringify(criteria || {})]
  );
  res.status(201).json({ segment: rows[0] });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM segments WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

module.exports = router;
