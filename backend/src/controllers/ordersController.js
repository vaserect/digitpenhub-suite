const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteOrders = bulkDeleteHandler('orders');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='pending')::int AS pending,
       COUNT(*) FILTER(WHERE status='processing')::int AS processing,
       COUNT(*) FILTER(WHERE status='delivered')::int AS delivered,
       COUNT(*) FILTER(WHERE status='cancelled')::int AS cancelled,
       COALESCE(SUM(total),0) AS total_revenue,
       COALESCE(SUM(total) FILTER(WHERE created_at>=CURRENT_DATE),0) AS today_revenue
     FROM orders WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ...rows[0], totalRevenue: Number(rows[0].total_revenue), todayRevenue: Number(rows[0].today_revenue) });
}

async function listOrders(req, res) {
  const { status, paymentStatus, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (status)        {conditions.push(`status=$${i++}`);                         vals.push(status);}
  if (paymentStatus) {conditions.push(`payment_status=$${i++}`);                 vals.push(paymentStatus);}
  if (search)        {conditions.push(`(customer_name ILIKE $${i} OR order_number ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  const { rows } = await db.query(`SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ orders: rows });
}

async function exportOrders(req, res) {
  const { rows } = await db.query(`SELECT * FROM orders WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'orders.csv', rows, autoColumns(rows));
}

async function getOrder(req, res) {
  const { rows } = await db.query(`SELECT * FROM orders WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ order: rows[0] });
}

async function createOrder(req, res) {
  const { customerName, customerEmail, customerPhone, customerAddress, items, subtotal, discount, taxAmount, shipping, total, paymentMethod, notes } = req.body || {};
  if (!customerName?.trim()) return res.status(400).json({ error: 'customerName required' });
  const seqRes = await db.query(`SELECT nextval('order_number_seq') AS n`);
  const orderNumber = `ORD-${String(seqRes.rows[0].n).padStart(5,'0')}`;
  const { rows } = await db.query(
    `INSERT INTO orders (org_id,order_number,customer_name,customer_email,customer_phone,customer_address,items,subtotal,discount,tax_amount,shipping,total,payment_method,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [req.user.orgId, orderNumber, customerName.trim(), customerEmail||null, customerPhone||null, customerAddress||null, JSON.stringify(items||[]), Number(subtotal)||0, Number(discount)||0, Number(taxAmount)||0, Number(shipping)||0, Number(total)||0, paymentMethod||null, notes||null]
  );
  res.status(201).json({ order: rows[0] });
}

async function updateOrder(req, res) {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod, notes, customerName, customerEmail, customerPhone, customerAddress, shipping } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (status         !==undefined){updates.push(`status=$${i++}`);          vals.push(status);}
  if (paymentStatus  !==undefined){updates.push(`payment_status=$${i++}`);  vals.push(paymentStatus);}
  if (paymentMethod  !==undefined){updates.push(`payment_method=$${i++}`);  vals.push(paymentMethod||null);}
  if (notes          !==undefined){updates.push(`notes=$${i++}`);           vals.push(notes||null);}
  if (customerName   !==undefined){updates.push(`customer_name=$${i++}`);   vals.push(customerName.trim());}
  if (customerEmail  !==undefined){updates.push(`customer_email=$${i++}`);  vals.push(customerEmail||null);}
  if (customerPhone  !==undefined){updates.push(`customer_phone=$${i++}`);  vals.push(customerPhone||null);}
  if (customerAddress!==undefined){updates.push(`customer_address=$${i++}`);vals.push(customerAddress||null);}
  if (shipping       !==undefined){updates.push(`shipping=$${i++}`);        vals.push(Number(shipping)||0);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE orders SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ order: rows[0] });
}

async function deleteOrder(req, res) {
  await db.query(`DELETE FROM orders WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listOrders, exportOrders, getOrder, createOrder, updateOrder, deleteOrder, bulkDeleteOrders };
