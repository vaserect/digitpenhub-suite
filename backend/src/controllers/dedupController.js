const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.scan = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { entityType } = req.body;
  
  if (!entityType) {
    return res.status(400).json({ error: 'Entity type is required' });
  }
  
  const result = await db.query(
    'INSERT INTO dedup_scans (org_id, entity_type, status) VALUES ($1, $2, $3) RETURNING *',
    [orgId, entityType, 'running']
  );
  res.status(201).json(result.rows[0]);
});

exports.getScans = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM dedup_scans WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
  res.json(result.rows);
});

exports.getDuplicates = asyncHandler(async (req, res) => {
  const { scanId } = req.params;
  const { orgId } = req.user;
  
  const result = await db.query(
    'SELECT * FROM dedup_results WHERE scan_id = $1 AND org_id = $2 ORDER BY confidence DESC',
    [scanId, orgId]
  );
  res.json(result.rows);
});

exports.merge = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { masterId, duplicateIds } = req.body;
  
  if (!masterId || !duplicateIds || !Array.isArray(duplicateIds)) {
    return res.status(400).json({ error: 'Master ID and duplicate IDs array are required' });
  }
  
  const result = await db.query(
    'INSERT INTO dedup_merges (org_id, master_id, duplicate_ids, merged_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [orgId, masterId, JSON.stringify(duplicateIds), userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.ignore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  
  const result = await db.query(
    'UPDATE dedup_results SET ignored = true WHERE id = $1 AND org_id = $2 RETURNING *',
    [id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Duplicate not found' });
  res.json(result.rows[0]);
});
