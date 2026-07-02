const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(views),0) AS total_views,
            COUNT(*) FILTER(WHERE status='active') AS active
     FROM digital_business_cards WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listCards(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM digital_business_cards WHERE org_id=$1 ORDER BY created_at DESC`,
    [req.user.orgId]);
  res.json({ cards: rows });
}

async function createCard(req, res) {
  const { name, title, company, email, phone, website, linkedin, twitter, instagram, address, bio, avatarUrl, theme, accentColor } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required.' });
  const { rows } = await db.query(
    `INSERT INTO digital_business_cards (org_id,name,title,company,email,phone,website,linkedin,twitter,instagram,address,bio,avatar_url,theme,accent_color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [req.user.orgId, name.trim(), title||null, company||null, email||null, phone||null, website||null, linkedin||null, twitter||null, instagram||null, address||null, bio||null, avatarUrl||null, theme||'classic', accentColor||'#2563eb']
  );
  res.status(201).json({ card: rows[0] });
}

async function updateCard(req, res) {
  const { id } = req.params;
  const { name, title, company, email, phone, website, linkedin, twitter, instagram, address, bio, avatarUrl, theme, accentColor, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE digital_business_cards SET name=COALESCE($3,name), title=$4, company=$5, email=$6, phone=$7, website=$8, linkedin=$9, twitter=$10, instagram=$11, address=$12, bio=$13, avatar_url=$14, theme=COALESCE($15,theme), accent_color=COALESCE($16,accent_color), status=COALESCE($17,status), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, name||null, title||null, company||null, email||null, phone||null, website||null, linkedin||null, twitter||null, instagram||null, address||null, bio||null, avatarUrl||null, theme||null, accentColor||null, status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ card: rows[0] });
}

async function deleteCard(req, res) {
  await db.query(`DELETE FROM digital_business_cards WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function incrementView(req, res) {
  await db.query(`UPDATE digital_business_cards SET views=views+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

module.exports = { getStats, listCards, createCard, updateCard, deleteCard, incrementView };
