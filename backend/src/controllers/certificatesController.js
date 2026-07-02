const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE status='issued') AS issued,
            COUNT(*) FILTER(WHERE status='expired') AS expired,
            COUNT(*) FILTER(WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE AND status='issued') AS expiring
     FROM issued_certificates WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listCertificates(req, res) {
  const search = (req.query.search || '').trim();
  const { rows } = await db.query(
    `SELECT * FROM issued_certificates WHERE org_id=$1
     ${search ? `AND (recipient_name ILIKE '%' || $2 || '%' OR title ILIKE '%' || $2 || '%')` : ''}
     ORDER BY created_at DESC`,
    search ? [req.user.orgId, search] : [req.user.orgId]
  );
  res.json({ certificates: rows });
}

async function createCertificate(req, res) {
  const { title, recipientName, recipientEmail, description, issuedBy, issueDate, expiryDate, template } = req.body || {};
  if (!title?.trim() || !recipientName?.trim()) return res.status(400).json({ error: 'title and recipientName required.' });
  const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await db.query(
    `INSERT INTO issued_certificates (org_id,title,recipient_name,recipient_email,description,issued_by,issue_date,expiry_date,certificate_id,template)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.orgId, title.trim(), recipientName.trim(), recipientEmail||null, description||null, issuedBy||null,
     issueDate||new Date().toISOString().slice(0,10), expiryDate||null, certId, template||'classic']
  );
  res.status(201).json({ certificate: rows[0] });
}

async function updateCertificate(req, res) {
  const { id } = req.params;
  const { title, recipientName, recipientEmail, description, issuedBy, issueDate, expiryDate, template, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE issued_certificates SET
       title=COALESCE($3,title), recipient_name=COALESCE($4,recipient_name),
       recipient_email=$5, description=$6, issued_by=$7,
       issue_date=COALESCE($8,issue_date), expiry_date=$9,
       template=COALESCE($10,template), status=COALESCE($11,status)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, recipientName||null, recipientEmail||null, description||null, issuedBy||null,
     issueDate||null, expiryDate||null, template||null, status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ certificate: rows[0] });
}

async function deleteCertificate(req, res) {
  await db.query(`DELETE FROM issued_certificates WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listCertificates, createCertificate, updateCertificate, deleteCertificate };
