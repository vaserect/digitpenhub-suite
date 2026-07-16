const db = require('../db');
const dns = require('dns').promises;
const crypto = require('crypto');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List all sites for org
async function listSites(req, res) {
  const { status, q, limit = 50, offset = 0 } = req.query;

  const conditions = ['org_id = $1'];
  const values = [req.user.orgId];
  let idx = 2;

  if (status) {
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  if (q && q.trim()) {
    conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${q.trim()}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  values.push(parseInt(limit) || 50, parseInt(offset) || 0);

  try {
    const { rows } = await db.query(
      `SELECT s.*, t.name as theme_name,
              (SELECT COUNT(*)::int FROM pages WHERE site_id = s.id) as page_count
       FROM builder_sites s
       LEFT JOIN builder_themes t ON s.theme_id = t.id
       WHERE ${where}
       ORDER BY s.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM builder_sites WHERE ${where}`,
      values.slice(0, -2)
    );

    res.json({
      sites: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (err) {
    console.error('Error listing sites:', err);
    res.status(500).json({ error: 'Failed to list sites.' });
  }
}

// Get site details
async function getSite(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT s.*, t.name as theme_name,
              (SELECT COUNT(*)::int FROM pages WHERE site_id = s.id) as page_count
       FROM builder_sites s
       LEFT JOIN builder_themes t ON s.theme_id = t.id
       WHERE s.id = $1 AND s.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    res.json({ site: rows[0] });
  } catch (err) {
    console.error('Error getting site:', err);
    res.status(500).json({ error: 'Failed to get site.' });
  }
}

// Create new site
async function createSite(req, res) {
  const { name, description, themeId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Site name is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO builder_sites (org_id, name, description, theme_id, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [req.user.orgId, name.trim(), description || null, themeId || null]
    );

    res.status(201).json({ site: rows[0] });
  } catch (err) {
    console.error('Error creating site:', err);
    res.status(500).json({ error: 'Failed to create site.' });
  }
}

// Update site
async function updateSite(req, res) {
  const { id } = req.params;
  const { name, description, themeId, favicon, navigation, footer, seoSettings } = req.body;

  const existing = await db.query(
    `SELECT id FROM builder_sites WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );

  if (!existing.rows.length) {
    return res.status(404).json({ error: 'Site not found.' });
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
  if (themeId !== undefined) {
    updates.push(`theme_id = $${idx++}`);
    values.push(themeId || null);
  }
  if (favicon !== undefined) {
    updates.push(`favicon = $${idx++}`);
    values.push(favicon || null);
  }
  if (navigation !== undefined) {
    updates.push(`navigation = $${idx++}`);
    values.push(navigation ? JSON.stringify(navigation) : null);
  }
  if (footer !== undefined) {
    updates.push(`footer = $${idx++}`);
    values.push(footer ? JSON.stringify(footer) : null);
  }
  if (seoSettings !== undefined) {
    updates.push(`seo_settings = $${idx++}`);
    values.push(seoSettings ? JSON.stringify(seoSettings) : null);
  }

  if (!updates.length) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  updates.push(`updated_at = now()`);
  values.push(id, req.user.orgId);

  try {
    const { rows } = await db.query(
      `UPDATE builder_sites SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    res.json({ site: rows[0] });
  } catch (err) {
    console.error('Error updating site:', err);
    res.status(500).json({ error: 'Failed to update site.' });
  }
}

// Delete site
async function deleteSite(req, res) {
  const { id } = req.params;

  try {
    // Delete all pages first
    await db.query(
      `DELETE FROM pages WHERE site_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    // Delete site
    const { rowCount } = await db.query(
      `DELETE FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    res.json({ ok: true, message: 'Site and all pages deleted successfully.' });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ error: 'Failed to delete site.' });
  }
}

// Publish site
async function publishSite(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `UPDATE builder_sites 
       SET status = 'published', published_at = now(), updated_at = now()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Also publish all pages
    await db.query(
      `UPDATE pages SET status = 'published', updated_at = now()
       WHERE site_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    res.json({ site: rows[0], message: 'Site published successfully.' });
  } catch (err) {
    console.error('Error publishing site:', err);
    res.status(500).json({ error: 'Failed to publish site.' });
  }
}

// Unpublish site
async function unpublishSite(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `UPDATE builder_sites 
       SET status = 'draft', updated_at = now()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Also unpublish all pages
    await db.query(
      `UPDATE pages SET status = 'draft', updated_at = now()
       WHERE site_id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    res.json({ site: rows[0], message: 'Site unpublished successfully.' });
  } catch (err) {
    console.error('Error unpublishing site:', err);
    res.status(500).json({ error: 'Failed to unpublish site.' });
  }
}

// Duplicate site with transaction safety and loop guard
async function duplicateSite(req, res) {
  const { id } = req.params;
  const { newName } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Get original site
    const siteResult = await client.query(
      `SELECT * FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!siteResult.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Site not found.' });
    }

    const originalSite = siteResult.rows[0];

    // Create duplicate site
    const duplicateName = newName || `${originalSite.name} (Copy)`;
    const { rows: newSiteRows } = await client.query(
      `INSERT INTO builder_sites (
        org_id, name, description, theme_id, favicon, navigation,
        footer, seo_settings, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
      RETURNING *`,
      [
        req.user.orgId,
        duplicateName,
        originalSite.description,
        originalSite.theme_id,
        originalSite.favicon,
        originalSite.navigation,
        originalSite.footer,
        originalSite.seo_settings
      ]
    );

    const newSite = newSiteRows[0];

    // Get all pages from original site
    const pagesResult = await client.query(
      `SELECT * FROM pages WHERE site_id = $1 AND org_id = $2 ORDER BY created_at ASC`,
      [id, req.user.orgId]
    );

    // Duplicate all pages
    const duplicatedPages = [];
    for (const page of pagesResult.rows) {
      // Generate unique slug with max-iteration guard
      let baseSlug = slugify(page.slug);
      let finalSlug = `${baseSlug}-copy`;
      let suffix = 1;
      let attempts = 0;

      while (attempts < 20) {
        const exists = await client.query(
          `SELECT 1 FROM pages WHERE org_id = $1 AND slug = $2`,
          [req.user.orgId, finalSlug]
        );
        if (!exists.rows.length) break;
        suffix += 1;
        attempts += 1;
        finalSlug = `${baseSlug}-copy-${suffix}`;
      }

      if (attempts >= 20) {
        // Fall back to timestamp-based slug
        finalSlug = `${baseSlug}-copy-${Date.now()}`;
      }

      const { rows: newPageRows } = await client.query(
        `INSERT INTO pages (
          org_id, site_id, slug, title, meta_description, og_image,
          canonical_url, blocks, status, page_type, theme_id,
          seo_settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, $11)
        RETURNING *`,
        [
          req.user.orgId,
          newSite.id,
          finalSlug,
          page.title,
          page.meta_description,
          page.og_image,
          page.canonical_url,
          page.blocks,
          page.page_type,
          page.theme_id,
          page.seo_settings
        ]
      );

      duplicatedPages.push(newPageRows[0]);
    }

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      site: newSite,
      pagesCount: duplicatedPages.length,
      message: `Site duplicated successfully with ${duplicatedPages.length} pages.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error duplicating site:', err);
    res.status(500).json({ error: 'Failed to duplicate site.' });
  }
}

// Export site
async function exportSite(req, res) {
  const { id } = req.params;

  try {
    // Get site
    const siteResult = await db.query(
      `SELECT * FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!siteResult.rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Get all pages
    const pagesResult = await db.query(
      `SELECT * FROM pages WHERE site_id = $1 AND org_id = $2 ORDER BY created_at ASC`,
      [id, req.user.orgId]
    );

    // Get theme if exists
    let theme = null;
    if (siteResult.rows[0].theme_id) {
      const themeResult = await db.query(
        `SELECT * FROM builder_themes WHERE id = $1`,
        [siteResult.rows[0].theme_id]
      );
      theme = themeResult.rows[0] || null;
    }

    const exportData = {
      site: siteResult.rows[0],
      pages: pagesResult.rows,
      theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    res.json(exportData);
  } catch (err) {
    console.error('Error exporting site:', err);
    res.status(500).json({ error: 'Failed to export site.' });
  }
}

// Get site pages
async function getSitePages(req, res) {
  const { id } = req.params;

  try {
    // Verify site exists
    const siteCheck = await db.query(
      `SELECT id FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!siteCheck.rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    const { rows } = await db.query(
      `SELECT id, slug, title, meta_description, status, page_type,
              created_at, updated_at
       FROM pages
       WHERE site_id = $1 AND org_id = $2
       ORDER BY created_at ASC`,
      [id, req.user.orgId]
    );

    res.json({ pages: rows });
  } catch (err) {
    console.error('Error getting site pages:', err);
    res.status(500).json({ error: 'Failed to get site pages.' });
  }
}

// Get site analytics
async function getSiteAnalytics(req, res) {
  const { id } = req.params;

  try {
    // Verify site exists
    const siteCheck = await db.query(
      `SELECT id FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!siteCheck.rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Get page views from page_views table by site pages
    const { rows } = await db.query(
      `SELECT 
         COUNT(*)::int as total_views,
         COUNT(DISTINCT pv.visitor_hash)::int as unique_visitors,
         COUNT(DISTINCT pv.session_id)::int as unique_sessions,
         COUNT(DISTINCT DATE(pv.created_at))::int as days_tracked
       FROM page_views pv
       JOIN pages p ON p.id = pv.page_id
       WHERE p.site_id = $1 AND p.org_id = $2`,
      [id, req.user.orgId]
    );

    // Get per-page breakdown
    const pageViews = await db.query(
      `SELECT 
         p.id, p.slug, p.title, p.page_type,
         COUNT(pv.id)::int AS views,
         COUNT(DISTINCT pv.visitor_hash)::int AS unique_visitors
       FROM pages p
       LEFT JOIN page_views pv ON pv.page_id = p.id
       WHERE p.site_id = $1 AND p.org_id = $2
       GROUP BY p.id, p.slug, p.title, p.page_type
       ORDER BY views DESC`,
      [id, req.user.orgId]
    );

    res.json({
      analytics: rows[0] || {
        total_views: 0,
        unique_visitors: 0,
        unique_sessions: 0,
        days_tracked: 0
      },
      pageViews: pageViews.rows
    });
  } catch (err) {
    console.error('Error getting site analytics:', err);
    res.status(500).json({ error: 'Failed to get site analytics.' });
  }
}

// Update site settings
async function updateSiteSettings(req, res) {
  const { id } = req.params;
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required.' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE builder_sites 
       SET seo_settings = $1, updated_at = now()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [JSON.stringify(settings), id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    res.json({ site: rows[0], message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('Error updating site settings:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}

// Update custom domain
async function updateCustomDomain(req, res) {
  const { id } = req.params;
  const { customDomain } = req.body;

  try {
    // Generate verification token for DNS check
    const verificationToken = crypto.randomUUID();

    const { rows } = await db.query(
      `UPDATE builder_sites 
       SET custom_domain = $1, domain_verified = false, verification_token = $3, updated_at = now()
       WHERE id = $2 AND org_id = $4
       RETURNING *`,
      [customDomain || null, id, verificationToken, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    res.json({
      site: rows[0],
      verificationToken: customDomain ? verificationToken : undefined,
      message: customDomain
        ? 'Custom domain updated. Please add the TXT record to verify DNS settings.'
        : 'Custom domain removed.'
    });
  } catch (err) {
    console.error('Error updating custom domain:', err);
    res.status(500).json({ error: 'Failed to update custom domain.' });
  }
}

// Verify custom domain via real DNS TXT record check
async function verifyCustomDomain(req, res) {
  const { id } = req.params;

  try {
    // Get site
    const siteResult = await db.query(
      `SELECT custom_domain, verification_token FROM builder_sites WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    if (!siteResult.rows.length) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    const { custom_domain, verification_token } = siteResult.rows[0];

    if (!custom_domain) {
      return res.status(400).json({ error: 'No custom domain configured.' });
    }

    if (!verification_token) {
      return res.status(400).json({ error: 'No verification token found. Please set the custom domain first.' });
    }

    // Look up TXT records for the domain
    let txtRecords = [];
    try {
      const records = await dns.resolveTxt(custom_domain);
      txtRecords = records.flat().map(r => r.trim());
    } catch (dnsErr) {
      // DNS lookup failed — domain may not have any TXT records yet
      console.error(`DNS lookup failed for ${custom_domain}:`, dnsErr.message);
      return res.status(400).json({
        verified: false,
        error: `DNS lookup failed for ${custom_domain}. Ensure the domain has TXT records configured.`,
        details: dnsErr.message
      });
    }

    // Check if verification token exists in any TXT record
    const tokenFound = txtRecords.some(record => record.includes(verification_token));

    if (!tokenFound) {
      return res.status(400).json({
        verified: false,
        error: 'Verification token not found in DNS TXT records.',
        expectedToken: `digitpen-verify=${verification_token}`,
        foundRecords: txtRecords
      });
    }

    // Mark as verified
    const { rows } = await db.query(
      `UPDATE builder_sites 
       SET domain_verified = true, updated_at = now()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [id, req.user.orgId]
    );

    res.json({
      site: rows[0],
      verified: true,
      message: 'Domain verified successfully via DNS TXT record check.'
    });
  } catch (err) {
    console.error('Error verifying domain:', err);
    res.status(500).json({ error: 'Failed to verify domain.' });
  }
}

module.exports = {
  listSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  publishSite,
  unpublishSite,
  duplicateSite,
  exportSite,
  getSitePages,
  getSiteAnalytics,
  updateSiteSettings,
  updateCustomDomain,
  verifyCustomDomain
};
