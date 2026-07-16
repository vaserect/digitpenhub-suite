const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { type, category } = req.query;
  
  let query = 'SELECT * FROM digital_assets WHERE org_id = $1';
  const params = [orgId];
  
  if (type) {
    params.push(type);
    query += ` AND asset_type = $${params.length}`;
  }
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM digital_assets WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { name, assetType, category, url, fileSize, metadata, tags } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  
  const result = await db.query(
    'INSERT INTO digital_assets (org_id, name, asset_type, category, url, file_size, metadata, tags, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [orgId, name, assetType, category, url, fileSize, metadata ? JSON.stringify(metadata) : null, tags ? JSON.stringify(tags) : null, userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, category, metadata, tags } = req.body;
  
  const result = await db.query(
    'UPDATE digital_assets SET name = COALESCE($1, name), category = COALESCE($2, category), metadata = COALESCE($3, metadata), tags = COALESCE($4, tags) WHERE id = $5 AND org_id = $6 RETURNING *',
    [name, category, metadata ? JSON.stringify(metadata) : null, tags ? JSON.stringify(tags) : null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM digital_assets WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json({ message: 'Asset deleted successfully', id: result.rows[0].id });
});
