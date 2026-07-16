const db = require('../db');

// List all components (global + org-specific)
async function listComponents(req, res) {
  try {
    const { category, blockType, q } = req.query;

    const conditions = ['(is_global = true OR org_id = $1)', 'is_active = true'];
    const values = [req.user.orgId];
    let idx = 2;

    if (category) {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }

    if (blockType) {
      conditions.push(`block_type = $${idx++}`);
      values.push(blockType);
    }

    if (q && q.trim()) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx} OR $${idx} = ANY(tags))`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    const { rows } = await db.query(
      `SELECT id, name, description, category, block_type, is_global,
              thumbnail_url, preview_html, tags, usage_count, version,
              created_at, updated_at
       FROM builder_components
       WHERE ${where}
       ORDER BY is_global DESC, usage_count DESC, name ASC`,
      values
    );

    res.json({ components: rows });
  } catch (err) {
    console.error('[builderComponentsController.listComponents] Error:', err);
    res.status(500).json({ error: 'Failed to list components.' });
  }
}

// Get component details
async function getComponent(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM builder_components
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Component not found.' });
    }

    res.json({ component: rows[0] });
  } catch (err) {
    console.error('[builderComponentsController.getComponent] Error:', err);
    res.status(500).json({ error: 'Failed to get component.' });
  }
}

// Create custom component
async function createComponent(req, res) {
  const {
    name,
    description,
    category,
    blockType,
    html,
    css,
    js,
    schema,
    defaultProps,
    thumbnailUrl,
    previewHtml,
    tags,
    responsiveSettings
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Component name is required.' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  if (!blockType || !blockType.trim()) {
    return res.status(400).json({ error: 'Block type is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO builder_components (
        org_id, name, description, category, block_type, html, css, js,
        schema, default_props, thumbnail_url, preview_html, tags, responsive_settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        req.user.orgId,
        name.trim(),
        description || null,
        category.trim(),
        blockType.trim(),
        html || null,
        css || null,
        js || null,
        schema ? JSON.stringify(schema) : null,
        defaultProps ? JSON.stringify(defaultProps) : null,
        thumbnailUrl || null,
        previewHtml || null,
        tags || [],
        responsiveSettings ? JSON.stringify(responsiveSettings) : null
      ]
    );

    res.status(201).json({ component: rows[0] });
  } catch (err) {
    console.error('[builderComponentsController.createComponent] Error:', err);
    res.status(500).json({ error: 'Failed to create component.' });
  }
}

// Update component
async function updateComponent(req, res) {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    blockType,
    html,
    css,
    js,
    schema,
    defaultProps,
    thumbnailUrl,
    previewHtml,
    tags,
    responsiveSettings,
    isActive
  } = req.body;

  try {
    // Check if component exists and belongs to org (can't edit global components)
    const existing = await db.query(
      `SELECT id FROM builder_components WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Component not found or cannot be edited.' });
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
    if (blockType !== undefined) {
      updates.push(`block_type = $${idx++}`);
      values.push(blockType.trim());
    }
    if (html !== undefined) {
      updates.push(`html = $${idx++}`);
      values.push(html || null);
    }
    if (css !== undefined) {
      updates.push(`css = $${idx++}`);
      values.push(css || null);
    }
    if (js !== undefined) {
      updates.push(`js = $${idx++}`);
      values.push(js || null);
    }
    if (schema !== undefined) {
      updates.push(`schema = $${idx++}`);
      values.push(schema ? JSON.stringify(schema) : null);
    }
    if (defaultProps !== undefined) {
      updates.push(`default_props = $${idx++}`);
      values.push(defaultProps ? JSON.stringify(defaultProps) : null);
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
      `UPDATE builder_components SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    res.json({ component: rows[0] });
  } catch (err) {
    console.error('[builderComponentsController.updateComponent] Error:', err);
    res.status(500).json({ error: 'Failed to update component.' });
  }
}

// Delete component
async function deleteComponent(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM builder_components WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Component not found or cannot be deleted.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[builderComponentsController.deleteComponent] Error:', err);
    res.status(500).json({ error: 'Failed to delete component.' });
  }
}

// List component categories
async function listComponentCategories(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT category, COUNT(*)::int AS component_count
       FROM builder_components
       WHERE (is_global = true OR org_id = $1) AND is_active = true
       GROUP BY category
       ORDER BY component_count DESC, category ASC`,
      [req.user.orgId]
    );

    res.json({ categories: rows });
  } catch (err) {
    console.error('[builderComponentsController.listComponentCategories] Error:', err);
    res.status(500).json({ error: 'Failed to list categories.' });
  }
}

module.exports = {
  listComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  listComponentCategories
};
