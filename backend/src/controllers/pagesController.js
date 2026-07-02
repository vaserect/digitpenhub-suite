const db = require('../db');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Protected (org-scoped) ───────────────────────────────────────────────────

async function listPages(req, res) {
  const { type } = req.query;
  const { rows } = await db.query(
    `SELECT id, slug, title, meta_description, status, page_type, view_count, created_at, updated_at,
            jsonb_array_length(blocks) AS block_count
     FROM pages WHERE org_id = $1 AND ($2 = '' OR page_type = $2) ORDER BY updated_at DESC`,
    [req.user.orgId, type || '']
  );
  res.json({ pages: rows });
}

async function getPage(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT * FROM pages WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Page not found.' });
  res.json({ page: rows[0] });
}

async function createPage(req, res) {
  const { title, slug, metaDescription, pageType } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required.' });

  const finalSlug = slug ? slugify(slug) : slugify(title);
  if (!finalSlug) return res.status(400).json({ error: 'Invalid slug.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO pages (org_id, slug, title, meta_description, page_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.orgId, finalSlug, title.trim(), metaDescription || null, pageType || 'page']
    );
    res.status(201).json({ page: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Slug "${finalSlug}" is already in use.` });
    throw err;
  }
}

async function updatePage(req, res) {
  const { id } = req.params;
  const { title, slug, metaDescription, ogImage, canonicalUrl, blocks, status } = req.body || {};

  const existing = await db.query(`SELECT id FROM pages WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Page not found.' });

  const updates = [];
  const values = [];
  let idx = 1;

  if (title !== undefined)           { updates.push(`title = $${idx++}`);            values.push(title.trim()); }
  if (slug !== undefined)            { updates.push(`slug = $${idx++}`);             values.push(slugify(slug)); }
  if (metaDescription !== undefined) { updates.push(`meta_description = $${idx++}`); values.push(metaDescription || null); }
  if (ogImage !== undefined)         { updates.push(`og_image = $${idx++}`);         values.push(ogImage || null); }
  if (canonicalUrl !== undefined)    { updates.push(`canonical_url = $${idx++}`);    values.push(canonicalUrl || null); }
  if (blocks !== undefined)          { updates.push(`blocks = $${idx++}`);           values.push(JSON.stringify(Array.isArray(blocks) ? blocks : [])); }
  if (status !== undefined && ['draft','published'].includes(status)) {
    updates.push(`status = $${idx++}`);
    values.push(status);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  updates.push(`updated_at = now()`);
  values.push(id, req.user.orgId);

  try {
    const { rows } = await db.query(
      `UPDATE pages SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
      values
    );
    res.json({ page: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That slug is already in use.' });
    throw err;
  }
}

async function deletePage(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM pages WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Page not found.' });
  res.json({ ok: true });
}

// ── Public (no auth) ─────────────────────────────────────────────────────────

async function getPublicPage(req, res) {
  const { slug } = req.params;

  const { rows } = await db.query(
    `SELECT id, slug, title, meta_description, og_image, canonical_url, blocks
     FROM pages WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Page not found.' });

  db.query(`UPDATE pages SET view_count = view_count + 1 WHERE id = $1`, [rows[0].id]).catch(() => {});

  res.json({ page: rows[0] });
}

// Public — no auth. Lists every published page across all orgs so a single
// site-wide sitemap.xml can be generated (there's no per-org custom domain
// yet — all published pages are served from the one shared /p/[slug] host).
async function listPublicSitemap(req, res) {
  const { rows } = await db.query(
    `SELECT slug, updated_at FROM pages WHERE status = 'published' ORDER BY updated_at DESC`
  );
  res.json({ pages: rows });
}

// ── Preview (auth required — serves draft pages) ──────────────────────────────

async function previewPage(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT id, slug, title, meta_description, og_image, canonical_url, blocks, status, page_type FROM pages WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Page not found.' });
  res.json({ page: rows[0] });
}

module.exports = { listPages, getPage, createPage, updatePage, deletePage, getPublicPage, listPublicSitemap, previewPage };
