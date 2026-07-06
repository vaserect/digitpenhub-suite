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

// ── Product Variants ────────────────────────────────────────────────────────

r.get('/:productId/variants', async (req, res) => {
  const owns = await db.query(`SELECT 1 FROM marketplace_products WHERE id=$1 AND org_id=$2`, [req.params.productId, req.user.orgId]);
  if (!owns.rows.length) return res.status(404).json({ error: 'Not found.' });
  const { rows } = await db.query(
    `SELECT * FROM product_variants WHERE product_id=$1 AND org_id=$2 ORDER BY created_at ASC`,
    [req.params.productId, req.user.orgId]
  );
  res.json({ variants: rows });
});

r.post('/:productId/variants', async (req, res) => {
  const owns = await db.query(`SELECT 1 FROM marketplace_products WHERE id=$1 AND org_id=$2`, [req.params.productId, req.user.orgId]);
  if (!owns.rows.length) return res.status(404).json({ error: 'Not found.' });
  const { name, value, priceDelta, stock, sku } = req.body || {};
  if (!name?.trim() || !value?.trim()) return res.status(400).json({ error: 'name and value are required.' });
  const { rows } = await db.query(
    `INSERT INTO product_variants (product_id, org_id, name, value, price_delta, stock, sku)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.productId, req.user.orgId, name.trim(), value.trim(), Number(priceDelta)||0, Number(stock)||0, sku||null]
  );
  res.status(201).json({ variant: rows[0] });
});

r.put('/:productId/variants/:variantId', async (req, res) => {
  const { name, value, priceDelta, stock, sku } = req.body || {};
  const { rows } = await db.query(
    `UPDATE product_variants SET name=$1, value=$2, price_delta=$3, stock=$4, sku=$5
     WHERE id=$6 AND product_id=$7 AND org_id=$8 RETURNING *`,
    [name, value, Number(priceDelta)||0, Number(stock)||0, sku||null, req.params.variantId, req.params.productId, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ variant: rows[0] });
});

r.delete('/:productId/variants/:variantId', async (req, res) => {
  await db.query(`DELETE FROM product_variants WHERE id=$1 AND product_id=$2 AND org_id=$3`, [req.params.variantId, req.params.productId, req.user.orgId]);
  res.json({ ok: true });
});

module.exports = r;
