const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='active')::int AS active,
       COALESCE(SUM(uses_count),0)::int AS total_uses
     FROM coupons WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listCoupons(req, res) {
  const { status } = req.query;
  const vals=[req.user.orgId]; const extra = status ? ' AND status=$2' : '';
  if (status) vals.push(status);
  const { rows } = await db.query(`SELECT * FROM coupons WHERE org_id=$1${extra} ORDER BY created_at DESC`, vals);
  res.json({ coupons: rows });
}

async function createCoupon(req, res) {
  const { code, description, type, value, minOrder, maxUses, status, expiresAt } = req.body || {};
  if (!code?.trim()) return res.status(400).json({ error: 'code required' });
  if (!value)        return res.status(400).json({ error: 'value required' });
  const exists = await db.query(`SELECT 1 FROM coupons WHERE org_id=$1 AND code=UPPER($2)`, [req.user.orgId, code.trim()]);
  if (exists.rows.length) return res.status(400).json({ error: 'Coupon code already exists.' });
  const { rows } = await db.query(
    `INSERT INTO coupons (org_id,code,description,type,value,min_order,max_uses,status,expires_at)
     VALUES ($1,UPPER($2),$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, code.trim(), description||null, type||'percent', Number(value), Number(minOrder)||0, maxUses||null, status||'active', expiresAt||null]
  );
  res.status(201).json({ coupon: rows[0] });
}

async function updateCoupon(req, res) {
  const { id } = req.params;
  const { description, type, value, minOrder, maxUses, status, expiresAt } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (description !==undefined){updates.push(`description=$${i++}`); vals.push(description||null);}
  if (type        !==undefined){updates.push(`type=$${i++}`);        vals.push(type);}
  if (value       !==undefined){updates.push(`value=$${i++}`);       vals.push(Number(value));}
  if (minOrder    !==undefined){updates.push(`min_order=$${i++}`);   vals.push(Number(minOrder)||0);}
  if (maxUses     !==undefined){updates.push(`max_uses=$${i++}`);    vals.push(maxUses||null);}
  if (status      !==undefined){updates.push(`status=$${i++}`);      vals.push(status);}
  if (expiresAt   !==undefined){updates.push(`expires_at=$${i++}`);  vals.push(expiresAt||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE coupons SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ coupon: rows[0] });
}

async function deleteCoupon(req, res) {
  await db.query(`DELETE FROM coupons WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function validateCoupon(req, res) {
  const { code, orderTotal } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code required' });
  const { rows } = await db.query(`SELECT * FROM coupons WHERE org_id=$1 AND code=UPPER($2)`, [req.user.orgId, code]);
  if (!rows.length) return res.status(404).json({ error: 'Invalid coupon code.' });
  const c = rows[0];
  if (c.status !== 'active')                        return res.status(400).json({ error: 'Coupon is not active.' });
  if (c.expires_at && new Date(c.expires_at)<new Date()) return res.status(400).json({ error: 'Coupon has expired.' });
  if (c.max_uses && c.uses_count >= c.max_uses)      return res.status(400).json({ error: 'Coupon usage limit reached.' });
  if (c.min_order && Number(orderTotal)<c.min_order) return res.status(400).json({ error: `Minimum order of ₦${c.min_order} required.` });
  const discount = c.type === 'percent' ? (Number(orderTotal)||0) * c.value / 100 : c.value;
  res.json({ valid: true, coupon: c, discountAmount: discount });
}

module.exports = { getStats, listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
