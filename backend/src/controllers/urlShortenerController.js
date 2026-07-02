const db = require('../db');

function genSlug(len=6) {
  const chars='abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='active')::int AS active,
       COALESCE(SUM(clicks),0)::int AS total_clicks
     FROM short_links WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listLinks(req, res) {
  const { rows } = await db.query(`SELECT * FROM short_links WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ links: rows });
}

async function createLink(req, res) {
  const { targetUrl, title, customSlug, expiresAt } = req.body || {};
  if (!targetUrl?.trim()) return res.status(400).json({ error: 'targetUrl required' });
  let slug = customSlug?.trim();
  if (slug) {
    const exists = await db.query(`SELECT 1 FROM short_links WHERE slug=$1`, [slug]);
    if (exists.rows.length) return res.status(400).json({ error: 'Custom slug already taken.' });
  } else {
    let attempts = 0;
    do { slug = genSlug(); attempts++; } while (attempts < 10 && (await db.query(`SELECT 1 FROM short_links WHERE slug=$1`, [slug])).rows.length);
  }
  const { rows } = await db.query(
    `INSERT INTO short_links (org_id,slug,target_url,title,expires_at) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, slug, targetUrl.trim(), title||null, expiresAt||null]
  );
  res.status(201).json({ link: rows[0] });
}

async function updateLink(req, res) {
  const { id } = req.params;
  const { title, status, expiresAt } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (title     !==undefined){updates.push(`title=$${i++}`);      vals.push(title||null);}
  if (status    !==undefined){updates.push(`status=$${i++}`);     vals.push(status);}
  if (expiresAt !==undefined){updates.push(`expires_at=$${i++}`); vals.push(expiresAt||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE short_links SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ link: rows[0] });
}

async function deleteLink(req, res) {
  await db.query(`DELETE FROM short_links WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listLinks, createLink, updateLink, deleteLink };
