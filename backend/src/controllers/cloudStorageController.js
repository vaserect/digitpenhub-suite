const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { folder, type } = req.query;
  
  let query = 'SELECT * FROM cloud_storage WHERE org_id = $1';
  const params = [orgId];
  
  if (folder) {
    params.push(folder);
    query += ` AND folder_path = $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND file_type = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM cloud_storage WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { fileName, fileType, fileSize, folderPath, storageUrl, metadata } = req.body;
  
  if (!fileName || !storageUrl) {
    return res.status(400).json({ error: 'File name and storage URL are required' });
  }
  
  const result = await db.query(
    'INSERT INTO cloud_storage (org_id, file_name, file_type, file_size, folder_path, storage_url, metadata, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [orgId, fileName, fileType, fileSize, folderPath || '/', storageUrl, metadata ? JSON.stringify(metadata) : null, userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { fileName, folderPath, metadata } = req.body;
  
  const result = await db.query(
    'UPDATE cloud_storage SET file_name = COALESCE($1, file_name), folder_path = COALESCE($2, folder_path), metadata = COALESCE($3, metadata) WHERE id = $4 AND org_id = $5 RETURNING *',
    [fileName, folderPath, metadata ? JSON.stringify(metadata) : null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM cloud_storage WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json({ message: 'File deleted successfully', id: result.rows[0].id });
});
