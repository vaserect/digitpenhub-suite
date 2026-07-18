const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(DISTINCT p.id) AS pages, COALESCE(SUM(p.views),0) AS total_views,
            COALESCE(SUM(bl.clicks),0) AS total_clicks, COUNT(DISTINCT bl.id) AS total_links
     FROM link_in_bio_pages p
     LEFT JOIN bio_links bl ON bl.page_id = p.id
     WHERE p.org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listPages(req, res) {
  const { rows } = await db.query(
    `SELECT p.*, COUNT(bl.id) AS link_count
     FROM link_in_bio_pages p
     LEFT JOIN bio_links bl ON bl.page_id = p.id
     WHERE p.org_id=$1
     GROUP BY p.id ORDER BY p.created_at DESC`, [req.user.orgId]);
  res.json({ pages: rows });
}

async function createPage(req, res) {
  const { title, bio, avatarUrl, slug, bgColor, accentColor } = req.body || {};
  if (!title?.trim() || !slug?.trim()) return res.status(400).json({ error: 'title and slug required.' });
  try {
    const { rows } = await db.query(
      `INSERT INTO link_in_bio_pages (org_id,title,bio,avatar_url,slug,bg_color,accent_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.orgId, title.trim(), bio||null, avatarUrl||null, slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-'), bgColor||'#ffffff', accentColor||'#2563eb']
    );
    res.status(201).json({ page: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Slug already taken.' });
    throw e;
  }
}

async function updatePage(req, res) {
  const { id } = req.params;
  const { title, bio, avatarUrl, slug, bgColor, accentColor, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE link_in_bio_pages SET title=COALESCE($3,title), bio=$4, avatar_url=$5,
            slug=COALESCE($6,slug), bg_color=COALESCE($7,bg_color), accent_color=COALESCE($8,accent_color), status=COALESCE($9,status)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, bio||null, avatarUrl||null, slug||null, bgColor||null, accentColor||null, status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ page: rows[0] });
}

async function deletePage(req, res) {
  await db.query(`DELETE FROM link_in_bio_pages WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listLinks(req, res) {
  const { pageId } = req.params;
  const { rows } = await db.query(
    `SELECT bl.* FROM bio_links bl JOIN link_in_bio_pages p ON p.id=bl.page_id
     WHERE bl.page_id=$1 AND p.org_id=$2 ORDER BY bl.sort_order ASC`, [pageId, req.user.orgId]);
  res.json({ links: rows });
}

async function createLink(req, res) {
  const { pageId } = req.params;
  const { title, url, icon, sortOrder } = req.body || {};
  if (!title?.trim() || !url?.trim()) return res.status(400).json({ error: 'title and url required.' });
  const page = await db.query(`SELECT id FROM link_in_bio_pages WHERE id=$1 AND org_id=$2`, [pageId, req.user.orgId]);
  if (!page.rows.length) return res.status(404).json({ error: 'Page not found.' });
  const { rows } = await db.query(
    `INSERT INTO bio_links (page_id,org_id,title,url,icon,sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [pageId, req.user.orgId, title.trim(), url.trim(), icon||'🔗', sortOrder||0]
  );
  res.status(201).json({ link: rows[0] });
}

async function updateLink(req, res) {
  const { id } = req.params;
  const { title, url, icon, sortOrder, isActive } = req.body || {};
  const { rows } = await db.query(
    `UPDATE bio_links SET title=COALESCE($3,title), url=COALESCE($4,url), icon=COALESCE($5,icon),
            sort_order=COALESCE($6,sort_order), is_active=COALESCE($7,is_active)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, url||null, icon||null, sortOrder??null, isActive??null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ link: rows[0] });
}

async function deleteLink(req, res) {
  await db.query(`DELETE FROM bio_links WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// Public route to view a bio page
async function getPublicPage(req, res) {
  const { slug } = req.params;
  
  // Get page details
  const pageResult = await db.query(
    `SELECT * FROM link_in_bio_pages WHERE slug=$1 AND status='active'`,
    [slug]
  );
  
  if (!pageResult.rows.length) {
    return res.status(404).json({ error: 'Page not found.' });
  }
  
  const page = pageResult.rows[0];
  
  // Increment view count
  await db.query(
    `UPDATE link_in_bio_pages SET views = COALESCE(views, 0) + 1 WHERE id=$1`,
    [page.id]
  );
  
  // Get active links
  const linksResult = await db.query(
    `SELECT * FROM bio_links WHERE page_id=$1 AND is_active=true ORDER BY sort_order ASC`,
    [page.id]
  );
  
  res.json({
    page: {
      ...page,
      views: (page.views || 0) + 1
    },
    links: linksResult.rows
  });
}

// Track link click
async function trackLinkClick(req, res) {
  const { linkId } = req.params;
  
  const result = await db.query(
    `UPDATE bio_links SET clicks = COALESCE(clicks, 0) + 1 WHERE id=$1 RETURNING url`,
    [linkId]
  );
  
  if (!result.rows.length) {
    return res.status(404).json({ error: 'Link not found.' });
  }
  
  res.json({ url: result.rows[0].url });
}

module.exports = { 
  getStats, 
  listPages, 
  createPage, 
  updatePage, 
  deletePage, 
  listLinks, 
  createLink, 
  updateLink, 
  deleteLink,
  getPublicPage,
  trackLinkClick
};