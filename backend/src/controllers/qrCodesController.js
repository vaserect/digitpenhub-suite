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
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE qr_codes SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
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

// Public — no auth, no org_id filter. This is the real delivery surface a
// scanned QR code lands on: looked up by id alone since an anonymous
// visitor's phone camera has no session. Powers frontend/app/qr/[id]/page.jsx
// and, for "url"-type codes, is also embedded directly as the encoded data of
// the printed/downloaded QR image itself (see qrImageContent in
// AppShell.jsx), so a plain camera scan gets counted with no app in the
// middle. "url" codes get a real 302 here so that direct-embed case works
// with no frontend page involved. Every other type (text/email/phone/sms/
// wifi/vcard) stays literal in the printed QR image — wrapping those in a
// redirect would break native camera-app behavior (auto-connect to wifi,
// auto-dial, etc.) — so those are only trackable via the frontend page link.
async function resolveQrCode(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `UPDATE qr_codes SET scans = scans + 1 WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'QR code not found.' });
  const qr = rows[0];

  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.json({
      id: qr.id,
      title: qr.title,
      content: qr.content,
      type: qr.type,
      scans: qr.scans,
      redirectUrl: qr.type === 'url' ? qr.content : undefined
    });
  }

  if (qr.type === 'url') return res.redirect(302, qr.content);
  return res.redirect(302, `/qr/${qr.id}`);
}

module.exports = { getStats, listQrCodes, createQrCode, updateQrCode, deleteQrCode, trackScan, resolveQrCode };
