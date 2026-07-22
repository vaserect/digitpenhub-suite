const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { folder, type } = req.query;

  let query = 'SELECT * FROM storage_files WHERE org_id = $1';
  const params = [orgId];

  if (folder) {
    params.push(folder);
    query += ` AND folder_id = $${params.length}::uuid`;
  }
  if (type) {
    params.push(type);
    query += ` AND mime_type LIKE $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json({ files: result.rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM storage_files WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { name, originalName, mimeType, sizeBytes, diskPath, folderId } = req.body;

  if (!name || !diskPath) {
    return res.status(400).json({ error: 'Name and disk path are required' });
  }

  const result = await db.query(
    `INSERT INTO storage_files (org_id, name, original_name, mime_type, size_bytes, disk_path, folder_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [orgId, name, originalName || name, mimeType || null, sizeBytes || 0, diskPath, folderId || null]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, folderId } = req.body;

  const result = await db.query(
    `UPDATE storage_files SET name = COALESCE($1, name), folder_id = COALESCE($2, folder_id) WHERE id = $3 AND org_id = $4 RETURNING *`,
    [name || null, folderId || null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM storage_files WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json({ message: 'File deleted successfully', id: result.rows[0].id });
});
