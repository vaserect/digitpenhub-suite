const crypto = require('crypto');
const db = require('../db');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function visitorHash(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex');
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
  const { title, slug, metaDescription, pageType, customDomain } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required.' });

  const finalSlug = slug ? slugify(slug) : slugify(title);
  if (!finalSlug) return res.status(400).json({ error: 'Invalid slug.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO pages (org_id, slug, title, meta_description, page_type, custom_domain)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.orgId, finalSlug, title.trim(), metaDescription || null, pageType || 'page', customDomain ? customDomain.trim().toLowerCase() : null]
    );
    res.status(201).json({ page: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Slug "${finalSlug}" is already in use.` });
    throw err;
  }
}

async function updatePage(req, res) {
  const { id } = req.params;
  const { title, slug, metaDescription, ogImage, canonicalUrl, blocks, status, customDomain } = req.body || {};

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
  if (customDomain !== undefined)    { updates.push(`custom_domain = $${idx++}`);   values.push(customDomain ? customDomain.trim().toLowerCase() : null); }
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
    if (err.code === '23505') return res.status(409).json({ error: 'That slug or custom domain is already in use.' });
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
  // A visitor's Host header may match a page's connected custom_domain — in that
  // case serve that page directly, regardless of the /p/:slug route hit. Falls
  // back to the normal org-shared slug lookup otherwise.
  const host = (req.headers.host || '').split(':')[0].toLowerCase();

  let rows;
  if (host) {
    ({ rows } = await db.query(
      `SELECT id, org_id, slug, title, meta_description, og_image, canonical_url, blocks
       FROM pages WHERE custom_domain = $1 AND status = 'published'`,
      [host]
    ));
  }
  if (!rows || !rows.length) {
    ({ rows } = await db.query(
      `SELECT id, org_id, slug, title, meta_description, og_image, canonical_url, blocks
       FROM pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    ));
  }
  if (!rows.length) return res.status(404).json({ error: 'Page not found.' });

  const page = rows[0];
  db.query(`UPDATE pages SET view_count = view_count + 1 WHERE id = $1`, [page.id]).catch(() => {});
  try {
    db.query(
      `INSERT INTO page_views (page_id, org_id, visitor_hash) VALUES ($1, $2, $3)`,
      [page.id, page.org_id, visitorHash(req)]
    ).catch(() => {});
  } catch (_) { /* never let analytics tracking break the page */ }

  delete page.org_id;
  res.json({ page });
}

async function getPageAnalytics(req, res) {
  const { id } = req.params;
  const page = await db.query(`SELECT id FROM pages WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!page.rows.length) return res.status(404).json({ error: 'Page not found.' });

  const [totals, daily] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total_views, COUNT(DISTINCT visitor_hash)::int AS unique_visitors
       FROM page_views WHERE page_id = $1`,
      [id]
    ),
    db.query(
      `SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS views
       FROM page_views
       WHERE page_id = $1 AND created_at >= now() - interval '30 days'
       GROUP BY day ORDER BY day ASC`,
      [id]
    ),
  ]);

  res.json({
    totalViews: totals.rows[0]?.total_views || 0,
    uniqueVisitors: totals.rows[0]?.unique_visitors || 0,
    dailyViews: daily.rows,
  });
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

module.exports = { listPages, getPage, createPage, updatePage, deletePage, getPublicPage, listPublicSitemap, previewPage, getPageAnalytics };
