const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteAffiliates = bulkDeleteHandler('affiliates');

async function getStats(req, res) {
  const [affRes, convRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='active')::int AS active FROM affiliates WHERE org_id=$1`, [req.user.orgId]),
    db.query(
      `SELECT COALESCE(SUM(amount_ngn),0) AS total_sales,
              COALESCE(SUM(commission_ngn),0) AS total_commission,
              COALESCE(SUM(commission_ngn) FILTER(WHERE status='pending'),0) AS pending_payout
       FROM affiliate_conversions WHERE org_id=$1`,
      [req.user.orgId]
    ),
  ]);
  res.json({
    totalAffiliates: affRes.rows[0].total,
    activeAffiliates: affRes.rows[0].active,
    totalSales:       Number(convRes.rows[0].total_sales),
    totalCommission:  Number(convRes.rows[0].total_commission),
    pendingPayout:    Number(convRes.rows[0].pending_payout),
  });
}

// ── Affiliates ────────────────────────────────────────────────────────────────

async function listAffiliates(req, res) {
  const { rows } = await db.query(
    `SELECT a.*,
            COUNT(ac.id)::int                                          AS conversion_count,
            COALESCE(SUM(ac.amount_ngn),0)                            AS total_sales,
            COALESCE(SUM(ac.commission_ngn),0)                        AS total_earned,
            COALESCE(SUM(ac.commission_ngn) FILTER(WHERE ac.status='pending'),0) AS pending
     FROM affiliates a
     LEFT JOIN affiliate_conversions ac ON ac.affiliate_id=a.id
     WHERE a.org_id=$1
     GROUP BY a.id ORDER BY a.name`,
    [req.user.orgId]
  );
  res.json({ affiliates: rows.map((r)=>({...r,total_sales:Number(r.total_sales),total_earned:Number(r.total_earned),pending:Number(r.pending)})) });
}

async function createAffiliate(req, res) {
  const { name, email, phone, promoCode, commissionType, commissionValue, notes, status } = req.body || {};
  if (!name?.trim())     return res.status(400).json({ error: 'name is required.' });
  if (!promoCode?.trim()) return res.status(400).json({ error: 'promoCode is required.' });
  const { rows } = await db.query(
    `INSERT INTO affiliates (org_id, name, email, phone, promo_code, commission_type, commission_value, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, name.trim(), email||null, phone||null, promoCode.trim().toUpperCase(), commissionType||'percentage', Number(commissionValue)||10, notes||null, status||'active']
  );
  res.status(201).json({ affiliate: rows[0] });
}

async function updateAffiliate(req, res) {
  const { id } = req.params;
  const { name, email, phone, promoCode, commissionType, commissionValue, notes, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name           !==undefined){updates.push(`name=$${i++}`);            vals.push(name.trim());}
  if (email          !==undefined){updates.push(`email=$${i++}`);           vals.push(email||null);}
  if (phone          !==undefined){updates.push(`phone=$${i++}`);           vals.push(phone||null);}
  if (promoCode      !==undefined){updates.push(`promo_code=$${i++}`);      vals.push(promoCode.trim().toUpperCase());}
  if (commissionType !==undefined){updates.push(`commission_type=$${i++}`); vals.push(commissionType);}
  if (commissionValue!==undefined){updates.push(`commission_value=$${i++}`);vals.push(Number(commissionValue));}
  if (notes          !==undefined){updates.push(`notes=$${i++}`);           vals.push(notes||null);}
  if (status         !==undefined){updates.push(`status=$${i++}`);          vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE affiliates SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Affiliate not found.' });
  res.json({ affiliate: rows[0] });
}

async function deleteAffiliate(req, res) {
  await db.query(`DELETE FROM affiliates WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Conversions ───────────────────────────────────────────────────────────────

async function listConversions(req, res) {
  const { affiliateId, status } = req.query;
  const { rows } = await db.query(
    `SELECT ac.*, a.name AS affiliate_name, a.promo_code
     FROM affiliate_conversions ac JOIN affiliates a ON a.id=ac.affiliate_id
     WHERE ac.org_id=$1 AND ($2='' OR ac.affiliate_id::text=$2) AND ($3='' OR ac.status=$3)
     ORDER BY ac.conversion_date DESC, ac.created_at DESC`,
    [req.user.orgId, affiliateId||'', status||'']
  );
  res.json({ conversions: rows.map((r)=>({...r,amount_ngn:Number(r.amount_ngn),commission_ngn:Number(r.commission_ngn)})) });
}

async function createConversion(req, res) {
  const { affiliateId, orderRef, amountNgn, commissionNgn, status, notes, conversionDate } = req.body || {};
  if (!affiliateId) return res.status(400).json({ error: 'affiliateId is required.' });
  if (!amountNgn)   return res.status(400).json({ error: 'amountNgn is required.' });
  const aff = await db.query(`SELECT commission_type, commission_value FROM affiliates WHERE id=$1 AND org_id=$2`, [affiliateId, req.user.orgId]);
  if (!aff.rows.length) return res.status(404).json({ error: 'Affiliate not found.' });
  const a = aff.rows[0];
  const amount = Math.round(Number(amountNgn) * 100);
  let commission = commissionNgn != null
    ? Math.round(Number(commissionNgn) * 100)
    : a.commission_type === 'percentage'
      ? Math.round(amount * Number(a.commission_value) / 100)
      : Math.round(Number(a.commission_value) * 100);
  const { rows } = await db.query(
    `INSERT INTO affiliate_conversions (org_id, affiliate_id, order_ref, amount_ngn, commission_ngn, status, notes, conversion_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, affiliateId, orderRef?.trim()||null, amount, commission, status||'pending', notes||null, conversionDate||new Date().toISOString().slice(0,10)]
  );
  res.status(201).json({ conversion: { ...rows[0], amount_ngn: Number(rows[0].amount_ngn), commission_ngn: Number(rows[0].commission_ngn) } });
}

async function updateConversion(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (status!==undefined){updates.push(`status=$${i++}`);vals.push(status);}
  if (notes !==undefined){updates.push(`notes=$${i++}`); vals.push(notes||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE affiliate_conversions SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Conversion not found.' });
  res.json({ conversion: rows[0] });
}

async function deleteConversion(req, res) {
  await db.query(`DELETE FROM affiliate_conversions WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportAffiliates(req, res) {
  const { rows } = await db.query(
    `SELECT a.*,
            COUNT(ac.id)::int                                          AS conversion_count,
            COALESCE(SUM(ac.amount_ngn),0)                            AS total_sales,
            COALESCE(SUM(ac.commission_ngn),0)                        AS total_earned,
            COALESCE(SUM(ac.commission_ngn) FILTER(WHERE ac.status='pending'),0) AS pending
     FROM affiliates a
     LEFT JOIN affiliate_conversions ac ON ac.affiliate_id=a.id
     WHERE a.org_id=$1
     GROUP BY a.id ORDER BY a.name`,
    [req.user.orgId]
  );
  sendCsv(res, 'affiliates.csv', rows, autoColumns(rows));
}

module.exports = {
  getStats,
  listAffiliates, exportAffiliates, createAffiliate, updateAffiliate, deleteAffiliate, bulkDeleteAffiliates,
  listConversions, createConversion, updateConversion, deleteConversion,
};
