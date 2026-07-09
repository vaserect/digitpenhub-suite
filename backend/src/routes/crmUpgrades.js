const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Companies ─────────────────────────────────────────────────────────────────
router.get('/companies', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, (SELECT count(*) FROM contacts WHERE company_id = c.id) AS contact_count
     FROM crm_companies c WHERE c.org_id = $1 ORDER BY c.name`,
    [req.user.orgId]
  );
  res.json({ companies: rows });
}));

router.post('/companies', asyncHandler(async (req, res) => {
  const { name, website, industry, size, phone, email, address, notes } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Company name is required.' });
  try {
    const { rows } = await db.query(
      `INSERT INTO crm_companies (org_id, name, website, industry, size, phone, email, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.orgId, name.trim(), website || null, industry || null, size || null, phone || null, email || null, address || null, notes || null]
    );
    await db.query(`INSERT INTO crm_activity_log (org_id, action, detail, created_by) VALUES ($1,'company_created',$2,$3)`,
      [req.user.orgId, 'Created company: ' + name.trim(), req.user.id]);
    res.status(201).json({ company: rows[0] });
  } catch (e) {
    if (e.code === '42703') return res.status(400).json({ error: 'Table schema mismatch. Migration may need re-application.' });
    throw e;
  }
}));

router.put('/companies/:id', asyncHandler(async (req, res) => {
  const { name, website, industry, size, phone, email, address, notes } = req.body || {};
  const { rows } = await db.query(
    `UPDATE crm_companies SET name=$1, website=$2, industry=$3, size=$4, phone=$5, email=$6, address=$7, notes=$8, updated_at=now()
     WHERE id=$9 AND org_id=$10 RETURNING *`,
    [name, website, industry, size, phone, email, address, notes, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ company: rows[0] });
}));

router.delete('/companies/:id', asyncHandler(async (req, res) => {
  await db.query(`UPDATE contacts SET company_id = NULL WHERE company_id = $1`, [req.params.id]);
  await db.query(`DELETE FROM crm_companies WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Deals / Pipeline ─────────────────────────────────────────────────────────
router.patch('/contacts/:id/pipeline', asyncHandler(async (req, res) => {
  const { stage, dealValue, probability } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = []; let idx = 1;
  if (stage) { updates.push(`stage = $${idx++}::contact_stage`); params.push(stage); }
  if (dealValue !== undefined) { updates.push(`deal_value = $${idx++}`); params.push(dealValue); }
  if (probability !== undefined) { updates.push(`probability = $${idx++}`); params.push(probability); }
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING id, full_name, stage, deal_value, probability`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });
  await db.query(`INSERT INTO crm_activity_log (org_id, contact_id, action, detail, created_by) VALUES ($1,$2,'pipeline_update',$3,$4)`,
    [req.user.orgId, rows[0].id, 'Stage: ' + (rows[0].stage || '') + ', value: ' + (rows[0].deal_value || 0), req.user.id]);
  res.json({ contact: rows[0] });
}));

router.get('/pipeline', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT stage::text, count(*) AS count, COALESCE(sum(deal_value),0) AS value
     FROM contacts WHERE org_id = $1 AND stage IS NOT NULL
     GROUP BY stage ORDER BY stage`,
    [req.user.orgId]
  );
  res.json({ stages: rows });
}));

router.get('/pipeline/contacts', asyncHandler(async (req, res) => {
  const { stage } = req.query;
  const conditions = ['org_id = $1', 'stage IS NOT NULL'];
  const params = [req.user.orgId]; let idx = 2;
  if (stage) { conditions.push(`stage = $${idx++}::contact_stage`); params.push(stage); }
  const { rows } = await db.query(
    `SELECT id, full_name, stage::text, deal_value, probability, company_id, last_contacted_at
     FROM contacts WHERE ${conditions.join(' AND ')} ORDER BY deal_value DESC NULLS LAST`,
    params
  );
  res.json({ contacts: rows });
}));

// ── Email Sequences ──────────────────────────────────────────────────────────
router.get('/sequences', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.*, (SELECT count(*) FROM crm_sequence_enrollments WHERE sequence_id = s.id AND status='active') AS active_enrollments
     FROM crm_email_sequences s WHERE s.org_id = $1 ORDER BY s.name`,
    [req.user.orgId]
  );
  res.json({ sequences: rows });
}));

router.post('/sequences', asyncHandler(async (req, res) => {
  const { name, description, steps } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Sequence name is required.' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO crm_email_sequences (org_id, name, description) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.orgId, name.trim(), description || null]
    );
    const seq = rows[0];
    if (Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        await client.query(
          `INSERT INTO crm_sequence_steps (sequence_id, step_order, subject, body, delay_days) VALUES ($1,$2,$3,$4,$5)`,
          [seq.id, i, steps[i].subject, steps[i].body, steps[i].delayDays || 1]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ sequence: seq });
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally { client.release(); }
}));

router.post('/sequences/:id/enroll/:contactId', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `INSERT INTO crm_sequence_enrollments (sequence_id, contact_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *`,
    [req.params.id, req.params.contactId]
  );
  await db.query(`INSERT INTO crm_activity_log (org_id, contact_id, action, detail, created_by) VALUES ($1,$2,'enrolled','Enrolled in sequence',$3)`,
    [req.user.orgId, req.params.contactId, req.user.id]);
  res.status(201).json({ enrollment: rows[0] || { status: 'already_enrolled' } });
}));

// ── Activity Log ─────────────────────────────────────────────────────────────
router.get('/contacts/:contactId/activity', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.*, u.full_name FROM crm_activity_log a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.contact_id = $1 ORDER BY a.created_at DESC LIMIT 50`,
    [req.params.contactId]
  );
  res.json({ activities: rows });
}));

router.post('/contacts/:contactId/activity', asyncHandler(async (req, res) => {
  const { action, detail } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required.' });
  await db.query(
    `INSERT INTO crm_activity_log (org_id, contact_id, action, detail, created_by) VALUES ($1,$2,$3,$4,$5)`,
    [req.user.orgId, req.params.contactId, action, detail || null, req.user.id]
  );
  res.status(201).json({ ok: true });
}));

router.post("/bulk-delete", bulkDeleteHandler("crm_companies"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM crm_companies WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "crm_companies.csv", rows, autoColumns(rows)); });
router.get("/stats", async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM crm_companies WHERE org_id = module.exports =", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
