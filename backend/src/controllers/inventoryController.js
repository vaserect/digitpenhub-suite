const db = require('../db');

async function getStats(req, res) {
  const [prodRes, lowRes, outRes, valRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active' AND stock_qty<=low_stock_threshold AND stock_qty>0`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM inventory_products WHERE org_id=$1 AND status='active' AND stock_qty=0`, [req.user.orgId]),
    db.query(`SELECT COALESCE(SUM(stock_qty*price),0) AS v FROM inventory_products WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
  ]);
  res.json({ totalProducts: prodRes.rows[0].c, lowStock: lowRes.rows[0].c, outOfStock: outRes.rows[0].c, totalValue: Number(valRes.rows[0].v) });
}

async function listCategories(req, res) {
  const { rows } = await db.query(`SELECT * FROM inventory_categories WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ categories: rows });
}

async function createCategory(req, res) {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(`INSERT INTO inventory_categories (org_id,name) VALUES ($1,$2) RETURNING *`, [req.user.orgId, name.trim()]);
  res.status(201).json({ category: rows[0] });
}

async function deleteCategory(req, res) {
  await db.query(`DELETE FROM inventory_categories WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listProducts(req, res) {
  const { category, status, search } = req.query;
  const conditions = ['p.org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (category) { conditions.push(`p.category_id=$${i++}`); vals.push(category); }
  if (status)   { conditions.push(`p.status=$${i++}`);      vals.push(status); }
  if (search)   { conditions.push(`p.name ILIKE $${i++}`);  vals.push(`%${search}%`); }
  const { rows } = await db.query(
    `SELECT p.*, c.name AS category_name FROM inventory_products p
     LEFT JOIN inventory_categories c ON c.id=p.category_id
     WHERE ${conditions.join(' AND ')} ORDER BY p.name`,
    vals
  );
  res.json({ products: rows });
}

async function createProduct(req, res) {
  const { name, sku, description, categoryId, price, cost, stockQty, lowStockThreshold, unit, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO inventory_products (org_id,category_id,name,sku,description,price,cost,stock_qty,low_stock_threshold,unit,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.orgId, categoryId||null, name.trim(), sku||null, description||null, Number(price)||0, Number(cost)||0, Number(stockQty)||0, Number(lowStockThreshold)||5, unit||'pcs', status||'active']
  );
  res.status(201).json({ product: rows[0] });
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, sku, description, categoryId, price, cost, stockQty, lowStockThreshold, unit, status } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name              !== undefined) { updates.push(`name=$${i++}`);                vals.push(name.trim()); }
  if (sku               !== undefined) { updates.push(`sku=$${i++}`);                 vals.push(sku||null); }
  if (description       !== undefined) { updates.push(`description=$${i++}`);         vals.push(description||null); }
  if (categoryId        !== undefined) { updates.push(`category_id=$${i++}`);         vals.push(categoryId||null); }
  if (price             !== undefined) { updates.push(`price=$${i++}`);               vals.push(Number(price)); }
  if (cost              !== undefined) { updates.push(`cost=$${i++}`);                vals.push(Number(cost)); }
  if (stockQty          !== undefined) { updates.push(`stock_qty=$${i++}`);           vals.push(Number(stockQty)); }
  if (lowStockThreshold !== undefined) { updates.push(`low_stock_threshold=$${i++}`); vals.push(Number(lowStockThreshold)); }
  if (unit              !== undefined) { updates.push(`unit=$${i++}`);                vals.push(unit||'pcs'); }
  if (status            !== undefined) { updates.push(`status=$${i++}`);              vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE inventory_products SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: rows[0] });
}

async function deleteProduct(req, res) {
  await db.query(`DELETE FROM inventory_products WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listTransactions(req, res) {
  const { productId } = req.query;
  const vals = [req.user.orgId];
  const extra = productId ? ' AND t.product_id=$2' : '';
  if (productId) vals.push(productId);
  const { rows } = await db.query(
    `SELECT t.*, p.name AS product_name FROM inventory_transactions t
     JOIN inventory_products p ON p.id=t.product_id
     WHERE t.org_id=$1${extra} ORDER BY t.created_at DESC LIMIT 200`,
    vals
  );
  res.json({ transactions: rows });
}

async function addTransaction(req, res) {
  const { productId, type, qty, note, reference } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  if (!type)      return res.status(400).json({ error: 'type required' });
  const q = Number(qty);
  if (!q)         return res.status(400).json({ error: 'qty required' });
  await db.query('BEGIN');
  try {
    const delta = type === 'sale' ? -Math.abs(q) : type === 'purchase' || type === 'return' ? Math.abs(q) : q;
    await db.query(`UPDATE inventory_products SET stock_qty=stock_qty+$1 WHERE id=$2 AND org_id=$3`, [delta, productId, req.user.orgId]);
    const { rows } = await db.query(
      `INSERT INTO inventory_transactions (org_id,product_id,type,qty,note,reference) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.orgId, productId, type, q, note||null, reference||null]
    );
    await db.query('COMMIT');
    res.status(201).json({ transaction: rows[0] });
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

module.exports = { getStats, listCategories, createCategory, deleteCategory, listProducts, createProduct, updateProduct, deleteProduct, listTransactions, addTransaction };
