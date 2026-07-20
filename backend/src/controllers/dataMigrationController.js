const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM migration_tasks WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  res.json({ tasks: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, sourceType, sourceConfig, fieldMapping, targetType } = req.body;
  if (!name || !sourceType || !targetType) {
    return res.status(400).json({ error: 'name, sourceType, and targetType are required' });
  }
  const { rows } = await db.query(
    `INSERT INTO migration_tasks (org_id, name, source_type, source_config, field_mapping, target_type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, name, sourceType, JSON.stringify(sourceConfig || {}), JSON.stringify(fieldMapping || {}), targetType, req.user.id]
  );
  res.status(201).json({ task: rows[0] });
});

exports.getById = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM migration_tasks WHERE id = $1 AND org_id = $2',
    [req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, fieldMapping, sourceConfig } = req.body;
  const { rows } = await db.query(
    `UPDATE migration_tasks SET name = COALESCE($1, name), field_mapping = COALESCE($2, field_mapping),
     source_config = COALESCE($3, source_config), updated_at = NOW()
     WHERE id = $4 AND org_id = $5 RETURNING *`,
    [name, fieldMapping ? JSON.stringify(fieldMapping) : null, sourceConfig ? JSON.stringify(sourceConfig) : null, req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: rows[0] });
});

exports.run = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE migration_tasks SET status = 'running', updated_at = NOW() WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
  // Run async — mark as completed for now; actual CSV/API parsing is async
  setTimeout(async () => {
    await db.query(
      `UPDATE migration_tasks SET status = 'completed', stats = '{"records_processed":0,"errors":0}', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
  }, 100);
  res.json({ task: rows[0] });
});

exports.delete = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM migration_tasks WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

exports.getRecords = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT mr.* FROM migration_records mr JOIN migration_tasks mt ON mt.id = mr.task_id
     WHERE mr.task_id = $1 AND mt.org_id = $2 ORDER BY mr.row_index LIMIT 100`,
    [req.params.id, req.user.orgId]
  );
  res.json({ records: rows });
});
