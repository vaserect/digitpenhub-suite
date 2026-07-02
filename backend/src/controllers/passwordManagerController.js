const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(DISTINCT category)::int AS categories,
       COUNT(*) FILTER(WHERE strength='weak')::int AS weak,
       COUNT(*) FILTER(WHERE strength='fair')::int AS fair,
       COUNT(*) FILTER(WHERE strength='good')::int AS good,
       COUNT(*) FILTER(WHERE strength='strong')::int AS strong
     FROM password_entries WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listEntries(req, res) {
  const { category, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (category) {conditions.push(`category=$${i++}`); vals.push(category);}
  if (search)   {conditions.push(`(title ILIKE $${i} OR username ILIKE $${i} OR url ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  const { rows } = await db.query(
    `SELECT id,org_id,title,category,username,url,tags,strength,last_used,created_at,updated_at FROM password_entries WHERE ${conditions.join(' AND ')} ORDER BY title`,
    vals
  );
  res.json({ entries: rows });
}

async function getEntry(req, res) {
  const { rows } = await db.query(`SELECT * FROM password_entries WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  await db.query(`UPDATE password_entries SET last_used=NOW() WHERE id=$1`, [req.params.id]);
  res.json({ entry: rows[0] });
}

async function createEntry(req, res) {
  const { title, category, username, password, url, notes, tags } = req.body || {};
  if (!title?.trim())    return res.status(400).json({ error: 'title required' });
  if (!password?.trim()) return res.status(400).json({ error: 'password required' });
  const { rows } = await db.query(
    `INSERT INTO password_entries (org_id,title,category,username,password,url,notes,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, title.trim(), category||'General', username||null, password, url||null, notes||null, tags||[]]
  );
  res.status(201).json({ entry: rows[0] });
}

async function updateEntry(req, res) {
  const { id } = req.params;
  const { title, category, username, password, url, notes, tags } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (title    !==undefined){updates.push(`title=$${i++}`);    vals.push(title.trim());}
  if (category !==undefined){updates.push(`category=$${i++}`); vals.push(category||'General');}
  if (username !==undefined){updates.push(`username=$${i++}`); vals.push(username||null);}
  if (password !==undefined){updates.push(`password=$${i++}`); vals.push(password);}
  if (url      !==undefined){updates.push(`url=$${i++}`);      vals.push(url||null);}
  if (notes    !==undefined){updates.push(`notes=$${i++}`);    vals.push(notes||null);}
  if (tags     !==undefined){updates.push(`tags=$${i++}`);     vals.push(tags||[]);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE password_entries SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ entry: rows[0] });
}

async function deleteEntry(req, res) {
  await db.query(`DELETE FROM password_entries WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listEntries, getEntry, createEntry, updateEntry, deleteEntry };
