const db = require('../db');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function listTemplates(req, res) {
  const { category, pageType, q } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;
  if (category) { conditions.push(`category = $${idx++}`); values.push(category); }
  if (pageType) { conditions.push(`page_type = $${idx++}`); values.push(pageType); }
  if (q && q.trim()) { conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`); values.push(`%${q.trim()}%`); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT id, category, page_type, name, description, thumbnail_url, sort_order
     FROM page_templates ${where} ORDER BY category, sort_order, name`,
    values
  );
  res.json({ templates: rows });
}

async function listCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, COUNT(*) AS count FROM page_templates GROUP BY category ORDER BY category`
  );
  res.json({ categories: rows });
}

async function getTemplate(req, res) {
  const { rows } = await db.query(`SELECT * FROM page_templates WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}

// Creates a new page in the caller's org, pre-populated with the template's blocks.
async function useTemplate(req, res) {
  const { rows: tRows } = await db.query(`SELECT * FROM page_templates WHERE id = $1`, [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Template not found.' });
  const template = tRows[0];

  const title = (req.body && req.body.title) || template.name;
  const baseSlug = slugify(title) || 'page';
  let finalSlug = baseSlug;
  let suffix = 1;
  // Ensure slug uniqueness within the org by appending a numeric suffix if needed.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows: exists } = await db.query(
      `SELECT 1 FROM pages WHERE org_id = $1 AND slug = $2`,
      [req.user.orgId, finalSlug]
    );
    if (!exists.length) break;
    suffix += 1;
    finalSlug = `${baseSlug}-${suffix}`;
  }

  const { rows } = await db.query(
    `INSERT INTO pages (org_id, slug, title, blocks, status, page_type)
     VALUES ($1, $2, $3, $4, 'draft', $5) RETURNING *`,
    [req.user.orgId, finalSlug, title, JSON.stringify(template.blocks), template.page_type]
  );
  res.status(201).json({ page: rows[0] });
}

module.exports = { listTemplates, listCategories, getTemplate, useTemplate };
