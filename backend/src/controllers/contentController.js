const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { type, status } = req.query;
  
  let query = 'SELECT * FROM content WHERE org_id = $1';
  const params = [orgId];
  
  if (type) {
    params.push(type);
    query += ` AND content_type = $${params.length}`;
  }
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
  const result = await db.query('SELECT * FROM content WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Content not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { title, contentType, body, excerpt, featuredImage, metadata, status } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  
  const result = await db.query(
    'INSERT INTO content (org_id, title, content_type, body, excerpt, featured_image, metadata, status, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [orgId, title, contentType || 'article', body, excerpt, featuredImage, metadata ? JSON.stringify(metadata) : null, status || 'draft', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { title, body, excerpt, featuredImage, metadata, status } = req.body;
  
  const result = await db.query(
    'UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body), excerpt = COALESCE($3, excerpt), featured_image = COALESCE($4, featured_image), metadata = COALESCE($5, metadata), status = COALESCE($6, status) WHERE id = $7 AND org_id = $8 RETURNING *',
    [title, body, excerpt, featuredImage, metadata ? JSON.stringify(metadata) : null, status, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Content not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM content WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Content not found' });
  res.json({ message: 'Content deleted successfully', id: result.rows[0].id });
});
