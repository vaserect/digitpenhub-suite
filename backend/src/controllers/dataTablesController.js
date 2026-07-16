const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM data_tables WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM data_tables WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Table not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { name, schema, data } = req.body;
  
  if (!name || !schema) {
    return res.status(400).json({ error: 'Name and schema are required' });
  }
  
  const result = await db.query(
    'INSERT INTO data_tables (org_id, name, schema, data, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [orgId, name, JSON.stringify(schema), data ? JSON.stringify(data) : '[]', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, schema, data } = req.body;
  
  const result = await db.query(
    'UPDATE data_tables SET name = COALESCE($1, name), schema = COALESCE($2, schema), data = COALESCE($3, data) WHERE id = $4 AND org_id = $5 RETURNING *',
    [name, schema ? JSON.stringify(schema) : null, data ? JSON.stringify(data) : null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Table not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM data_tables WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Table not found' });
  res.json({ message: 'Table deleted successfully', id: result.rows[0].id });
});
