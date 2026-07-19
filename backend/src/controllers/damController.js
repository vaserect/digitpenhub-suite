const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { type, folder_id } = req.query;

  let query = 'SELECT * FROM dam_assets WHERE org_id = $1';
  const params = [orgId];

  if (type) {
    params.push(type);
    query += ` AND mime_type LIKE $${params.length}`;
  }
  if (folder_id) {
    params.push(folder_id);
    query += ` AND folder_id = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM dam_assets WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { filename, mimeType, diskPath, sizeBytes, folderId, width, height, altText, caption } = req.body;

  if (!filename || !diskPath || !mimeType) {
    return res.status(400).json({ error: 'Filename, disk path, and mime type are required' });
  }

  const result = await db.query(
    `INSERT INTO dam_assets (org_id, filename, disk_path, mime_type, size_bytes, folder_id, width, height, alt_text, caption, created_by) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [orgId, filename, diskPath, mimeType, sizeBytes || 0, folderId || null, width || null, height || null, altText || null, caption || null, userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { filename, altText, caption, credit, folderId } = req.body;

  const result = await db.query(
    `UPDATE dam_assets 
     SET filename = COALESCE($1, filename), 
         alt_text = COALESCE($2, alt_text), 
         caption = COALESCE($3, caption),
         credit = COALESCE($4, credit),
         folder_id = COALESCE($5, folder_id),
         updated_at = now()
     WHERE id = $6 AND org_id = $7 RETURNING *`,
    [filename, altText, caption, credit, folderId, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM dam_assets WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
  res.json({ message: 'Asset deleted successfully', id: result.rows[0].id });
});

// Folder operations
exports.getFolders = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { parent_id } = req.query;
  
  let query = 'SELECT * FROM dam_folders WHERE org_id = $1';
  const params = [orgId];
  
  if (parent_id) {
    params.push(parent_id);
    query += ` AND parent_id = $${params.length}`;
  } else {
    query += ' AND parent_id IS NULL';
  }
  
  query += ' ORDER BY name ASC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.createFolder = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { name, parent_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  
  const result = await db.query(
    'INSERT INTO dam_folders (org_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
    [orgId, name, parent_id || null]
  );
  res.status(201).json(result.rows[0]);
});

exports.updateFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name } = req.body;
  
  const result = await db.query(
    'UPDATE dam_folders SET name = $1 WHERE id = $2 AND org_id = $3 RETURNING *',
    [name, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Folder not found' });
  res.json(result.rows[0]);
});

exports.deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  
  // Check if folder has assets
  const assetsCheck = await db.query('SELECT COUNT(*) FROM dam_assets WHERE folder_id = $1', [id]);
  if (parseInt(assetsCheck.rows[0].count) > 0) {
    return res.status(400).json({ error: 'Cannot delete folder with assets. Move or delete assets first.' });
  }
  
  const result = await db.query('DELETE FROM dam_folders WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Folder not found' });
  res.json({ message: 'Folder deleted successfully', id: result.rows[0].id });
});

// Tag operations
exports.getTags = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM dam_tags WHERE org_id = $1 ORDER BY name ASC', [orgId]);
  res.json(result.rows);
});

exports.createTag = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { name, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  const result = await db.query(
    'INSERT INTO dam_tags (org_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [orgId, name, color || '#3b82f6']
  );
  res.status(201).json(result.rows[0]);
});

exports.deleteTag = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM dam_tags WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Tag not found' });
  res.json({ message: 'Tag deleted successfully', id: result.rows[0].id });
});

exports.addTagToAsset = asyncHandler(async (req, res) => {
  const { assetId, tagId } = req.body;
  
  await db.query(
    'INSERT INTO dam_asset_tags (asset_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [assetId, tagId]
  );
  res.json({ message: 'Tag added to asset' });
});

exports.removeTagFromAsset = asyncHandler(async (req, res) => {
  const { assetId, tagId } = req.body;
  
  await db.query('DELETE FROM dam_asset_tags WHERE asset_id = $1 AND tag_id = $2', [assetId, tagId]);
  res.json({ message: 'Tag removed from asset' });
});

// File upload handler
exports.uploadFiles = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { folderId } = req.body;
  
  if (!req.processedFiles || req.processedFiles.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const uploadedAssets = [];
  
  for (const file of req.processedFiles) {
    const result = await db.query(
      `INSERT INTO dam_assets 
       (org_id, filename, disk_path, mime_type, size_bytes, folder_id, width, height, thumb_path, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        orgId,
        file.filename,
        file.diskPath,
        file.mimeType,
        file.sizeBytes,
        folderId || null,
        file.width,
        file.height,
        file.thumbPath,
        userId
      ]
    );
    
    uploadedAssets.push(result.rows[0]);
  }
  
  res.status(201).json({
    message: `Successfully uploaded ${uploadedAssets.length} file(s)`,
    assets: uploadedAssets
  });
});

// Serve asset file
exports.serveAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  
  const result = await db.query('SELECT * FROM dam_assets WHERE id = $1 AND org_id = $2', [id, orgId]);
  
  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  
  const asset = result.rows[0];
  const fs = require('fs');
  const path = require('path');
  
  // Use thumbnail if available and requested
  const filePath = req.query.thumb && asset.thumb_path ? asset.thumb_path : asset.disk_path;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }
  
  res.setHeader('Content-Type', asset.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${asset.filename}"`);
  res.sendFile(path.resolve(filePath));
});

// Image transformation endpoint
exports.transformAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height, format, quality, fit } = req.query;

    // Get asset from database
    const result = await pool.query(
      'SELECT * FROM dam_assets WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = result.rows[0];

    // Only transform images
    if (!asset.mime_type.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images can be transformed' });
    }

    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../../uploads', asset.storage_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    let transformer = sharp(filePath);

    // Apply transformations
    if (width || height) {
      const resizeOptions = {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit: fit || 'inside', // inside, outside, cover, contain, fill
        withoutEnlargement: true
      };
      transformer = transformer.resize(resizeOptions);
    }

    if (quality) {
      const q = parseInt(quality);
      if (q >= 1 && q <= 100) {
        if (format === 'jpeg' || format === 'jpg') {
          transformer = transformer.jpeg({ quality: q });
        } else if (format === 'png') {
          transformer = transformer.png({ quality: q });
        } else if (format === 'webp') {
          transformer = transformer.webp({ quality: q });
        }
      }
    }

    if (format) {
      transformer = transformer.toFormat(format);
    }

    // Set appropriate content type
    let contentType = asset.mime_type;
    if (format === 'jpeg' || format === 'jpg') {
      contentType = 'image/jpeg';
    } else if (format === 'png') {
      contentType = 'image/png';
    } else if (format === 'webp') {
      contentType = 'image/webp';
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    transformer.pipe(res);

  } catch (error) {
    console.error('Transform asset error:', error);
    res.status(500).json({ error: 'Failed to transform asset' });
  }
};

// Get asset usage tracking
exports.getAssetUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        du.*,
        u.username as used_by_name
       FROM dam_usage du
       LEFT JOIN users u ON du.used_by = u.id
       WHERE du.asset_id = $1
       ORDER BY du.used_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get asset usage error:', error);
    res.status(500).json({ error: 'Failed to get asset usage' });
  }
};

// Track asset usage
exports.trackAssetUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { moduleType, moduleId, context } = req.body;
    const userId = req.user?.id;

    const result = await pool.query(
      `INSERT INTO dam_usage (asset_id, module_type, module_id, context, used_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, moduleType, moduleId, context, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Track asset usage error:', error);
    res.status(500).json({ error: 'Failed to track asset usage' });
  }
};

// Generate public share link
exports.generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiresIn, permissions } = req.body; // expiresIn in hours, permissions: 'view' | 'download'

    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    }

    const result = await pool.query(
      `UPDATE dam_assets 
       SET share_token = $1, 
           share_expires_at = $2,
           share_permissions = $3,
           is_public = true
       WHERE id = $4
       RETURNING *`,
      [shareToken, expiresAt, permissions || 'view', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/api/v1/dam/share/${shareToken}`;

    res.json({
      shareUrl,
      shareToken,
      expiresAt,
      permissions: permissions || 'view'
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
};

// Access shared asset
exports.accessSharedAsset = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT * FROM dam_assets 
       WHERE share_token = $1 
       AND is_public = true
       AND deleted_at IS NULL
       AND (share_expires_at IS NULL OR share_expires_at > NOW())`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shared asset not found or expired' });
    }

    const asset = result.rows[0];
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../../uploads', asset.storage_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.set('Content-Type', asset.mime_type);
    res.set('Content-Disposition', `inline; filename="${asset.filename}"`);
    
    if (asset.share_permissions === 'view') {
      res.set('Content-Disposition', `inline; filename="${asset.filename}"`);
    } else {
      res.set('Content-Disposition', `attachment; filename="${asset.filename}"`);
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Access shared asset error:', error);
    res.status(500).json({ error: 'Failed to access shared asset' });
  }
};

// Revoke share link
exports.revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE dam_assets 
       SET share_token = NULL,
           share_expires_at = NULL,
           share_permissions = NULL,
           is_public = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('Revoke share link error:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
};
