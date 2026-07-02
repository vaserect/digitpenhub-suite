const db = require('../db');

async function getStats(req, res) {
  const [todayRes, sessionRes, salesRes] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(total),0) AS today FROM pos_sales WHERE org_id=$1 AND created_at>=CURRENT_DATE`, [req.user.orgId]),
    db.query(`SELECT * FROM pos_sessions WHERE org_id=$1 AND status='open' ORDER BY opened_at DESC LIMIT 1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c, COALESCE(SUM(total),0) AS total FROM pos_sales WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({
    todayRevenue:  Number(todayRes.rows[0].today),
    activeSession: sessionRes.rows[0] || null,
    totalSales:    salesRes.rows[0].c,
    totalRevenue:  Number(salesRes.rows[0].total),
  });
}

async function openSession(req, res) {
  const existing = await db.query(`SELECT id FROM pos_sessions WHERE org_id=$1 AND status='open'`, [req.user.orgId]);
  if (existing.rows.length) return res.status(400).json({ error: 'A session is already open.' });
  const { openingCash } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO pos_sessions (org_id,opening_cash) VALUES ($1,$2) RETURNING *`,
    [req.user.orgId, Number(openingCash)||0]
  );
  res.status(201).json({ session: rows[0] });
}

async function closeSession(req, res) {
  const { id } = req.params;
  const { closingCash } = req.body || {};
  const totRes = await db.query(`SELECT COALESCE(SUM(total),0) AS t FROM pos_sales WHERE session_id=$1`, [id]);
  const { rows } = await db.query(
    `UPDATE pos_sessions SET status='closed',closed_at=NOW(),closing_cash=$1,total_sales=$2 WHERE id=$3 AND org_id=$4 RETURNING *`,
    [Number(closingCash)||0, Number(totRes.rows[0].t), id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Session not found.' });
  res.json({ session: rows[0] });
}

async function listSessions(req, res) {
  const { rows } = await db.query(`SELECT * FROM pos_sessions WHERE org_id=$1 ORDER BY opened_at DESC LIMIT 50`, [req.user.orgId]);
  res.json({ sessions: rows });
}

async function createSale(req, res) {
  const { sessionId, items, subtotal, discount, taxRate, total, paymentMethod, reference, note } = req.body || {};
  if (!items?.length) return res.status(400).json({ error: 'items required' });
  const taxAmt = (Number(subtotal) - Number(discount||0)) * (Number(taxRate)||0) / 100;
  const { rows } = await db.query(
    `INSERT INTO pos_sales (org_id,session_id,items,subtotal,discount,tax_rate,tax_amount,total,payment_method,reference,note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.user.orgId, sessionId||null, JSON.stringify(items), Number(subtotal)||0, Number(discount)||0, Number(taxRate)||0, taxAmt, Number(total)||0, paymentMethod||'cash', reference||null, note||null]
  );
  if (sessionId) {
    await db.query(`UPDATE pos_sessions SET total_sales=total_sales+$1 WHERE id=$2`, [Number(total)||0, sessionId]);
  }
  for (const item of items) {
    if (item.productId) {
      await db.query(`UPDATE inventory_products SET stock_qty=GREATEST(0,stock_qty-$1) WHERE id=$2 AND org_id=$3`, [item.qty||1, item.productId, req.user.orgId]);
      await db.query(`INSERT INTO inventory_transactions (org_id,product_id,type,qty,note) VALUES ($1,$2,'sale',$3,'POS sale')`, [req.user.orgId, item.productId, item.qty||1]);
    }
  }
  res.status(201).json({ sale: rows[0] });
}

async function listSales(req, res) {
  const { sessionId, date } = req.query;
  const conditions = ['org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (sessionId) { conditions.push(`session_id=$${i++}`);       vals.push(sessionId); }
  if (date)      { conditions.push(`created_at::date=$${i++}`); vals.push(date); }
  const { rows } = await db.query(`SELECT * FROM pos_sales WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`, vals);
  res.json({ sales: rows });
}

module.exports = { getStats, openSession, closeSession, listSessions, createSale, listSales };
