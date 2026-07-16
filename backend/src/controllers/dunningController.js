const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status } = req.query;
  
  let query = 'SELECT * FROM dunning_campaigns WHERE org_id = $1';
  const params = [orgId];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM dunning_campaigns WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Campaign not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { name, steps, triggerDays } = req.body;
  
  if (!name || !steps) {
    return res.status(400).json({ error: 'Name and steps are required' });
  }
  
  const result = await db.query(
    'INSERT INTO dunning_campaigns (org_id, name, steps, trigger_days, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [orgId, name, JSON.stringify(steps), triggerDays || 30, 'active', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, steps, triggerDays, status } = req.body;
  
  const result = await db.query(
    'UPDATE dunning_campaigns SET name = COALESCE($1, name), steps = COALESCE($2, steps), trigger_days = COALESCE($3, trigger_days), status = COALESCE($4, status) WHERE id = $5 AND org_id = $6 RETURNING *',
    [name, steps ? JSON.stringify(steps) : null, triggerDays, status, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Campaign not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM dunning_campaigns WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ message: 'Campaign deleted successfully', id: result.rows[0].id });
});
