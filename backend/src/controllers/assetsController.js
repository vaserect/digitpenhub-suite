const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteAssets = bulkDeleteHandler('asset_items');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='available')::int AS available,
       COUNT(*) FILTER(WHERE status='assigned')::int AS assigned,
       COUNT(*) FILTER(WHERE status='maintenance')::int AS maintenance,
       COALESCE(SUM(purchase_cost),0) AS total_cost
     FROM asset_items WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ...rows[0], totalCost: Number(rows[0].total_cost) });
}

async function listAssets(req, res) {
  const { status, category, search } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (status)   {conditions.push(`status=$${i++}`);          vals.push(status);}
  if (category) {conditions.push(`category=$${i++}`);        vals.push(category);}
  if (search)   {conditions.push(`name ILIKE $${i++}`);      vals.push(`%${search}%`);}
  const { rows } = await db.query(`SELECT * FROM asset_items WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ assets: rows });
}

async function exportAssets(req, res) {
  const { rows } = await db.query(`SELECT * FROM asset_items WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'assets.csv', rows, autoColumns(rows));
}

async function createAsset(req, res) {
  const { name, assetTag, category, description, serialNumber, purchaseDate, purchaseCost, currentValue, status, assignedTo, location } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO asset_items (org_id,name,asset_tag,category,description,serial_number,purchase_date,purchase_cost,current_value,status,assigned_to,location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.user.orgId, name.trim(), assetTag||null, category||null, description||null, serialNumber||null, purchaseDate||null, purchaseCost||null, currentValue||null, status||'available', assignedTo||null, location||null]
  );
  res.status(201).json({ asset: rows[0] });
}

async function updateAsset(req, res) {
  const { id } = req.params;
  const fields = ['name','assetTag','category','description','serialNumber','purchaseDate','purchaseCost','currentValue','status','assignedTo','location'];
  const cols   = ['name','asset_tag','category','description','serial_number','purchase_date','purchase_cost','current_value','status','assigned_to','location'];
  const updates=[]; const vals=[]; let i=1;
  const body = req.body || {};
  fields.forEach((f,idx)=>{
    if (body[f]!==undefined){
      const v = f==='name' ? body[f].trim() : (['purchaseCost','currentValue'].includes(f) ? (body[f]||null) : (body[f]||null));
      updates.push(`${cols[idx]}=$${i++}`); vals.push(v);
    }
  });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE asset_items SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ asset: rows[0] });
}

async function deleteAsset(req, res) {
  await db.query(`DELETE FROM asset_items WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listAssets, exportAssets, createAsset, updateAsset, deleteAsset, bulkDeleteAssets };
