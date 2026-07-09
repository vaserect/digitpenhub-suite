const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const { uploadLimiter } = require('../middleware/rateLimiters');

const DAM_DIR = path.join(__dirname, '../../uploads/dam');
if (!fs.existsSync(DAM_DIR)) fs.mkdirSync(DAM_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/ogg',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgDir = path.join(DAM_DIR, req.user.orgId);
    fs.mkdirSync(orgDir, { recursive: true });
    cb(null, orgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed. Supported: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, MP3, WAV, OGG, PDF.`));
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

// ── Search ├É─┬─────────────────────────────────────────────────────────────────
router.get('/search', asyncHandler(async (req, res) => {
  const { q, mime, folderId, tagId, page = 1, limit = 50 } = req.query;
  const conditions = ['a.org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;

  if (q) {
    conditions.push(`to_tsvector('english', a.filename || ' ' || coalesce(a.alt_text,'') || ' ' || coalesce(a.caption,'')) @@ plainto_tsquery('english', $${idx})`);
    params.push(q);
    idx++;
  }
  if (mime) {
    if (mime === 'image') conditions.push(`a.mime_type LIKE 'image/%'`);
    else if (mime === 'video') conditions.push(`a.mime_type LIKE 'video/%'`);
    else if (mime === 'audio') conditions.push(`a.mime_type LIKE 'audio/%'`);
    else { conditions.push(`a.mime_type = $${idx}`); params.push(mime); idx++; }
  }
  if (folderId !== undefined) {
    conditions.push(`a.folder_id ${folderId === 'null' ? 'IS NULL' : `= $${idx}`}`);
    if (folderId !== 'null') { params.push(folderId); idx++; }
  }
  if (tagId) {
    conditions.push(`EXISTS (SELECT 1 FROM dam_asset_tags WHERE asset_id = a.id AND tag_id = $${idx})`);
    params.push(tagId);
    idx++;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { rows: assets } = await db.query(
    `SELECT a.*, json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL) AS tags
     FROM dam_assets a
     LEFT JOIN dam_asset_tags at2 ON at2.asset_id = a.id
     LEFT JOIN dam_tags t ON t.id = at2.tag_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY a.id
     ORDER BY a.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  const { rows: countResult } = await db.query(
    `SELECT count(*) FROM dam_assets a WHERE ${conditions.join(' AND ')}`,
    params
  );

  res.json({ assets, total: parseInt(countResult[0].count), page: parseInt(page) });
}));

// ── Folders ├É─┬────────────────────────────────────────────────────────────────
router.get('/folders', asyncHandler(async (req, res) => {
  const { parentId } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM dam_folders WHERE org_id = $1 AND parent_id IS NOT DISTINCT FROM $2 ORDER BY name`,
    [req.user.orgId, parentId || null]
  );
  res.json({ folders: rows });
}));

router.post('/folders', asyncHandler(async (req, res) => {
  const { name, parentId } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Folder name is required.' });
  const { rows } = await db.query(
    `INSERT INTO dam_folders (org_id, name, parent_id) VALUES ($1, $2, $3)
     ON CONFLICT (org_id, parent_id, name) DO NOTHING RETURNING *`,
    [req.user.orgId, name.trim(), parentId || null]
  );
  if (!rows.length) return res.status(409).json({ error: 'Folder already exists.' });
  res.status(201).json({ folder: rows[0] });
}));

// ── Tags ├É─┬───────────────────────────────────────────────────────────────────
router.get('/tags', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.*, count(at2.asset_id)::int AS usage_count
     FROM dam_tags t
     LEFT JOIN dam_asset_tags at2 ON at2.tag_id = t.id
     WHERE t.org_id = $1
     GROUP BY t.id ORDER BY t.name`,
    [req.user.orgId]
  );
  res.json({ tags: rows });
}));

router.post('/tags', asyncHandler(async (req, res) => {
  const { name, color } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Tag name is required.' });
  const { rows } = await db.query(
    `INSERT INTO dam_tags (org_id, name, color) VALUES ($1, $2, $3)
     ON CONFLICT (org_id, name) DO UPDATE SET color = $3 RETURNING *`,
    [req.user.orgId, name.trim(), color || null]
  );
  res.status(201).json({ tag: rows[0] });
}));

// ── Upload ├É─┬────────────────────────────────────────────────────────────────
router.post('/upload', uploadLimiter, upload.array('files', 10), asyncHandler(async (req, res) => {
  const { folderId } = req.body || {};
  const saved = [];

  for (const file of req.files) {
    const { rows } = await db.query(
      `INSERT INTO dam_assets (org_id, folder_id, filename, disk_path, mime_type, size_bytes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.orgId, folderId || null, file.originalname, file.filename, file.mimetype, file.size, req.user.id]
    );
    // Set dimensions for images
    saved.push(rows[0]);
  }

  res.status(201).json({ assets: saved });
}));

// ── Single asset ops ├É─┬───────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.*, json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL) AS tags
     FROM dam_assets a
     LEFT JOIN dam_asset_tags at2 ON at2.asset_id = a.id
     LEFT JOIN dam_tags t ON t.id = at2.tag_id
     WHERE a.id = $1 AND a.org_id = $2
     GROUP BY a.id`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Asset not found.' });
  res.json({ asset: rows[0] });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const { altText, caption, credit, folderId, isPublic, tagIds } = req.body || {};
  const updates = [];
  const params = [];
  let idx = 1;

  if (altText !== undefined) { updates.push(`alt_text = $${idx++}`); params.push(altText); }
  if (caption !== undefined) { updates.push(`caption = $${idx++}`); params.push(caption); }
  if (credit !== undefined) { updates.push(`credit = $${idx++}`); params.push(credit); }
  if (isPublic !== undefined) { updates.push(`is_public = $${idx++}`); params.push(isPublic); }
  if (folderId !== undefined) { updates.push(`folder_id = $${idx++}`); params.push(folderId || null); }

  if (updates.length) {
    updates.push(`updated_at = now()`);
    params.push(req.params.id, req.user.orgId);
    await db.query(
      `UPDATE dam_assets SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1}`,
      params
    );
  }

  // Update tags
  if (Array.isArray(tagIds)) {
    await db.query(`DELETE FROM dam_asset_tags WHERE asset_id = $1`, [req.params.id]);
    for (const tagId of tagIds) {
      await db.query(
        `INSERT INTO dam_asset_tags (asset_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.id, tagId]
      );
    }
  }

  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `DELETE FROM dam_assets WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (rows.length) {
    const full = path.join(DAM_DIR, req.user.orgId, rows[0].disk_path);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  res.json({ ok: true });
}));

// ── Serve ├É─┬─────────────────────────────────────────────────────────────────
router.get('/file/:filename', asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const full = path.join(DAM_DIR, req.user.orgId, filename);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'File not found.' });
  res.sendFile(full);
}));

// ── Usage tracking ├É─┬────────────────────────────────────────────────────────
router.post('/:id/usage', asyncHandler(async (req, res) => {
  const { moduleSlug, resourceType, resourceId, field } = req.body || {};
  if (!moduleSlug || !resourceType || !resourceId) {
    return res.status(400).json({ error: 'moduleSlug, resourceType, and resourceId are required.' });
  }
  await db.query(
    `INSERT INTO dam_usage (asset_id, module_slug, resource_type, resource_id, field)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
    [req.params.id, moduleSlug, resourceType, resourceId, field || null]
  );
  res.status(201).json({ ok: true });
}));

module.exports = router;
