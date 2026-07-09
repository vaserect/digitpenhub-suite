const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Content Calendar ──────────────────────────────────────────────────────────
router.get('/calendar', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (from) { conditions.push(`scheduled_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`scheduled_at <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(
    `SELECT * FROM content_calendar_items WHERE ${conditions.join(' AND ')} ORDER BY scheduled_at ASC`,
    params
  );
  res.json({ items: rows });
}));

router.post('/calendar', asyncHandler(async (req, res) => {
  const { title, channel, scheduledAt, content, tags } = req.body || {};
  if (!title || !channel) return res.status(400).json({ error: 'title and channel are required.' });
  const { rows } = await db.query(
    `INSERT INTO content_calendar_items (org_id, title, channel, scheduled_at, content, tags, author_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, title, channel, scheduledAt || null, content || null, tags || [], req.user.id]
  );
  res.status(201).json({ item: rows[0] });
}));

router.patch('/calendar/:id', asyncHandler(async (req, res) => {
  const { status, scheduledAt, content, tags } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = [];
  let idx = 1;
  if (status) { updates.push(`status = $${idx++}`); params.push(status); if (status === 'published') updates.push(`published_at = now()`); }
  if (scheduledAt !== undefined) { updates.push(`scheduled_at = $${idx++}`); params.push(scheduledAt); }
  if (content !== undefined) { updates.push(`content = $${idx++}`); params.push(content); }
  if (tags !== undefined) { updates.push(`tags = $${idx++}`); params.push(tags); }
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(`UPDATE content_calendar_items SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`, params);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ item: rows[0] });
}));

router.delete('/calendar/:id', asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM content_calendar_items WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Activity Feed ─────────────────────────────────────────────────────────────
router.get('/activity', asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const { rows } = await db.query(
    `SELECT af.*, u.full_name FROM activity_feed af
     LEFT JOIN users u ON u.id = af.user_id
     WHERE af.org_id = $1 ORDER BY af.created_at DESC LIMIT $2`,
    [req.user.orgId, parseInt(limit)]
  );
  const { rows: cnt } = await db.query(`SELECT count(*) AS c FROM activity_feed WHERE org_id = $1`, [req.user.orgId]);
  res.json({ activities: rows, total: parseInt(cnt[0].c) });
}));

router.post('/activity', asyncHandler(async (req, res) => {
  const { action, entityType, entityId, summary, meta } = req.body || {};
  if (!action || !entityType || !summary) return res.status(400).json({ error: 'action, entityType, and summary are required.' });
  const { rows } = await db.query(
    `INSERT INTO activity_feed (org_id, user_id, action, entity_type, entity_id, summary, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, req.user.id, action, entityType, entityId || null, summary, JSON.stringify(meta || {})]
  );
  res.status(201).json({ activity: rows[0] });
}));

// ── Legal Templates ───────────────────────────────────────────────────────────
router.get('/legal-templates', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (type) { conditions.push(`type = $${idx++}`); params.push(type); }
  const { rows } = await db.query(`SELECT * FROM legal_templates WHERE ${conditions.join(' AND ')} ORDER BY name`, params);
  res.json({ templates: rows });
}));

router.post('/legal-templates', asyncHandler(async (req, res) => {
  const { name, type, content, placeholders } = req.body || {};
  if (!name || !type || !content) return res.status(400).json({ error: 'name, type, and content are required.' });
  const { rows } = await db.query(
    `INSERT INTO legal_templates (org_id, name, type, content, placeholder_keys)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, name, type, content, placeholders || []]
  );
  res.status(201).json({ template: rows[0] });
}));

router.put('/legal-templates/:id', asyncHandler(async (req, res) => {
  const { name, content, type, placeholders } = req.body || {};
  const { rows } = await db.query(
    `UPDATE legal_templates SET name = $1, content = $2, type = COALESCE($3, type), placeholder_keys = $4, updated_at = now()
     WHERE id = $5 AND org_id = $6 RETURNING *`,
    [name, content, type, placeholders || [], req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ template: rows[0] });
}));

router.delete('/legal-templates/:id', asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM legal_templates WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Vulnerability Scanning ────────────────────────────────────────────────────
router.get('/vuln-scans', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM vuln_scans WHERE org_id = $1 ORDER BY created_at DESC`, [req.user.orgId]);
  // Attach findings for each
  for (const scan of rows) {
    const { rows: findings } = await db.query(`SELECT * FROM vuln_findings WHERE scan_id = $1 ORDER BY severity ASC`, [scan.id]);
    scan.findings = findings;
  }
  res.json({ scans: rows });
}));

router.post('/vuln-scans', asyncHandler(async (req, res) => {
  const { scanType, findings } = req.body || {};
  if (!scanType) return res.status(400).json({ error: 'scanType is required.' });
  const { rows } = await db.query(
    `INSERT INTO vuln_scans (org_id, scan_type) VALUES ($1, $2) RETURNING *`,
    [req.user.orgId, scanType]
  );
  const scan = rows[0];

  // Insert findings if provided
  if (Array.isArray(findings)) {
    for (const f of findings) {
      await db.query(
        `INSERT INTO vuln_findings (scan_id, severity, title, description, package_name, cve_id, fix_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [scan.id, f.severity || 'medium', f.title, f.description || null, f.packageName || null, f.cveId || null, f.fixVersion || null]
      );
    }
  }
  await db.query(`UPDATE vuln_scans SET status = 'completed', completed_at = now() WHERE id = $1`, [scan.id]);

  const { rows: savedFindings } = await db.query(`SELECT * FROM vuln_findings WHERE scan_id = $1 ORDER BY severity ASC`, [scan.id]);
  res.status(201).json({ scan, findings: savedFindings });
}));

router.patch('/vuln-findings/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE vuln_findings SET status = $1 WHERE id = $2 RETURNING *`,
    [status || 'resolved', req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ finding: rows[0] });
}));

// ── Security Incident Response ────────────────────────────────────────────────
router.get('/runbooks', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM incident_runbooks WHERE org_id = $1 ORDER BY severity ASC`, [req.user.orgId]);
  res.json({ runbooks: rows });
}));

router.post('/runbooks', asyncHandler(async (req, res) => {
  const { name, severity, steps } = req.body || {};
  if (!name || !severity) return res.status(400).json({ error: 'name and severity are required.' });
  const { rows } = await db.query(
    `INSERT INTO incident_runbooks (org_id, name, severity, steps_json) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, name, severity, JSON.stringify(steps || [])]
  );
  res.status(201).json({ runbook: rows[0] });
}));

router.get('/incidents', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(`SELECT * FROM incidents WHERE ${conditions.join(' AND ')} ORDER BY detected_at DESC`, params);
  // Attach timeline
  for (const inc of rows) {
    const { rows: timeline } = await db.query(`SELECT * FROM incident_timeline WHERE incident_id = $1 ORDER BY created_at ASC`, [inc.id]);
    inc.timeline = timeline;
  }
  res.json({ incidents: rows });
}));

router.post('/incidents', asyncHandler(async (req, res) => {
  const { title, severity, description, runbookId } = req.body || {};
  if (!title || !severity) return res.status(400).json({ error: 'title and severity are required.' });
  const { rows } = await db.query(
    `INSERT INTO incidents (org_id, title, severity, description, runbook_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, title, severity, description || null, runbookId || null]
  );
  // Auto-log detection
  await db.query(`INSERT INTO incident_timeline (incident_id, action, performed_by) VALUES ($1, 'Incident detected', $2)`, [rows[0].id, req.user.id]);
  res.status(201).json({ incident: rows[0] });
}));

router.patch('/incidents/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const updates = [];
  const params = [];
  let idx = 1;
  if (status) { updates.push(`status = $${idx++}`); params.push(status); }
  if (status === 'resolved') { updates.push(`resolved_at = now()`); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(`UPDATE incidents SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`, params);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ incident: rows[0] });
}));

router.post('/incidents/:id/timeline', asyncHandler(async (req, res) => {
  const { action, note } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required.' });
  const { rows } = await db.query(
    `INSERT INTO incident_timeline (incident_id, action, note, performed_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, action, note || null, req.user.id]
  );
  res.status(201).json({ entry: rows[0] });
}));

module.exports = router;
