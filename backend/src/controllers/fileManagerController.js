const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, folder, file_type, size_bytes, created_at, updated_at FROM file_manager_files WHERE org_id = $1 ORDER BY updated_at DESC',
    [req.user.orgId]
  );
  res.json({ files: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, folder, fileType, sizeBytes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { rows } = await db.query(
    'INSERT INTO file_manager_files (org_id, name, folder, file_type, size_bytes) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, folder, file_type, size_bytes, created_at',
    [req.user.orgId, name, folder || '/', fileType || 'file', sizeBytes || 0]
  );
  res.status(201).json({ file: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM file_manager_files WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'File not found' });
  res.json({ ok: true });
});
