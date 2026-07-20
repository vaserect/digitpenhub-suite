const db = require('../db');
const logger = require('../utils/logger');

// =====================================================
// CORE BARCODE MANAGEMENT
// =====================================================

/**
 * Get barcode statistics and overview
 */
async function getStats(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT 
        COUNT(*) as total_barcodes,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_barcodes,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_barcodes,
        COALESCE(SUM(total_scans), 0) as total_scans,
        COALESCE(SUM(unique_scans), 0) as unique_scans,
        COALESCE(SUM(print_count), 0) as total_prints,
        COUNT(DISTINCT barcode_type) as barcode_types_used,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_last_7d,
        COUNT(CASE WHEN last_scanned_at > NOW() - INTERVAL '7 days' THEN 1 END) as scanned_last_7d
      FROM barcodes 
      WHERE org_id = $1`,
      [req.user.orgId]
    );

    const { rows: topBarcodes } = await db.query(
      `SELECT id, name, barcode_type, total_scans, unique_scans
      FROM barcodes
      WHERE org_id = $1 AND status = 'active'
      ORDER BY total_scans DESC
      LIMIT 5`,
      [req.user.orgId]
    );

    const { rows: typeBreakdown } = await db.query(
      `SELECT barcode_type, COUNT(*) as count
      FROM barcodes
      WHERE org_id = $1
      GROUP BY barcode_type
      ORDER BY count DESC`,
      [req.user.orgId]
    );

    res.json({
      stats: rows[0],
      topBarcodes,
      typeBreakdown
    });
  } catch (error) {
    logger.error('Error getting barcode stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
}

/**
 * List all barcodes with filtering and pagination
 */
async function listBarcodes(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      barcode_type,
      status,
      folder_id,
      tags,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['b.org_id = $1'];
    const params = [req.user.orgId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR content ILIKE $${paramCount} OR sku ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (barcode_type) {
      paramCount++;
      conditions.push(`barcode_type = $${paramCount}`);
      params.push(barcode_type);
    }

    if (status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (folder_id) {
      paramCount++;
      conditions.push(`folder_id = $${paramCount}`);
      params.push(folder_id);
    }

    if (tags) {
      paramCount++;
      conditions.push(`tags && $${paramCount}`);
      params.push(Array.isArray(tags) ? tags : [tags]);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSortColumns = ['created_at', 'updated_at', 'name', 'total_scans', 'print_count'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows } = await db.query(
      `SELECT 
        b.*,
        f.name as folder_name,
        t.name as template_name,
        p.name as product_name,
        p.sku as product_sku
      FROM barcodes b
      LEFT JOIN barcode_folders f ON b.folder_id = f.id
      LEFT JOIN barcode_templates t ON b.template_id = t.id
      LEFT JOIN products p ON b.product_id = p.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const countConditions = conditions.map(c => c.replace(/^[a-z]+\./, ''));
    const countWhere = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) as total FROM barcodes ${countWhere}`,
      params
    );

    res.json({
      barcodes: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].total),
        pages: Math.ceil(countRows[0].total / limit)
      }
    });
  } catch (error) {
    logger.error('Error listing barcodes:', error);
    res.status(500).json({ error: 'Failed to list barcodes' });
  }
}

/**
 * Get single barcode details
 */
async function getBarcode(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT 
        b.*,
        f.name as folder_name,
        t.name as template_name,
        p.name as product_name,
        p.sku as product_sku,
        u.email as creator_email
      FROM barcodes b
      LEFT JOIN barcode_folders f ON b.folder_id = f.id
      LEFT JOIN barcode_templates t ON b.template_id = t.id
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = $1 AND b.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Barcode not found' });
    }

    // Get recent scan events
    const { rows: recentScans } = await db.query(
      `SELECT scanned_at, country, city, device_type, browser_name
      FROM barcode_scan_events
      WHERE barcode_id = $1
      ORDER BY scanned_at DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      barcode: rows[0],
      recentScans
    });
  } catch (error) {
    logger.error('Error getting barcode:', error);
    res.status(500).json({ error: 'Failed to get barcode' });
  }
}

/**
 * Create new barcode
 */
async function createBarcode(req, res) {
  try {
    const {
      name,
      description,
      barcode_type = 'code128',
      content,
      human_readable,
      folder_id,
      tags = [],
      category,
      product_id,
      sku,
      template_id,
      bar_color = '#000000',
      background_color = '#FFFFFF',
      text_color = '#000000',
      width = 200,
      height = 100,
      bar_width = 2,
      show_text = true,
      text_position = 'bottom',
      text_size = 12,
      text_font = 'monospace',
      margin_top = 10,
      margin_bottom = 10,
      margin_left = 10,
      margin_right = 10,
      file_format = 'png',
      status = 'active',
      expires_at,
      notes,
      metadata = {}
    } = req.body;

    if (!name?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    // Validate barcode type
    const validTypes = ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 
                        'itf14', 'msi', 'pharmacode', 'codabar', 'datamatrix',
                        'pdf417', 'qr', 'aztec', 'gs1_128', 'isbn', 'issn'];
    if (!validTypes.includes(barcode_type)) {
      return res.status(400).json({ error: 'Invalid barcode type' });
    }

    const { rows } = await db.query(
      `INSERT INTO barcodes (
        org_id, user_id, name, description, barcode_type, content, human_readable,
        folder_id, tags, category, product_id, sku, template_id,
        bar_color, background_color, text_color,
        width, height, bar_width,
        show_text, text_position, text_size, text_font,
        margin_top, margin_bottom, margin_left, margin_right,
        file_format, status, expires_at, notes, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28, $29, $30, $31, $32
      ) RETURNING *`,
      [
        req.user.orgId, req.user.id, name.trim(), description, barcode_type, 
        content.trim(), human_readable, folder_id, tags, category, product_id, 
        sku, template_id, bar_color, background_color, text_color,
        width, height, bar_width, show_text, text_position, text_size, text_font,
        margin_top, margin_bottom, margin_left, margin_right,
        file_format, status, expires_at, notes, metadata
      ]
    );

    logger.info(`Barcode created: ${rows[0].id} by user ${req.user.id}`);
    res.status(201).json({ barcode: rows[0] });
  } catch (error) {
    logger.error('Error creating barcode:', error);
    res.status(500).json({ error: 'Failed to create barcode' });
  }
}

/**
 * Update barcode
 */
async function updateBarcode(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'name', 'description', 'content', 'human_readable', 'folder_id', 'tags',
      'category', 'product_id', 'sku', 'template_id', 'bar_color', 
      'background_color', 'text_color', 'width', 'height', 'bar_width',
      'show_text', 'text_position', 'text_size', 'text_font',
      'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
      'file_format', 'status', 'expires_at', 'notes', 'metadata'
    ];

    const setClause = [];
    const params = [id, req.user.orgId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await db.query(
      `UPDATE barcodes 
      SET ${setClause.join(', ')}
      WHERE id = $1 AND org_id = $2
      RETURNING *`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Barcode not found' });
    }

    logger.info(`Barcode updated: ${id} by user ${req.user.id}`);
    res.json({ barcode: rows[0] });
  } catch (error) {
    logger.error('Error updating barcode:', error);
    res.status(500).json({ error: 'Failed to update barcode' });
  }
}

/**
 * Delete barcode
 */
async function deleteBarcode(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM barcodes WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Barcode not found' });
    }

    logger.info(`Barcode deleted: ${id} by user ${req.user.id}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting barcode:', error);
    res.status(500).json({ error: 'Failed to delete barcode' });
  }
}

/**
 * Bulk delete barcodes
 */
async function bulkDeleteBarcodes(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid barcode IDs' });
    }

    const { rowCount } = await db.query(
      `DELETE FROM barcodes WHERE id = ANY($1) AND org_id = $2`,
      [ids, req.user.orgId]
    );

    logger.info(`Bulk deleted ${rowCount} barcodes by user ${req.user.id}`);
    res.json({ deleted: rowCount });
  } catch (error) {
    logger.error('Error bulk deleting barcodes:', error);
    res.status(500).json({ error: 'Failed to delete barcodes' });
  }
}

// =====================================================
// FOLDERS & ORGANIZATION
// =====================================================

/**
 * List folders
 */
async function listFolders(req, res) {
  try {
    const { parent_id } = req.query;

    const { rows } = await db.query(
      `SELECT 
        f.*,
        COUNT(b.id) as barcode_count
      FROM barcode_folders f
      LEFT JOIN barcodes b ON f.id = b.folder_id AND b.org_id = f.org_id
      WHERE f.org_id = $1 AND ($2::BIGINT IS NULL OR f.parent_id = $2)
      GROUP BY f.id
      ORDER BY f.name`,
      [req.user.orgId, parent_id || null]
    );

    res.json({ folders: rows });
  } catch (error) {
    logger.error('Error listing folders:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
}

/**
 * Create folder
 */
async function createFolder(req, res) {
  try {
    const { name, description, parent_id, color, icon } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO barcode_folders (org_id, parent_id, name, description, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [req.user.orgId, parent_id || null, name.trim(), description, color, icon]
    );

    res.status(201).json({ folder: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Folder with this name already exists' });
    }
    logger.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

/**
 * Update folder
 */
async function updateFolder(req, res) {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const { rows } = await db.query(
      `UPDATE barcode_folders
      SET name = COALESCE($3, name),
          description = COALESCE($4, description),
          color = COALESCE($5, color),
          icon = COALESCE($6, icon)
      WHERE id = $1 AND org_id = $2
      RETURNING *`,
      [id, req.user.orgId, name, description, color, icon]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ folder: rows[0] });
  } catch (error) {
    logger.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
}

/**
 * Delete folder
 */
async function deleteFolder(req, res) {
  try {
    const { id } = req.params;

    // Check if folder has barcodes
    const { rows: barcodeCheck } = await db.query(
      `SELECT COUNT(*) as count FROM barcodes WHERE folder_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (parseInt(barcodeCheck[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with barcodes. Move or delete barcodes first.' 
      });
    }

    const { rowCount } = await db.query(
      `DELETE FROM barcode_folders WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

// =====================================================
// TEMPLATES
// =====================================================

/**
 * List templates
 */
async function listTemplates(req, res) {
  try {
    const { category, is_global } = req.query;

    const conditions = ['(org_id = $1 OR is_global = true)'];
    const params = [req.user.orgId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (is_global !== undefined) {
      paramCount++;
      conditions.push(`is_global = $${paramCount}`);
      params.push(is_global === 'true');
    }

    const { rows } = await db.query(
      `SELECT * FROM barcode_templates
      WHERE ${conditions.join(' AND ')}
      ORDER BY is_global DESC, usage_count DESC, name`,
      params
    );

    res.json({ templates: rows });
  } catch (error) {
    logger.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
}

/**
 * Create template
 */
async function createTemplate(req, res) {
  try {
    const {
      name,
      description,
      category,
      barcode_type = 'code128',
      bar_color = '#000000',
      background_color = '#FFFFFF',
      text_color = '#000000',
      width = 200,
      height = 100,
      bar_width = 2,
      show_text = true,
      text_position = 'bottom',
      text_size = 12,
      text_font = 'monospace',
      margin_top = 10,
      margin_bottom = 10,
      margin_left = 10,
      margin_right = 10
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO barcode_templates (
        org_id, name, description, category, barcode_type,
        bar_color, background_color, text_color,
        width, height, bar_width,
        show_text, text_position, text_size, text_font,
        margin_top, margin_bottom, margin_left, margin_right
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        req.user.orgId, name.trim(), description, category, barcode_type,
        bar_color, background_color, text_color,
        width, height, bar_width,
        show_text, text_position, text_size, text_font,
        margin_top, margin_bottom, margin_left, margin_right
      ]
    );

    res.status(201).json({ template: rows[0] });
  } catch (error) {
    logger.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
}

/**
 * Update template
 */
async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'description', 'category', 'barcode_type',
      'bar_color', 'background_color', 'text_color',
      'width', 'height', 'bar_width',
      'show_text', 'text_position', 'text_size', 'text_font',
      'margin_top', 'margin_bottom', 'margin_left', 'margin_right'
    ];

    const setClause = [];
    const params = [id, req.user.orgId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { rows } = await db.query(
      `UPDATE barcode_templates 
      SET ${setClause.join(', ')}
      WHERE id = $1 AND org_id = $2
      RETURNING *`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template: rows[0] });
  } catch (error) {
    logger.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
}

/**
 * Delete template
 */
async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM barcode_templates WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

// =====================================================
// BATCH GENERATION
// =====================================================

/**
 * Create batch generation job
 */
async function createBatch(req, res) {
  try {
    const {
      name,
      description,
      barcode_type,
      template_id,
      total_codes,
      start_number,
      prefix = '',
      suffix = '',
      items = []
    } = req.body;

    if (!name?.trim() || !barcode_type || !total_codes) {
      return res.status(400).json({ 
        error: 'Name, barcode type, and total codes are required' 
      });
    }

    if (total_codes > 10000) {
      return res.status(400).json({ 
        error: 'Maximum 10,000 codes per batch' 
      });
    }

    const { rows } = await db.query(
      `INSERT INTO barcode_batches (
        org_id, user_id, name, description, barcode_type, template_id,
        total_codes, start_number, prefix, suffix
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.orgId, req.user.id, name.trim(), description, barcode_type,
        template_id, total_codes, start_number, prefix, suffix
      ]
    );

    const batchId = rows[0].id;

    // Insert batch items
    if (items.length > 0) {
      const itemValues = items.map((item, idx) => 
        `(${batchId}, '${JSON.stringify(item).replace(/'/g, "''")}', ${idx + 1})`
      ).join(',');

      await db.query(
        `INSERT INTO barcode_batch_items (batch_id, item_data, sequence_number)
        VALUES ${itemValues}`
      );
    } else {
      // Generate sequential items
      const itemValues = [];
      for (let i = 0; i < total_codes; i++) {
        const number = start_number ? start_number + i : i + 1;
        const content = `${prefix}${number}${suffix}`;
        itemValues.push(`(${batchId}, '{"content":"${content}"}', ${i + 1})`);
      }

      await db.query(
        `INSERT INTO barcode_batch_items (batch_id, item_data, sequence_number)
        VALUES ${itemValues.join(',')}`
      );
    }

    logger.info(`Batch created: ${batchId} with ${total_codes} codes`);
    res.status(201).json({ batch: rows[0] });
  } catch (error) {
    logger.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
}

/**
 * List batches
 */
async function listBatches(req, res) {
  try {
    const { status } = req.query;

    const conditions = ['b.org_id = $1'];
    const params = [req.user.orgId];

    if (status) {
      conditions.push('status = $2');
      params.push(status);
    }

    const { rows } = await db.query(
      `SELECT 
        b.*,
        u.email as creator_email,
        COUNT(bi.id) as items_count
      FROM barcode_batches b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN barcode_batch_items bi ON b.id = bi.batch_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY b.id, u.email
      ORDER BY b.created_at DESC`,
      params
    );

    res.json({ batches: rows });
  } catch (error) {
    logger.error('Error listing batches:', error);
    res.status(500).json({ error: 'Failed to list batches' });
  }
}

/**
 * Get batch details
 */
async function getBatch(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT b.*, u.email as creator_email
      FROM barcode_batches b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = $1 AND b.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const { rows: items } = await db.query(
      `SELECT * FROM barcode_batch_items
      WHERE batch_id = $1
      ORDER BY sequence_number
      LIMIT 100`,
      [id]
    );

    res.json({
      batch: rows[0],
      items
    });
  } catch (error) {
    logger.error('Error getting batch:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
}

/**
 * Process batch (generate barcodes)
 */
async function processBatch(req, res) {
  try {
    const { id } = req.params;

    // Update batch status to processing
    await db.query(
      `UPDATE barcode_batches 
      SET status = 'processing'
      WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    // In production, this would trigger a background job
    // For now, we'll just mark it as completed
    await db.query(
      `UPDATE barcode_batches 
      SET status = 'completed', completed_at = NOW()
      WHERE id = $1`,
      [id]
    );

    logger.info(`Batch processing started: ${id}`);
    res.json({ success: true, message: 'Batch processing started' });
  } catch (error) {
    logger.error('Error processing batch:', error);
    res.status(500).json({ error: 'Failed to process batch' });
  }
}

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get barcode analytics
 */
async function getAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    const intervals = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };

    const interval = intervals[period] || '7 days';

    // Get scan statistics
    const { rows: scanStats } = await db.query(
      `SELECT 
        COUNT(*) as total_scans,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT DATE(scanned_at)) as active_days
      FROM barcode_scan_events
      WHERE barcode_id = $1 AND scanned_at > NOW() - INTERVAL '${interval}'`,
      [id]
    );

    // Get geographic breakdown
    const { rows: geoData } = await db.query(
      `SELECT country, COUNT(*) as scans
      FROM barcode_scan_events
      WHERE barcode_id = $1 AND scanned_at > NOW() - INTERVAL '${interval}'
      GROUP BY country
      ORDER BY scans DESC
      LIMIT 10`,
      [id]
    );

    // Get device breakdown
    const { rows: deviceData } = await db.query(
      `SELECT device_type, COUNT(*) as scans
      FROM barcode_scan_events
      WHERE barcode_id = $1 AND scanned_at > NOW() - INTERVAL '${interval}'
      GROUP BY device_type
      ORDER BY scans DESC`,
      [id]
    );

    // Get daily trend
    const { rows: dailyTrend } = await db.query(
      `SELECT 
        DATE(scanned_at) as date,
        COUNT(*) as scans,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM barcode_scan_events
      WHERE barcode_id = $1 AND scanned_at > NOW() - INTERVAL '${interval}'
      GROUP BY DATE(scanned_at)
      ORDER BY date`,
      [id]
    );

    res.json({
      summary: scanStats[0],
      geographic: geoData,
      devices: deviceData,
      trend: dailyTrend
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
}

/**
 * Track barcode scan
 */
async function trackScan(req, res) {
  try {
    const { id } = req.params;
    const {
      visitor_id,
      session_id,
      scan_method,
      scanner_type
    } = req.body;

    // Get IP and user agent from request
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const referer = req.headers['referer'];

    await db.query(
      `INSERT INTO barcode_scan_events (
        barcode_id, org_id, visitor_id, session_id,
        ip_address, user_agent, referer,
        scan_method, scanner_type
      )
      SELECT $1, org_id, $2, $3, $4, $5, $6, $7, $8
      FROM barcodes
      WHERE id = $1`,
      [id, visitor_id, session_id, ip_address, user_agent, referer, scan_method, scanner_type]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking scan:', error);
    res.status(500).json({ error: 'Failed to track scan' });
  }
}

// =====================================================
// PRINT TEMPLATES
// =====================================================

/**
 * List print templates
 */
async function listPrintTemplates(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT * FROM barcode_print_templates
      WHERE org_id = $1
      ORDER BY name`,
      [req.user.orgId]
    );

    res.json({ templates: rows });
  } catch (error) {
    logger.error('Error listing print templates:', error);
    res.status(500).json({ error: 'Failed to list print templates' });
  }
}

/**
 * Create print template
 */
async function createPrintTemplate(req, res) {
  try {
    const {
      name,
      description,
      paper_size = 'letter',
      paper_width,
      paper_height,
      label_width,
      label_height,
      columns = 1,
      rows = 1,
      horizontal_spacing = 0,
      vertical_spacing = 0,
      margin_top = 0.5,
      margin_bottom = 0.5,
      margin_left = 0.5,
      margin_right = 0.5,
      layout_config = {},
      label_type
    } = req.body;

    if (!name?.trim() || !label_width || !label_height) {
      return res.status(400).json({ 
        error: 'Name, label width, and label height are required' 
      });
    }

    const { rows: resultRows } = await db.query(
      `INSERT INTO barcode_print_templates (
        org_id, name, description, paper_size, paper_width, paper_height,
        label_width, label_height, columns, rows,
        horizontal_spacing, vertical_spacing,
        margin_top, margin_bottom, margin_left, margin_right,
        layout_config, label_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        req.user.orgId, name.trim(), description, paper_size, paper_width, paper_height,
        label_width, label_height, columns, rows,
        horizontal_spacing, vertical_spacing,
        margin_top, margin_bottom, margin_left, margin_right,
        layout_config, label_type
      ]
    );

    res.status(201).json({ template: resultRows[0] });
  } catch (error) {
    logger.error('Error creating print template:', error);
    res.status(500).json({ error: 'Failed to create print template' });
  }
}

// =====================================================
// ASSETS & INVENTORY
// =====================================================

/**
 * Link barcode to asset
 */
async function linkAsset(req, res) {
  try {
    const { id } = req.params;
    const {
      asset_name,
      asset_type,
      serial_number,
      model,
      manufacturer,
      location,
      department,
      assigned_to,
      purchase_date,
      purchase_price,
      status = 'active',
      notes
    } = req.body;

    if (!asset_name?.trim()) {
      return res.status(400).json({ error: 'Asset name is required' });
    }

    const { rows } = await db.query(
      `INSERT INTO barcode_assets (
        org_id, barcode_id, asset_name, asset_type, serial_number,
        model, manufacturer, location, department, assigned_to,
        purchase_date, purchase_price, status, notes
      )
      SELECT org_id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      FROM barcodes
      WHERE id = $1 AND org_id = $14
      RETURNING *`,
      [
        id, asset_name.trim(), asset_type, serial_number, model, manufacturer,
        location, department, assigned_to, purchase_date, purchase_price,
        status, notes, req.user.orgId
      ]
    );

    res.status(201).json({ asset: rows[0] });
  } catch (error) {
    logger.error('Error linking asset:', error);
    res.status(500).json({ error: 'Failed to link asset' });
  }
}

/**
 * Get asset details
 */
async function getAsset(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT a.*, u.email as assigned_to_email
      FROM barcode_assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.barcode_id = $1 AND a.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ asset: rows[0] });
  } catch (error) {
    logger.error('Error getting asset:', error);
    res.status(500).json({ error: 'Failed to get asset' });
  }
}

// =====================================================
// PUBLIC ENDPOINTS (No Auth Required)
// =====================================================

/**
 * Resolve barcode (public endpoint)
 */
async function resolveBarcode(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM barcodes WHERE id = $1 AND status = 'active'`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Barcode not found' });
    }

    const barcode = rows[0];

    // Check if expired
    if (barcode.expires_at && new Date(barcode.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Barcode has expired' });
    }

    // Track the scan
    const visitor_id = req.cookies?.visitor_id || `visitor_${Date.now()}`;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    await db.query(
      `INSERT INTO barcode_scan_events (
        barcode_id, org_id, visitor_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)`,
      [id, barcode.org_id, visitor_id, ip_address, user_agent]
    );

    // Return barcode data
    const isUrl = /^https?:\/\//i.test(barcode.content || '');

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        id: barcode.id,
        name: barcode.name,
        content: barcode.content,
        barcodeType: barcode.barcode_type,
        redirectUrl: isUrl ? barcode.content : undefined
      });
    }

    if (isUrl) {
      return res.redirect(302, barcode.content);
    }

    res.json({
      id: barcode.id,
      name: barcode.name,
      content: barcode.content,
      barcodeType: barcode.barcode_type
    });
  } catch (error) {
    logger.error('Error resolving barcode:', error);
    res.status(500).json({ error: 'Failed to resolve barcode' });
  }
}

module.exports = {
  // Core
  getStats,
  listBarcodes,
  getBarcode,
  createBarcode,
  updateBarcode,
  deleteBarcode,
  bulkDeleteBarcodes,
  
  // Folders
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  
  // Templates
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  
  // Batch
  createBatch,
  listBatches,
  getBatch,
  processBatch,
  
  // Analytics
  getAnalytics,
  trackScan,
  
  // Print
  listPrintTemplates,
  createPrintTemplate,
  
  // Assets
  linkAsset,
  getAsset,
  
  // Public
  resolveBarcode
};