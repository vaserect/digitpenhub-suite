const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='active')::int AS active,
       COALESCE(SUM(sales_count),0)::int AS total_sales,
       COALESCE(SUM(revenue),0) AS total_revenue
     FROM digital_products WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ...rows[0], totalRevenue: Number(rows[0].total_revenue) });
}

async function listProducts(req, res) {
  const { status, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (status) {conditions.push(`status=$${i++}`); vals.push(status);}
  if (search) {conditions.push(`name ILIKE $${i++}`); vals.push(`%${search}%`);}
  const { rows } = await db.query(`SELECT * FROM digital_products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ products: rows });
}

async function createProduct(req, res) {
  const { name, description, category, price, fileUrl, fileName, fileSize, coverUrl, status, tags } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO digital_products (org_id,name,description,category,price,file_url,file_name,file_size,cover_url,status,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, category||null, Number(price)||0, fileUrl||null, fileName||null, fileSize||null, coverUrl||null, status||'active', tags||[]]
  );
  res.status(201).json({ product: rows[0] });
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, category, price, fileUrl, fileName, coverUrl, status, tags } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name        !==undefined){updates.push(`name=$${i++}`);        vals.push(name.trim());}
  if (description !==undefined){updates.push(`description=$${i++}`); vals.push(description||null);}
  if (category    !==undefined){updates.push(`category=$${i++}`);    vals.push(category||null);}
  if (price       !==undefined){updates.push(`price=$${i++}`);       vals.push(Number(price)||0);}
  if (fileUrl     !==undefined){updates.push(`file_url=$${i++}`);    vals.push(fileUrl||null);}
  if (fileName    !==undefined){updates.push(`file_name=$${i++}`);   vals.push(fileName||null);}
  if (coverUrl    !==undefined){updates.push(`cover_url=$${i++}`);   vals.push(coverUrl||null);}
  if (status      !==undefined){updates.push(`status=$${i++}`);      vals.push(status);}
  if (tags        !==undefined){updates.push(`tags=$${i++}`);        vals.push(tags||[]);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE digital_products SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ product: rows[0] });
}

async function deleteProduct(req, res) {
  await db.query(`DELETE FROM digital_products WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listSales(req, res) {
  const { productId } = req.params;
  const { rows } = await db.query(`SELECT * FROM digital_product_sales WHERE org_id=$1 AND product_id=$2 ORDER BY created_at DESC`, [req.user.orgId, productId]);
  res.json({ sales: rows });
}

async function recordSale(req, res) {
  const { productId } = req.params;
  const { buyerName, buyerEmail, amount, paymentRef } = req.body || {};
  if (!buyerName?.trim())  return res.status(400).json({ error: 'buyerName required' });
  if (!buyerEmail?.trim()) return res.status(400).json({ error: 'buyerEmail required' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const saleRes = await client.query(
      `INSERT INTO digital_product_sales (org_id,product_id,buyer_name,buyer_email,amount,payment_ref) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.orgId, productId, buyerName.trim(), buyerEmail.trim(), Number(amount)||0, paymentRef||null]
    );
    await client.query(`UPDATE digital_products SET sales_count=sales_count+1, revenue=revenue+$1, updated_at=NOW() WHERE id=$2`, [Number(amount)||0, productId]);
    await client.query('COMMIT');
    res.status(201).json({ sale: saleRes.rows[0] });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

module.exports = { getStats, listProducts, createProduct, updateProduct, deleteProduct, listSales, recordSale };
