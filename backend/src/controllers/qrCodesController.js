const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total, COALESCE(SUM(scans),0)::int AS total_scans FROM qr_codes WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listQrCodes(req, res) {
  const { type, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (type)   {conditions.push(`type=$${i++}`); vals.push(type);}
  if (search) {conditions.push(`title ILIKE $${i++}`); vals.push(`%${search}%`);}
  const { rows } = await db.query(`SELECT * FROM qr_codes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ qrCodes: rows });
}

async function createQrCode(req, res) {
  const { title, content, type, color, bgColor, size, tags } = req.body || {};
  if (!title?.trim())   return res.status(400).json({ error: 'title required' });
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  const { rows } = await db.query(
    `INSERT INTO qr_codes (org_id,title,content,type,color,bg_color,size,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, title.trim(), content.trim(), type||'url', color||'#000000', bgColor||'#ffffff', Number(size)||200, tags||[]]
  );
  res.status(201).json({ qrCode: rows[0] });
}

async function updateQrCode(req, res) {
  const { id } = req.params;
  const { title, content, type, color, bgColor, size, tags } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (title   !==undefined){updates.push(`title=$${i++}`);    vals.push(title.trim());}
  if (content !==undefined){updates.push(`content=$${i++}`);  vals.push(content.trim());}
  if (type    !==undefined){updates.push(`type=$${i++}`);     vals.push(type);}
  if (color   !==undefined){updates.push(`color=$${i++}`);    vals.push(color||'#000000');}
  if (bgColor !==undefined){updates.push(`bg_color=$${i++}`); vals.push(bgColor||'#ffffff');}
  if (size    !==undefined){updates.push(`size=$${i++}`);     vals.push(Number(size)||200);}
  if (tags    !==undefined){updates.push(`tags=$${i++}`);     vals.push(tags||[]);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE qr_codes SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ qrCode: rows[0] });
}

async function deleteQrCode(req, res) {
  await db.query(`DELETE FROM qr_codes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function trackScan(req, res) {
  await db.query(`UPDATE qr_codes SET scans=scans+1 WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listQrCodes, createQrCode, updateQrCode, deleteQrCode, trackScan };
