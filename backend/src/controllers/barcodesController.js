const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(scans),0) AS total_scans FROM barcodes WHERE org_id=$1`,
    [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listBarcodes(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM barcodes WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ barcodes: rows });
}

async function createBarcode(req, res) {
  const { name, content, barcodeType } = req.body || {};
  if (!name?.trim() || !content?.trim()) return res.status(400).json({ error: 'name and content required.' });
  const { rows } = await db.query(
    `INSERT INTO barcodes (org_id,name,content,barcode_type) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), content.trim(), barcodeType||'code128']
  );
  res.status(201).json({ barcode: rows[0] });
}

async function updateBarcode(req, res) {
  const { id } = req.params;
  const { name, content, barcodeType } = req.body || {};
  const { rows } = await db.query(
    `UPDATE barcodes SET name=COALESCE($3,name), content=COALESCE($4,content), barcode_type=COALESCE($5,barcode_type)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, name||null, content||null, barcodeType||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ barcode: rows[0] });
}

async function deleteBarcode(req, res) {
  await db.query(`DELETE FROM barcodes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function trackScan(req, res) {
  await db.query(`UPDATE barcodes SET scans=scans+1 WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// Public — no auth, no org_id scoping. This is the real-world destination a
// printed/shared barcode points at: looked up by id alone since whoever scans
// it isn't signed in and doesn't know (or need to know) which org it belongs
// to. Increments the same scan counter getStats/listBarcodes read, then either
// forwards the scanner to the encoded URL or hands back the raw encoded
// content as JSON for non-URL payloads (e.g. a product SKU/EAN code).
async function resolveBarcode(req, res) {
  const { rows } = await db.query(
    `UPDATE barcodes SET scans=scans+1 WHERE id=$1 RETURNING *`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not_found' });
  const bc = rows[0];
  const isUrl = /^https?:\/\//i.test(bc.content || '');
  if (isUrl) return res.redirect(302, bc.content);
  res.json({
    id: bc.id,
    name: bc.name,
    content: bc.content,
    barcodeType: bc.barcode_type,
    scans: bc.scans,
  });
}

module.exports = { getStats, listBarcodes, createBarcode, updateBarcode, deleteBarcode, trackScan, resolveBarcode };
