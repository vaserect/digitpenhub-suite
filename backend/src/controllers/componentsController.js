const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { category, visibility } = req.query;
  
  let query = 'SELECT * FROM components WHERE org_id = $1';
  const params = [orgId];
  
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  if (visibility) {
    params.push(visibility);
    query += ` AND visibility = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM components WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Component not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { name, category, html, css, js, thumbnail, visibility } = req.body;
  
  if (!name || !html) {
    return res.status(400).json({ error: 'Name and HTML are required' });
  }
  
  const result = await db.query(
    'INSERT INTO components (org_id, name, category, html, css, js, thumbnail, visibility, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [orgId, name, category, html, css, js, thumbnail, visibility || 'private', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, category, html, css, js, thumbnail, visibility } = req.body;
  
  const result = await db.query(
    'UPDATE components SET name = COALESCE($1, name), category = COALESCE($2, category), html = COALESCE($3, html), css = COALESCE($4, css), js = COALESCE($5, js), thumbnail = COALESCE($6, thumbnail), visibility = COALESCE($7, visibility) WHERE id = $8 AND org_id = $9 RETURNING *',
    [name, category, html, css, js, thumbnail, visibility, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Component not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM components WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Component not found' });
  res.json({ message: 'Component deleted successfully', id: result.rows[0].id });
});
