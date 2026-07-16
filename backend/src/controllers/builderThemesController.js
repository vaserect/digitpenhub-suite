const db = require('../db');

// List all themes (global + org-specific)
async function listThemes(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, is_global, colors, typography, spacing, 
              border_radius, shadows, animations, components, dark_mode, 
              thumbnail_url, is_active, created_at, updated_at
       FROM builder_themes
       WHERE (is_global = true OR org_id = $1) AND is_active = true
       ORDER BY is_global DESC, name ASC`,
      [req.user.orgId]
    );
    res.json({ themes: rows });
  } catch (err) {
    console.error('[builderThemesController.listThemes] Error:', err);
    res.status(500).json({ error: 'Failed to list themes.' });
  }
}

// Get theme details
async function getTheme(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM builder_themes
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Theme not found.' });
    }

    res.json({ theme: rows[0] });
  } catch (err) {
    console.error('[builderThemesController.getTheme] Error:', err);
    res.status(500).json({ error: 'Failed to get theme.' });
  }
}

// Create custom theme
async function createTheme(req, res) {
  const {
    name,
    description,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    components,
    darkMode,
    thumbnailUrl
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Theme name is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO builder_themes (
        org_id, name, description, colors, typography, spacing,
        border_radius, shadows, animations, components, dark_mode, thumbnail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.orgId,
        name.trim(),
        description || null,
        colors ? JSON.stringify(colors) : null,
        typography ? JSON.stringify(typography) : null,
        spacing ? JSON.stringify(spacing) : null,
        borderRadius ? JSON.stringify(borderRadius) : null,
        shadows ? JSON.stringify(shadows) : null,
        animations ? JSON.stringify(animations) : null,
        components ? JSON.stringify(components) : null,
        darkMode ? JSON.stringify(darkMode) : null,
        thumbnailUrl || null
      ]
    );

    res.status(201).json({ theme: rows[0] });
  } catch (err) {
    console.error('[builderThemesController.createTheme] Error:', err);
    res.status(500).json({ error: 'Failed to create theme.' });
  }
}

// Update theme
async function updateTheme(req, res) {
  const { id } = req.params;
  const {
    name,
    description,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    components,
    darkMode,
    thumbnailUrl,
    isActive
  } = req.body;

  try {
    // Check if theme exists and belongs to org (can't edit global themes)
    const existing = await db.query(
      `SELECT id FROM builder_themes WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Theme not found or cannot be edited.' });
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
    if (colors !== undefined) {
      updates.push(`colors = $${idx++}`);
      values.push(JSON.stringify(colors));
    }
    if (typography !== undefined) {
      updates.push(`typography = $${idx++}`);
      values.push(JSON.stringify(typography));
    }
    if (spacing !== undefined) {
      updates.push(`spacing = $${idx++}`);
      values.push(JSON.stringify(spacing));
    }
    if (borderRadius !== undefined) {
      updates.push(`border_radius = $${idx++}`);
      values.push(JSON.stringify(borderRadius));
    }
    if (shadows !== undefined) {
      updates.push(`shadows = $${idx++}`);
      values.push(JSON.stringify(shadows));
    }
    if (animations !== undefined) {
      updates.push(`animations = $${idx++}`);
      values.push(JSON.stringify(animations));
    }
    if (components !== undefined) {
      updates.push(`components = $${idx++}`);
      values.push(JSON.stringify(components));
    }
    if (darkMode !== undefined) {
      updates.push(`dark_mode = $${idx++}`);
      values.push(darkMode ? JSON.stringify(darkMode) : null);
    }
    if (thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${idx++}`);
      values.push(thumbnailUrl || null);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    updates.push(`updated_at = now()`);
    values.push(id, req.user.orgId);

    const { rows } = await db.query(
      `UPDATE builder_themes SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    res.json({ theme: rows[0] });
  } catch (err) {
    console.error('[builderThemesController.updateTheme] Error:', err);
    res.status(500).json({ error: 'Failed to update theme.' });
  }
}

// Delete theme
async function deleteTheme(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM builder_themes WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Theme not found or cannot be deleted.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[builderThemesController.deleteTheme] Error:', err);
    res.status(500).json({ error: 'Failed to delete theme.' });
  }
}

// Apply theme to a page
async function applyThemeToPage(req, res) {
  const { id, pageId } = req.params;

  try {
    // Verify theme exists and is accessible
    const themeCheck = await db.query(
      `SELECT id FROM builder_themes
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!themeCheck.rows.length) {
      return res.status(404).json({ error: 'Theme not found.' });
    }

    // Verify page exists and belongs to org
    const pageCheck = await db.query(
      `SELECT id FROM pages WHERE id = $1 AND org_id = $2`,
      [pageId, req.user.orgId]
    );

    if (!pageCheck.rows.length) {
      return res.status(404).json({ error: 'Page not found.' });
    }

    const { rows } = await db.query(
      `UPDATE pages SET theme_id = $1, updated_at = now()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [id, pageId, req.user.orgId]
    );

    res.json({ page: rows[0], message: 'Theme applied successfully.' });
  } catch (err) {
    console.error('[builderThemesController.applyThemeToPage] Error:', err);
    res.status(500).json({ error: 'Failed to apply theme.' });
  }
}

// Apply theme to all pages in a site
async function applyThemeToSite(req, res) {
  const { id, siteId } = req.params;

  try {
    // Verify theme exists and is accessible
    const themeCheck = await db.query(
      `SELECT id FROM builder_themes
       WHERE id = $1 AND (is_global = true OR org_id = $2)`,
      [id, req.user.orgId]
    );

    if (!themeCheck.rows.length) {
      return res.status(404).json({ error: 'Theme not found.' });
    }

    // Verify site exists and belongs to org
    const siteCheck = await db.query(
      `SELECT id FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [siteId, req.user.orgId]
    );

    if (!siteCheck.rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Update site theme
    await db.query(
      `UPDATE builder_sites SET theme_id = $1, updated_at = now()
       WHERE id = $2 AND org_id = $3`,
      [id, siteId, req.user.orgId]
    );

    // Update all pages in the site
    const { rows } = await db.query(
      `UPDATE pages SET theme_id = $1, updated_at = now()
       WHERE site_id = $2 AND org_id = $3
       RETURNING id`,
      [id, siteId, req.user.orgId]
    );

    res.json({
      ok: true,
      message: 'Theme applied to site and all pages.',
      pagesUpdated: rows.length
    });
  } catch (err) {
    console.error('[builderThemesController.applyThemeToSite] Error:', err);
    res.status(500).json({ error: 'Failed to apply theme.' });
  }
}

module.exports = {
  listThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  applyThemeToPage,
  applyThemeToSite
};
