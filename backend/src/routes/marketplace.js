const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

const r = Router();
r.use(requireAuth);

r.get('/', async (req, res) => {
  const { status, category, search } = req.query;
  let q = `SELECT * FROM marketplace_products WHERE org_id = $1`;
  const params = [req.user.orgId];
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (category) { params.push(category); q += ` AND category = $${params.length}`; }
  if (search) { params.push(`%${search}%`); q += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`; }
  q += ` ORDER BY created_at DESC`;
  const { rows } = await db.query(q, params);
  const stats = {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    draft: rows.filter(r => r.status === 'draft').length,
    totalRevenue: rows.reduce((s, r) => s + (parseFloat(r.price) * (r.sales || 0)), 0),
  };
  res.json({ products: rows, stats });
});

r.post('/', async (req, res) => {
  const { name, description, category, price, currency, tags, stock, status, images } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO marketplace_products (org_id, name, description, category, price, currency, tags, stock, status, images)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.orgId, name.trim(), description||'', category||'General', price||0, currency||'NGN', JSON.stringify(tags||[]), stock||0, status||'draft', JSON.stringify(images||[])]
  );
  res.status(201).json({ product: rows[0] });
});

r.put('/:id', async (req, res) => {
  const { name, description, category, price, currency, tags, stock, status, images } = req.body || {};
  const { rows } = await db.query(
    `UPDATE marketplace_products SET name=$1, description=$2, category=$3, price=$4, currency=$5, tags=$6, stock=$7, status=$8, images=$9, updated_at=NOW()
     WHERE id=$10 AND org_id=$11 RETURNING *`,
    [name, description, category, price, currency, JSON.stringify(tags||[]), stock, status, JSON.stringify(images||[]), req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ product: rows[0] });
});

r.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM marketplace_products WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

r.post('/:id/publish', async (req, res) => {
  const { rows } = await db.query(
    `UPDATE marketplace_products SET status='active', updated_at=NOW() WHERE id=$1 AND org_id=$2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ product: rows[0] });
});

// Increment view count (public-like action)
r.post('/:id/view', async (req, res) => {
  await db.query(`UPDATE marketplace_products SET views = views + 1 WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

module.exports = r;
