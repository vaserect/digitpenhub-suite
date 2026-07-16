const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const { uploadLimiter } = require('../middleware/rateLimiters');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgDir = path.join(UPLOADS_DIR, req.user.orgId);
    fs.mkdirSync(orgDir, { recursive: true });
    cb(null, orgDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const ALLOWED_MIMES = new Set([
  'image/png','image/jpeg','image/gif','image/webp','image/svg+xml',
  'application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv','text/plain','text/rtf',
  'application/json','application/zip',
]);
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: images, PDFs, documents, spreadsheets, CSVs, JSON, and ZIP archives.`));
    }
    cb(null, true);
  },
});

const r = Router();
r.use(requireAuth);

// ── Folders ───────────────────────────────────────────────────────────────────

r.get('/folders', asyncHandler(async (req, res) => {
  const { parentId } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM storage_folders WHERE org_id = $1 AND parent_id IS NOT DISTINCT FROM $2 ORDER BY name`,
    [req.user.orgId, parentId || null]
  );
  res.json({ folders: rows });
}));

r.post('/folders', asyncHandler(async (req, res) => {
  const { name, parentId } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO storage_folders (org_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, name.trim(), parentId || null]
  );
  res.status(201).json({ folder: rows[0] });
}));

r.delete('/folders/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM storage_files WHERE folder_id = $1`, [req.params.id]
  );
  for (const f of rows) {
    const full = path.join(UPLOADS_DIR, req.user.orgId, path.basename(f.disk_path));
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  await db.query(`DELETE FROM storage_folders WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Files ─────────────────────────────────────────────────────────────────────

r.get('/files', asyncHandler(async (req, res) => {
  const { folderId } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM storage_files WHERE org_id = $1 AND folder_id IS NOT DISTINCT FROM $2 ORDER BY created_at DESC`,
    [req.user.orgId, folderId || null]
  );
  res.json({ files: rows });
}));

r.get('/stats', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS file_count, COALESCE(SUM(size_bytes),0) AS total_bytes FROM storage_files WHERE org_id = $1`,
    [req.user.orgId]
  );
  const { rows: fc } = await db.query(
    `SELECT COUNT(*) AS folder_count FROM storage_folders WHERE org_id = $1`, [req.user.orgId]
  );
  res.json({ fileCount: parseInt(rows[0].file_count), folderCount: parseInt(fc[0].folder_count), totalBytes: parseInt(rows[0].total_bytes) });
}));

r.post('/upload', uploadLimiter, upload.array('files', 50), asyncHandler(async (req, res) => {
  const { folderId } = req.body || {};
  const saved = [];
  for (const file of req.files) {
    const { rows } = await db.query(
      `INSERT INTO storage_files (org_id, folder_id, name, original_name, mime_type, size_bytes, disk_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.orgId, folderId || null, file.originalname, file.originalname, file.mimetype, file.size, file.filename]
    );
    saved.push(rows[0]);
  }
  res.status(201).json({ files: saved });
}));

r.get('/download/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM storage_files WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const full = path.join(UPLOADS_DIR, req.user.orgId, rows[0].disk_path);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'File not found on disk.' });
  res.download(full, rows[0].original_name);
}));

r.delete('/files/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `DELETE FROM storage_files WHERE id = $1 AND org_id = $2 RETURNING *`, [req.params.id, req.user.orgId]
  );
  if (rows.length) {
    const full = path.join(UPLOADS_DIR, req.user.orgId, rows[0].disk_path);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  res.json({ ok: true });
}));

r.patch('/files/:id/move', asyncHandler(async (req, res) => {
  const { folderId } = req.body || {};
  const { rows } = await db.query(
    `UPDATE storage_files SET folder_id = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
    [folderId || null, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ file: rows[0] });
}));

module.exports = r;
