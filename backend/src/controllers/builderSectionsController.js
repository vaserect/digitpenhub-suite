const db = require('../db');

// List all sections (global + org-specific) with pagination
async function listSections(req, res) {
  try {
    const { category, styleVariant, q, limit = 50, offset = 0 } = req.query;

    const conditions = ['(is_global = true OR org_id = $1)', 'is_active = true'];
    const values = [req.user.orgId];
    let idx = 2;

    if (category) {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }

    if (styleVariant) {
      conditions.push(`style_variant = $${idx++}`);
      values.push(styleVariant);
    }

    if (q && q.trim()) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx} OR $${idx} = ANY(tags))`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    const where = conditions.join(' AND ');
    values.push(parseInt(limit) || 50, parseInt(offset) || 0);

    const { rows } = await db.query(
      `SELECT id, name, description, category, is_global, style_variant,
              thumbnail_url, preview_html, tags, usage_count, version,
              created_at, updated_at
       FROM builder_sections
       WHERE ${where}
       ORDER BY is_global DESC, usage_count DESC, name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM builder_sections WHERE ${where}`,
      values.slice(0, -2)
    );

    res.json({
      sections: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (err) {
    console.error('[builderSectionsController.listSections] Error:', err);
    res.status(500).json({ error: 'Failed to list sections.' });
  }
}

// Get section details with blocks
async function getSection(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM builder_sections
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    res.json({ section: rows[0] });
  } catch (err) {
    console.error('[builderSectionsController.getSection] Error:', err);
    res.status(500).json({ error: 'Failed to get section.' });
  }
}

// Create custom section
async function createSection(req, res) {
  const {
    name,
    description,
    category,
    blocks,
    styleVariant,
    thumbnailUrl,
    previewHtml,
    tags,
    responsiveSettings
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Section name is required.' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  if (!blocks || !Array.isArray(blocks)) {
    return res.status(400).json({ error: 'Blocks array is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO builder_sections (
        org_id, name, description, category, blocks, style_variant,
        thumbnail_url, preview_html, tags, responsive_settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.orgId,
        name.trim(),
        description || null,
        category.trim(),
        JSON.stringify(blocks),
        styleVariant || 'modern',
        thumbnailUrl || null,
        previewHtml || null,
        tags || [],
        responsiveSettings ? JSON.stringify(responsiveSettings) : null
      ]
    );

    res.status(201).json({ section: rows[0] });
  } catch (err) {
    console.error('[builderSectionsController.createSection] Error:', err);
    res.status(500).json({ error: 'Failed to create section.' });
  }
}

// Update section
async function updateSection(req, res) {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    blocks,
    styleVariant,
    thumbnailUrl,
    previewHtml,
    tags,
    responsiveSettings,
    isActive
  } = req.body;

  try {
    // Check if section exists and belongs to org (can't edit global sections)
    const existing = await db.query(
      `SELECT id FROM builder_sections WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Section not found or cannot be edited.' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description || null);
    }
    if (category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(category.trim());
    }
    if (blocks !== undefined) {
      updates.push(`blocks = $${idx++}`);
      values.push(JSON.stringify(blocks));
    }
    if (styleVariant !== undefined) {
      updates.push(`style_variant = $${idx++}`);
      values.push(styleVariant);
    }
    if (thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${idx++}`);
      values.push(thumbnailUrl || null);
    }
    if (previewHtml !== undefined) {
      updates.push(`preview_html = $${idx++}`);
      values.push(previewHtml || null);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${idx++}`);
      values.push(tags || []);
    }
    if (responsiveSettings !== undefined) {
      updates.push(`responsive_settings = $${idx++}`);
      values.push(responsiveSettings ? JSON.stringify(responsiveSettings) : null);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    updates.push(`updated_at = now()`);
    updates.push(`version = version + 1`);
    values.push(id, req.user.orgId);

    const { rows } = await db.query(
      `UPDATE builder_sections SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    res.json({ section: rows[0] });
  } catch (err) {
    console.error('[builderSectionsController.updateSection] Error:', err);
    res.status(500).json({ error: 'Failed to update section.' });
  }
}

// Delete section
async function deleteSection(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM builder_sections WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Section not found or cannot be deleted.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[builderSectionsController.deleteSection] Error:', err);
    res.status(500).json({ error: 'Failed to delete section.' });
  }
}

// Use section in a page (add section's blocks to page)
async function useSectionInPage(req, res) {
  const { id } = req.params;
  const { pageId, position } = req.body;

  if (!pageId) {
    return res.status(400).json({ error: 'pageId is required.' });
  }

  try {
    // Verify section exists and is accessible
    const sectionCheck = await db.query(
      `SELECT blocks FROM builder_sections
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!sectionCheck.rows.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    // Verify page exists and belongs to org
    const pageCheck = await db.query(
      `SELECT blocks FROM pages WHERE id = $1 AND org_id = $2`,
      [pageId, req.user.orgId]
    );

    if (!pageCheck.rows.length) {
      return res.status(404).json({ error: 'Page not found.' });
    }

    const sectionBlocks = sectionCheck.rows[0].blocks || [];
    const currentBlocks = pageCheck.rows[0].blocks || [];

    // Add unique IDs to section blocks to avoid conflicts
    const newBlocks = sectionBlocks.map(block => ({
      ...block,
      id: `${block.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Insert blocks at specified position or append to end
    let updatedBlocks;
    if (position !== undefined && position >= 0 && position <= currentBlocks.length) {
      updatedBlocks = [
        ...currentBlocks.slice(0, position),
        ...newBlocks,
        ...currentBlocks.slice(position)
      ];
    } else {
      updatedBlocks = [...currentBlocks, ...newBlocks];
    }

    // Update page with new blocks
    const { rows } = await db.query(
      `UPDATE pages SET blocks = $1, updated_at = now()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [JSON.stringify(updatedBlocks), pageId, req.user.orgId]
    );

    // Increment section usage count
    await db.query(
      `UPDATE builder_sections SET usage_count = usage_count + 1
       WHERE id = $1`,
      [id]
    );

    res.json({
      page: rows[0],
      message: 'Section added to page successfully.',
      blocksAdded: newBlocks.length
    });
  } catch (err) {
    console.error('[builderSectionsController.useSectionInPage] Error:', err);
    res.status(500).json({ error: 'Failed to add section to page.' });
  }
}

module.exports = {
  listSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  useSectionInPage
};
