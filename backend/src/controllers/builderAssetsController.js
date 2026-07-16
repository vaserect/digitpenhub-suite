const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// List assets with filters
async function listAssets(req, res) {
  const { folderId, type, q, limit = 50, offset = 0 } = req.query;

  const conditions = ['org_id = $1'];
  const values = [req.user.orgId];
  let idx = 2;

  if (folderId) {
    conditions.push(`folder_id = $${idx++}`);
    values.push(folderId);
  } else if (folderId === null || folderId === 'null') {
    conditions.push('folder_id IS NULL');
  }

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  if (q && q.trim()) {
    conditions.push(`(name ILIKE $${idx} OR alt_text ILIKE $${idx} OR $${idx} = ANY(tags))`);
    values.push(`%${q.trim()}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  values.push(parseInt(limit) || 50, parseInt(offset) || 0);

  try {
    const { rows } = await db.query(
      `SELECT id, name, type, url, thumbnail_url, size, width, height,
              alt_text, tags, folder_id, usage_count, created_at, updated_at
       FROM builder_assets
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM builder_assets WHERE ${where}`,
      values.slice(0, -2)
    );

    res.json({
      assets: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (err) {
    console.error('Error listing assets:', err);
    res.status(500).json({ error: 'Failed to list assets.' });
  }
}

// Get asset details
async function getAsset(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT * FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    res.json({ asset: rows[0] });
  } catch (err) {
    console.error('Error getting asset:', err);
    res.status(500).json({ error: 'Failed to get asset.' });
  }
}

// Upload asset
async function uploadAsset(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { name, altText, tags, folderId } = req.body;

  try {
    // Determine asset type
    const ext = path.extname(req.file.originalname).toLowerCase();
    let type = 'other';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      type = 'image';
    } else if (['.mp4', '.webm'].includes(ext)) {
      type = 'video';
    } else if (ext === '.pdf') {
      type = 'document';
    }

    // Generate URL (relative to uploads directory)
    const url = `/uploads/builder-assets/${req.file.filename}`;

    // Parse tags if provided as JSON string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const { rows } = await db.query(
      `INSERT INTO builder_assets (
        org_id, name, type, url, size, alt_text, tags, folder_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.orgId,
        name || req.file.originalname,
        type,
        url,
        req.file.size,
        altText || null,
        parsedTags,
        folderId || null
      ]
    );

    res.status(201).json({ asset: rows[0] });
  } catch (err) {
    console.error('Error uploading asset:', err);
    // Clean up uploaded file on error
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkErr) {
      console.error('Error deleting file after upload failure:', unlinkErr);
    }
    res.status(500).json({ error: 'Failed to upload asset.' });
  }
}

// Update asset metadata
async function updateAsset(req, res) {
  const { id } = req.params;
  const { name, altText, tags, folderId } = req.body;

  try {
    const existing = await db.query(
      `SELECT id FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (altText !== undefined) {
      updates.push(`alt_text = $${idx++}`);
      values.push(altText || null);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${idx++}`);
      values.push(tags || []);
    }
    if (folderId !== undefined) {
      updates.push(`folder_id = $${idx++}`);
      values.push(folderId || null);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    updates.push(`updated_at = now()`);
    values.push(id, req.user.orgId);

    const { rows } = await db.query(
      `UPDATE builder_assets SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    res.json({ asset: rows[0] });
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset.' });
  }
}

// Delete asset
async function deleteAsset(req, res) {
  const { id } = req.params;

  try {
    // Get asset details
    const assetResult = await db.query(
      `SELECT url FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!assetResult.rows.length) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const { url } = assetResult.rows[0];

    // Delete from database
    await db.query(
      `DELETE FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    // Delete physical file
    try {
      const filePath = path.join(__dirname, '../../', url);
      await fs.unlink(filePath);
    } catch (fileErr) {
      console.error('Error deleting physical file:', fileErr);
      // Continue even if file deletion fails
    }

    res.json({ ok: true, message: 'Asset deleted successfully.' });
  } catch (err) {
    console.error('Error deleting asset:', err);
    res.status(500).json({ error: 'Failed to delete asset.' });
  }
}

// Create folder
async function createFolder(req, res) {
  const { name, parentId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Folder name is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO builder_asset_folders (org_id, name, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.orgId, name.trim(), parentId || null]
    );

    res.status(201).json({ folder: rows[0] });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder.' });
  }
}

// List folders
async function listFolders(req, res) {
  const { parentId } = req.query;

  const conditions = ['org_id = $1'];
  const values = [req.user.orgId];

  if (parentId) {
    conditions.push('parent_id = $2');
    values.push(parentId);
  } else if (parentId === null || parentId === 'null') {
    conditions.push('parent_id IS NULL');
  }

  const where = conditions.join(' AND ');

  try {
    const { rows } = await db.query(
      `SELECT f.*,
              (SELECT COUNT(*)::int FROM builder_assets WHERE folder_id = f.id) as asset_count,
              (SELECT COUNT(*)::int FROM builder_asset_folders WHERE parent_id = f.id) as subfolder_count
       FROM builder_asset_folders f
       WHERE ${where}
       ORDER BY name ASC`,
      values
    );

    res.json({ folders: rows });
  } catch (err) {
    console.error('Error listing folders:', err);
    res.status(500).json({ error: 'Failed to list folders.' });
  }
}

// Move asset to folder
async function moveAsset(req, res) {
  const { id } = req.params;
  const { folderId } = req.body;

  try {
    // Verify asset exists
    const assetCheck = await db.query(
      `SELECT id FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!assetCheck.rows.length) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Verify folder exists if folderId provided
    if (folderId) {
      const folderCheck = await db.query(
        `SELECT id FROM builder_asset_folders WHERE id = $1 AND org_id = $2`,
        [folderId, req.user.orgId]
      );

      if (!folderCheck.rows.length) {
        return res.status(404).json({ error: 'Folder not found.' });
      }
    }

    const { rows } = await db.query(
      `UPDATE builder_assets SET folder_id = $1, updated_at = now()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [folderId || null, id, req.user.orgId]
    );

    res.json({ asset: rows[0], message: 'Asset moved successfully.' });
  } catch (err) {
    console.error('Error moving asset:', err);
    res.status(500).json({ error: 'Failed to move asset.' });
  }
}

// Get asset usage across pages with JSONB containment query
async function getAssetUsage(req, res) {
  const { id } = req.params;

  try {
    // Verify asset exists
    const assetResult = await db.query(
      `SELECT id, url, usage_count FROM builder_assets WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!assetResult.rows.length) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const { url } = assetResult.rows[0];

    // Find pages using this asset via JSONB containment
    const { rows } = await db.query(
      `SELECT id, slug, title, site_id
       FROM pages
       WHERE org_id = $1 AND blocks::text LIKE $2`,
      [req.user.orgId, `%${url}%`]
    );

    // Find sections using this asset
    const sectionUsage = await db.query(
      `SELECT id, name, category
       FROM builder_sections
       WHERE (is_global = true OR org_id = $1) AND blocks::text LIKE $2`,
      [req.user.orgId, `%${url}%`]
    );

    const totalUsage = rows.length + sectionUsage.rows.length;

    // Update usage count
    await db.query(
      `UPDATE builder_assets SET usage_count = $1 WHERE id = $2`,
      [totalUsage, id]
    );

    res.json({
      usageCount: totalUsage,
      pages: rows,
      sections: sectionUsage.rows
    });
  } catch (err) {
    console.error('Error getting asset usage:', err);
    res.status(500).json({ error: 'Failed to get asset usage.' });
  }
}

module.exports = {
  listAssets,
  getAsset,
  uploadAsset,
  updateAsset,
  deleteAsset,
  createFolder,
  listFolders,
  moveAsset,
  getAssetUsage
};
