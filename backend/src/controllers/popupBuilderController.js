const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER(WHERE status='active') AS active,
            COALESCE(SUM(impressions),0) AS total_impressions,
            COALESCE(SUM(conversions),0) AS total_conversions
     FROM popups WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listPopups(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM popups WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ popups: rows });
}

async function createPopup(req, res) {
  const { name, trigger_type, trigger_delay, trigger_scroll, headline, body_text, cta_text, cta_url,
          image_url, bg_color, text_color, accent_color, position, size } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required.' });
  const { rows } = await db.query(
    `INSERT INTO popups (org_id,name,trigger_type,trigger_delay,trigger_scroll,headline,body_text,
       cta_text,cta_url,image_url,bg_color,text_color,accent_color,position,size)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [req.user.orgId, name.trim(), trigger_type||'delay', trigger_delay??5, trigger_scroll??50,
     headline||null, body_text||null, cta_text||null, cta_url||null, image_url||null,
     bg_color||'#ffffff', text_color||'#000000', accent_color||'#2563eb',
     position||'center', size||'medium']
  );
  res.status(201).json({ popup: rows[0] });
}

async function updatePopup(req, res) {
  const { id } = req.params;
  const f = req.body || {};
  const { rows } = await db.query(
    `UPDATE popups SET
       name=COALESCE($3,name), trigger_type=COALESCE($4,trigger_type),
       trigger_delay=COALESCE($5,trigger_delay), trigger_scroll=COALESCE($6,trigger_scroll),
       headline=$7, body_text=$8, cta_text=$9, cta_url=$10, image_url=$11,
       bg_color=COALESCE($12,bg_color), text_color=COALESCE($13,text_color),
       accent_color=COALESCE($14,accent_color), position=COALESCE($15,position),
       size=COALESCE($16,size), status=COALESCE($17,status), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId,
     f.name||null, f.trigger_type||null, f.trigger_delay??null, f.trigger_scroll??null,
     f.headline??null, f.body_text??null, f.cta_text??null, f.cta_url??null, f.image_url??null,
     f.bg_color||null, f.text_color||null, f.accent_color||null, f.position||null,
     f.size||null, f.status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ popup: rows[0] });
}

async function deletePopup(req, res) {
  await db.query(`DELETE FROM popups WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function trackImpression(req, res) {
  await db.query(`UPDATE popups SET impressions=impressions+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

async function trackConversion(req, res) {
  await db.query(`UPDATE popups SET conversions=conversions+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

module.exports = { getStats, listPopups, createPopup, updatePopup, deletePopup, trackImpression, trackConversion };
