const db = require('../db');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List templates with filters
async function listTemplates(req, res) {
  const { industry, category, styleVariant, featured, q, limit = 50, offset = 0 } = req.query;

  const conditions = ['is_global = true', 'is_active = true'];
  const values = [];
  let idx = 1;

  if (industry) {
    conditions.push(`industry = $${idx++}`);
    values.push(industry);
  }

  if (category) {
    conditions.push(`category = $${idx++}`);
    values.push(category);
  }

  if (styleVariant) {
    conditions.push(`style_variant = $${idx++}`);
    values.push(styleVariant);
  }

  if (featured === 'true') {
    conditions.push('is_featured = true');
  }

  if (q && q.trim()) {
    conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx} OR $${idx} = ANY(tags))`);
    values.push(`%${q.trim()}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  values.push(parseInt(limit) || 50, parseInt(offset) || 0);

  try {
    const { rows } = await db.query(
      `SELECT id, name, description, industry, category, style_variant,
              is_featured, is_premium, thumbnail_url, preview_images,
              demo_url, tags, usage_count, rating, rating_count,
              seo_title, seo_description, created_at, updated_at
       FROM builder_templates
       WHERE ${where}
       ORDER BY is_featured DESC, rating DESC, usage_count DESC, name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM builder_templates WHERE ${where}`,
      values.slice(0, -2)
    );

    res.json({
      templates: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (err) {
    console.error('Error listing templates:', err);
    res.status(500).json({ error: 'Failed to list templates.' });
  }
}

// Get template details
async function getTemplate(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT * FROM builder_templates WHERE id = $1 AND is_global = true`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    // Get page count
    const pageCount = await db.query(
      `SELECT COUNT(*)::int AS page_count FROM builder_template_pages WHERE template_id = $1`,
      [id]
    );

    res.json({
      template: {
        ...rows[0],
        pageCount: pageCount.rows[0].page_count
      }
    });
  } catch (err) {
    console.error('Error getting template:', err);
    res.status(500).json({ error: 'Failed to get template.' });
  }
}

// Get template pages
async function getTemplatePages(req, res) {
  const { id } = req.params;

  try {
    // Verify template exists
    const templateCheck = await db.query(
      `SELECT id FROM builder_templates WHERE id = $1 AND is_global = true`,
      [id]
    );

    if (!templateCheck.rows.length) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    const { rows } = await db.query(
      `SELECT id, name, slug, description, page_type, is_home, show_in_nav,
              nav_order, meta_title, meta_description, og_image, thumbnail_url,
              blocks, created_at, updated_at
       FROM builder_template_pages
       WHERE template_id = $1
       ORDER BY nav_order ASC, name ASC`,
      [id]
    );

    res.json({ pages: rows });
  } catch (err) {
    console.error('Error getting template pages:', err);
    res.status(500).json({ error: 'Failed to get template pages.' });
  }
}

// Use template (create site from template) with transaction safety and loop guard
async function useTemplate(req, res) {
  const { id } = req.params;
  const { siteName, customizeName } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Get template details
    const templateResult = await client.query(
      `SELECT * FROM builder_templates WHERE id = $1 AND is_global = true`,
      [id]
    );

    if (!templateResult.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Template not found.' });
    }

    const template = templateResult.rows[0];

    // Get template pages
    const pagesResult = await client.query(
      `SELECT * FROM builder_template_pages WHERE template_id = $1 ORDER BY nav_order ASC`,
      [id]
    );

    if (!pagesResult.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Template has no pages.' });
    }

    // Create site
    const siteNameFinal = siteName || template.name;
    const siteResult = await client.query(
      `INSERT INTO builder_sites (org_id, name, description, theme_id, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [req.user.orgId, siteNameFinal, template.description, template.theme_id]
    );

    const site = siteResult.rows[0];

    // Create pages from template
    const createdPages = [];
    const pageIdMap = {};

    for (const templatePage of pagesResult.rows) {
      // Generate unique slug with max-iteration guard
      let baseSlug = slugify(templatePage.slug);
      let finalSlug = baseSlug;
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
        finalSlug = `${baseSlug}-${suffix}`;
      }

      if (attempts >= 20) {
        finalSlug = `${baseSlug}-${Date.now()}`;
      }

      // Customize page name if requested
      let pageName = templatePage.name;
      if (customizeName && templatePage.is_home) {
        pageName = siteNameFinal;
      }

      // Create page
      const pageResult = await client.query(
        `INSERT INTO pages (
          org_id, site_id, slug, title, meta_description, og_image,
          canonical_url, blocks, status, page_type, theme_id,
          template_source_id, seo_settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, $11, $12)
        RETURNING *`,
        [
          req.user.orgId,
          site.id,
          finalSlug,
          pageName,
          templatePage.meta_description,
          templatePage.og_image,
          templatePage.canonical_url,
          JSON.stringify(templatePage.blocks),
          templatePage.page_type,
          template.theme_id,
          template.id,
          JSON.stringify({
            metaTitle: templatePage.meta_title,
            metaDescription: templatePage.meta_description
          })
        ]
      );

      const newPage = pageResult.rows[0];
      createdPages.push(newPage);
      pageIdMap[templatePage.id] = newPage.id;
    }

    // Build navigation structure
    const navigation = pagesResult.rows
      .filter(p => p.show_in_nav)
      .map(p => ({
        label: p.name,
        href: `/p/${createdPages.find(cp => pageIdMap[p.id] === cp.id)?.slug}`,
        order: p.nav_order
      }))
      .sort((a, b) => a.order - b.order);

    // Update site with navigation
    await client.query(
      `UPDATE builder_sites SET navigation = $1 WHERE id = $2`,
      [JSON.stringify(navigation), site.id]
    );

    // Increment template usage count
    await client.query(
      `UPDATE builder_templates SET usage_count = usage_count + 1 WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      site,
      pages: createdPages,
      message: `Site created successfully with ${createdPages.length} pages.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error using template:', err);
    res.status(500).json({ error: 'Failed to create site from template.' });
  }
}

// List template categories
async function listCategories(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, description, icon, parent_id, sort_order
       FROM builder_template_categories
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );

    res.json({ categories: rows });
  } catch (err) {
    console.error('Error listing categories:', err);
    res.status(500).json({ error: 'Failed to list categories.' });
  }
}

// List industries
async function listIndustries(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT industry, COUNT(*)::int AS template_count
       FROM builder_templates
       WHERE is_global = true AND is_active = true
       GROUP BY industry
       ORDER BY template_count DESC, industry ASC`
    );

    res.json({ industries: rows });
  } catch (err) {
    console.error('Error listing industries:', err);
    res.status(500).json({ error: 'Failed to list industries.' });
  }
}

// Get featured templates
async function getFeaturedTemplates(req, res) {
  const { limit = 10 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT id, name, description, industry, category, style_variant,
              thumbnail_url, preview_images, demo_url, tags, rating, rating_count,
              usage_count, seo_title, seo_description
       FROM builder_templates
       WHERE is_global = true AND is_active = true AND is_featured = true
       ORDER BY rating DESC, usage_count DESC
       LIMIT $1`,
      [parseInt(limit) || 10]
    );

    res.json({ templates: rows });
  } catch (err) {
    console.error('Error getting featured templates:', err);
    res.status(500).json({ error: 'Failed to get featured templates.' });
  }
}

// Get popular templates
async function getPopularTemplates(req, res) {
  const { limit = 10 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT id, name, description, industry, category, style_variant,
              thumbnail_url, preview_images, demo_url, tags, rating, rating_count,
              usage_count, seo_title, seo_description
       FROM builder_templates
       WHERE is_global = true AND is_active = true
       ORDER BY usage_count DESC, rating DESC
       LIMIT $1`,
      [parseInt(limit) || 10]
    );

    res.json({ templates: rows });
  } catch (err) {
    console.error('Error getting popular templates:', err);
    res.status(500).json({ error: 'Failed to get popular templates.' });
  }
}

// Rate template with duplicate prevention
async function rateTemplate(req, res) {
  const { id } = req.params;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Verify template exists
    const templateCheck = await client.query(
      `SELECT id FROM builder_templates WHERE id = $1 AND is_global = true`,
      [id]
    );

    if (!templateCheck.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Template not found.' });
    }

    // Check if user already rated this template
    const existingRating = await client.query(
      `SELECT id, rating FROM builder_template_ratings WHERE template_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    let newCount, newRating;

    if (existingRating.rows.length) {
      // User already rated — update their rating
      await client.query(
        `UPDATE builder_template_ratings SET rating = $1, updated_at = now()
         WHERE template_id = $2 AND user_id = $3`,
        [rating, id, req.user.id]
      );

      // Recalculate averages
      const avgResult = await client.query(
        `SELECT AVG(rating)::decimal(3,2) AS avg_rating, COUNT(*)::int AS count
         FROM builder_template_ratings WHERE template_id = $1`,
        [id]
      );

      newRating = parseFloat(avgResult.rows[0].avg_rating) || rating;
      newCount = parseInt(avgResult.rows[0].count) || 1;
    } else {
      // First time rating — insert new rating
      await client.query(
        `INSERT INTO builder_template_ratings (template_id, user_id, rating) VALUES ($1, $2, $3)`,
        [id, req.user.id, rating]
      );

      // Calculate new average
      const current = await client.query(
        `SELECT rating, rating_count FROM builder_templates WHERE id = $1`,
        [id]
      );

      const currentRating = parseFloat(current.rows[0].rating) || 0;
      const currentCount = parseInt(current.rows[0].rating_count) || 0;
      newCount = currentCount + 1;
      newRating = ((currentRating * currentCount) + rating) / newCount;
    }

    // Update template with recalculated rating
    await client.query(
      `UPDATE builder_templates SET rating = $1, rating_count = $2, updated_at = now() WHERE id = $3`,
      [newRating.toFixed(2), newCount, id]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      ok: true,
      rating: parseFloat(newRating),
      ratingCount: newCount,
      updated: existingRating.rows.length > 0,
      message: existingRating.rows.length > 0
        ? 'Your rating has been updated.'
        : 'Thank you for rating this template!'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error rating template:', err);
    res.status(500).json({ error: 'Failed to rate template.' });
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  getTemplatePages,
  useTemplate,
  listCategories,
  listIndustries,
  getFeaturedTemplates,
  getPopularTemplates,
  rateTemplate
};
