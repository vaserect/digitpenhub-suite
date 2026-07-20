const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { folder, type } = req.query;
  let query = 'SELECT sf.* FROM storage_files sf WHERE sf.org_id = $1';
  const params = [orgId];
  if (folder) { params.push(folder); query += ` AND sf.folder_id = $${params.length}`; }
  if (type) { params.push(type); query += ` AND sf.file_type = $${params.length}`; }
  query += ' ORDER BY sf.created_at DESC';
  const { rows } = await db.query(query, params);
  res.json({ files: rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM storage_files WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json({ file: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, fileType, sizeBytes, folderId, storagePath } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { rows } = await db.query(
    `INSERT INTO storage_files (org_id, name, file_type, size_bytes, folder_id, storage_path, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, name, fileType || 'file', sizeBytes || 0, folderId || null, storagePath || null, req.user.id]
  );
  res.status(201).json({ file: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, folderId } = req.body;
  const { rows } = await db.query(
    'UPDATE storage_files SET name = COALESCE($1, name), folder_id = COALESCE($2, folder_id) WHERE id = $3 AND org_id = $4 RETURNING *',
    [name, folderId, req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'File not found' });
  res.json({ file: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM storage_files WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'File not found' });
  res.json({ ok: true });
});

exports.folders = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM storage_folders WHERE org_id = $1 ORDER BY name', [req.user.orgId]);
  res.json({ folders: rows });
});

exports.createFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { rows } = await db.query('INSERT INTO storage_folders (org_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
    [req.user.orgId, name, parentId || null]);
  res.status(201).json({ folder: rows[0] });
});
