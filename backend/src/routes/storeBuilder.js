const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

r.get('/settings', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM store_settings WHERE org_id=$1`, [req.user.orgId]);
  if (!rows.length) {
    const { rows: created } = await db.query(
      `INSERT INTO store_settings (org_id) VALUES ($1) RETURNING *`, [req.user.orgId]);
    return res.json({ settings: created[0] });
  }
  res.json({ settings: rows[0] });
});

r.put('/settings', async (req, res) => {
  const { storeName, tagline, logoUrl, bannerUrl, theme, primaryColor, currency, contactEmail, contactPhone, address, social } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO store_settings (org_id,store_name,tagline,logo_url,banner_url,theme,primary_color,currency,contact_email,contact_phone,address,social,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (org_id) DO UPDATE SET
       store_name=$2,tagline=$3,logo_url=$4,banner_url=$5,theme=$6,primary_color=$7,currency=$8,
       contact_email=$9,contact_phone=$10,address=$11,social=$12,updated_at=NOW() RETURNING *`,
    [req.user.orgId, storeName||'My Store', tagline||'', logoUrl||'', bannerUrl||'', theme||'modern',
     primaryColor||'#2563eb', currency||'NGN', contactEmail||'', contactPhone||'', address||'', JSON.stringify(social||{})]);
  res.json({ settings: rows[0] });
});

r.post('/publish', async (req, res) => {
  const { rows } = await db.query(
    `UPDATE store_settings SET is_published=TRUE,updated_at=NOW() WHERE org_id=$1 RETURNING *`, [req.user.orgId]);
  res.json({ settings: rows[0] });
});

r.post('/unpublish', async (req, res) => {
  const { rows } = await db.query(
    `UPDATE store_settings SET is_published=FALSE,updated_at=NOW() WHERE org_id=$1 RETURNING *`, [req.user.orgId]);
  res.json({ settings: rows[0] });
});

r.get('/products', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM marketplace_products WHERE org_id=$1 AND status='active' ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ products: rows });
});

module.exports = r;
