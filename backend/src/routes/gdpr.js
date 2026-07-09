const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── GDPR Requests ─────────────────────────────────────────────────────────────
router.get('/requests', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(
    `SELECT * FROM gdpr_requests WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
  res.json({ requests: rows });
}));

router.post('/requests', asyncHandler(async (req, res) => {
  const { requesterEmail, requestType, details } = req.body || {};
  if (!requesterEmail || !requestType) return res.status(400).json({ error: 'requesterEmail and requestType are required.' });
  if (!['access','rectification','erasure','portability','restrict'].includes(requestType)) {
    return res.status(400).json({ error: 'Invalid requestType.' });
  }
  const { rows } = await db.query(
    `INSERT INTO gdpr_requests (org_id, requester_email, request_type, details, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, requesterEmail, requestType, details || null, req.user.id]
  );
  res.status(201).json({ request: rows[0] });
}));

router.patch('/requests/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['pending','processing','completed','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const { rows } = await db.query(
    `UPDATE gdpr_requests SET status = $1, completed_at = CASE WHEN $1 IN ('completed','rejected') THEN now() ELSE NULL END WHERE id = $2 AND org_id = $3 RETURNING *`,
    [status, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ request: rows[0] });
}));

// ── Consent Records ───────────────────────────────────────────────────────────
router.get('/consent', asyncHandler(async (req, res) => {
  const { subjectType, subjectId } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (subjectType) { conditions.push(`subject_type = $${idx++}`); params.push(subjectType); }
  if (subjectId) { conditions.push(`subject_id = $${idx++}`); params.push(subjectId); }
  const { rows } = await db.query(
    `SELECT * FROM consent_records WHERE ${conditions.join(' AND ')} ORDER BY consented_at DESC`,
    params
  );
  res.json({ records: rows });
}));

const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
router.post('/consent/bulk-delete', bulkDeleteHandler('consent_records'));
router.get('/consent/export', async (req, res) => { const { rows } = await db.query("SELECT id, subject_type, subject_id, purpose, consented, consented_at FROM consent_records WHERE org_id = $1 ORDER BY consented_at DESC", [req.user.orgId]); sendCsv(res, 'consent_records.csv', rows, autoColumns(rows)); });
router.get('/requests/export', async (req, res) => { const { rows } = await db.query("SELECT id, requester_email, request_type, status, created_at FROM gdpr_requests WHERE org_id = $1 ORDER BY created_at DESC", [req.user.orgId]); sendCsv(res, 'gdpr_requests.csv', rows, autoColumns(rows)); });
router.post('/requests/bulk-delete', bulkDeleteHandler('gdpr_requests'));

router.post('/consent', asyncHandler(async (req, res) => {
  const { subjectType, subjectId, purpose, consented, source } = req.body || {};
  if (!subjectType || !subjectId || !purpose) return res.status(400).json({ error: 'subjectType, subjectId, and purpose are required.' });
  const { rows } = await db.query(
    `INSERT INTO consent_records (org_id, subject_type, subject_id, purpose, consented, source, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (subject_type, subject_id, purpose)
     DO UPDATE SET consented = $5, source = $6, ip_address = $7, consented_at = now()
     RETURNING *`,
    [req.user.orgId, subjectType, subjectId, purpose, consented !== false, source || null, req.ip]
  );
  res.json({ record: rows[0] });
}));

module.exports = router;
