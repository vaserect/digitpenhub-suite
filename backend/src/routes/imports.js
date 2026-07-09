const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM import_jobs WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [req.user.orgId]
  );
  res.json({ jobs: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { resourceType, filename } = req.body || {};
  if (!resourceType || !filename) return res.status(400).json({ error: 'resourceType and filename are required.' });
  const { rows } = await db.query(
    `INSERT INTO import_jobs (org_id, resource_type, filename, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, resourceType, filename, req.user.id]
  );
  res.status(201).json({ job: rows[0] });
}));

module.exports = router;
