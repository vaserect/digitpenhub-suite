const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteDeliveries = bulkDeleteHandler('deliveries');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='pending')::int AS pending,
       COUNT(*) FILTER(WHERE status='in_transit')::int AS in_transit,
       COUNT(*) FILTER(WHERE status='out_for_delivery')::int AS out_for_delivery,
       COUNT(*) FILTER(WHERE status='delivered')::int AS delivered,
       COUNT(*) FILTER(WHERE status='failed')::int AS failed
     FROM deliveries WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listDeliveries(req, res) {
  const { status, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (status) {conditions.push(`status=$${i++}`); vals.push(status);}
  if (search) {conditions.push(`(customer_name ILIKE $${i} OR delivery_number ILIKE $${i} OR tracking_code ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  const { rows } = await db.query(`SELECT * FROM deliveries WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ deliveries: rows });
}

async function createDelivery(req, res) {
  const { customerName, customerPhone, deliveryAddress, courierName, trackingCode, priority, estimatedDate, notes, items, orderRef } = req.body || {};
  if (!customerName?.trim())    return res.status(400).json({ error: 'customerName required' });
  if (!deliveryAddress?.trim()) return res.status(400).json({ error: 'deliveryAddress required' });
  const seqRes = await db.query(`SELECT nextval('delivery_number_seq') AS n`);
  const deliveryNumber = `DEL-${String(seqRes.rows[0].n).padStart(5,'0')}`;
  const { rows } = await db.query(
    `INSERT INTO deliveries (org_id,delivery_number,order_ref,customer_name,customer_phone,delivery_address,courier_name,tracking_code,priority,estimated_date,notes,items)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.user.orgId, deliveryNumber, orderRef||null, customerName.trim(), customerPhone||null, deliveryAddress.trim(), courierName||null, trackingCode||null, priority||'normal', estimatedDate||null, notes||null, JSON.stringify(items||[])]
  );
  res.status(201).json({ delivery: rows[0] });
}

async function updateDelivery(req, res) {
  const { id } = req.params;
  const { status, courierName, trackingCode, estimatedDate, notes, priority } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (status       !==undefined){updates.push(`status=$${i++}`);        vals.push(status); if (status==='delivered') updates.push(`delivered_at=NOW()`);}
  if (courierName  !==undefined){updates.push(`courier_name=$${i++}`);  vals.push(courierName||null);}
  if (trackingCode !==undefined){updates.push(`tracking_code=$${i++}`); vals.push(trackingCode||null);}
  if (estimatedDate!==undefined){updates.push(`estimated_date=$${i++}`);vals.push(estimatedDate||null);}
  if (notes        !==undefined){updates.push(`notes=$${i++}`);         vals.push(notes||null);}
  if (priority     !==undefined){updates.push(`priority=$${i++}`);      vals.push(priority);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE deliveries SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ delivery: rows[0] });
}

async function deleteDelivery(req, res) {
  await db.query(`DELETE FROM deliveries WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportDeliveries(req, res) {
  const { rows } = await db.query(`SELECT * FROM deliveries WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'deliveries.csv', rows, autoColumns(rows));
}

module.exports = { getStats, listDeliveries, exportDeliveries, createDelivery, updateDelivery, deleteDelivery, bulkDeleteDeliveries };
