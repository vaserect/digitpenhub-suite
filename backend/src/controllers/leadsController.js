const db = require('../db');
const { notify } = require('../utils/notify');

// ── Forms ──────────────────────────────────────────────────────────────────

async function listForms(req, res) {
  const { rows } = await db.query(
    `SELECT f.id, f.name, f.is_active, f.created_at,
            COUNT(s.id) AS submission_count
     FROM lead_forms f
     LEFT JOIN lead_submissions s ON s.form_id = f.id
     WHERE f.org_id = $1
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ forms: rows });
}

async function createForm(req, res) {
  const { name, fields, thankYouMessage, redirectUrl } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO lead_forms (org_id, name, fields_json, thank_you_message, redirect_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, fields_json, thank_you_message, redirect_url, is_active, created_at`,
    [
      req.user.orgId,
      String(name).trim(),
      JSON.stringify(Array.isArray(fields) ? fields : []),
      thankYouMessage || 'Thank you! We will be in touch soon.',
      redirectUrl || null,
    ]
  );
  res.status(201).json({ form: rows[0] });
}

async function getForm(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT id, name, fields_json, thank_you_message, redirect_url, is_active, created_at
     FROM lead_forms WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Form not found.' });
  res.json({ form: rows[0] });
}

async function updateForm(req, res) {
  const { id } = req.params;
  const { name, fields, thankYouMessage, redirectUrl, isActive } = req.body || {};

  const { rows } = await db.query(
    `UPDATE lead_forms
     SET name              = COALESCE($1, name),
         fields_json       = COALESCE($2, fields_json),
         thank_you_message = COALESCE($3, thank_you_message),
         redirect_url      = COALESCE($4, redirect_url),
         is_active         = COALESCE($5, is_active),
         updated_at        = now()
     WHERE id = $6 AND org_id = $7
     RETURNING id, name, fields_json, thank_you_message, redirect_url, is_active, created_at`,
    [
      name ? String(name).trim() : null,
      fields !== undefined ? JSON.stringify(fields) : null,
      thankYouMessage || null,
      redirectUrl !== undefined ? (redirectUrl || null) : undefined,
      isActive !== undefined ? Boolean(isActive) : null,
      id,
      req.user.orgId,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Form not found.' });
  res.json({ form: rows[0] });
}

async function deleteForm(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM lead_forms WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Form not found.' });
  res.json({ ok: true });
}

// ── Public endpoints (no auth) ────────────────────────────────────────────

async function getPublicForm(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT id, name, fields_json, thank_you_message, redirect_url
     FROM lead_forms WHERE id = $1 AND is_active = true`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Form not found or inactive.' });
  res.json({ form: rows[0] });
}

async function submitForm(req, res) {
  const { id } = req.params;
  const formResult = await db.query(
    `SELECT id, org_id, fields_json FROM lead_forms WHERE id = $1 AND is_active = true`,
    [id]
  );
  if (!formResult.rows.length) return res.status(404).json({ error: 'Form not found or inactive.' });

  const form = formResult.rows[0];
  const data = req.body || {};
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  // Validate required fields defined on the form
  const fields = Array.isArray(form.fields_json) ? form.fields_json : [];
  for (const field of fields) {
    if (field.required && (data[field.id] === undefined || data[field.id] === '' || data[field.id] === null)) {
      return res.status(400).json({ error: `"${field.label}" is required.` });
    }
  }

  const { rows } = await db.query(
    `INSERT INTO lead_submissions (form_id, org_id, data_json, ip_address)
     VALUES ($1, $2, $3, $4)
     RETURNING id, submitted_at`,
    [form.id, form.org_id, JSON.stringify(data), ip]
  );

  notify(form.org_id, {
    type: 'lead_new',
    title: 'New lead captured',
    body: `Someone submitted "${form.name}".`,
    email: true,
  });

  res.status(201).json({ ok: true, submissionId: rows[0].id });
}

// ── Submissions (authenticated) ───────────────────────────────────────────

async function listSubmissions(req, res) {
  const { formId, status } = req.query;
  const conditions = ['s.org_id = $1'];
  const params = [req.user.orgId];

  if (formId) {
    params.push(formId);
    conditions.push(`s.form_id = $${params.length}`);
  }
  if (status && ['new', 'contacted', 'converted', 'lost'].includes(status)) {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT s.id, s.data_json, s.status, s.notes, s.ip_address, s.submitted_at,
            f.id AS form_id, f.name AS form_name
     FROM lead_submissions s
     JOIN lead_forms f ON f.id = s.form_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.submitted_at DESC`,
    params
  );
  res.json({ submissions: rows });
}

async function updateSubmission(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body || {};

  const validStatus = status && ['new', 'contacted', 'converted', 'lost'].includes(status) ? status : null;

  const { rows } = await db.query(
    `UPDATE lead_submissions
     SET status = COALESCE($1, status),
         notes  = COALESCE($2, notes)
     WHERE id = $3 AND org_id = $4
     RETURNING id, status, notes, submitted_at`,
    [validStatus, notes !== undefined ? notes : null, id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ submission: rows[0] });
}

async function deleteSubmission(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM lead_submissions WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ ok: true });
}

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status = 'new') AS new_count,
       COUNT(*) FILTER (WHERE status = 'contacted') AS contacted_count,
       COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
       COUNT(*) FILTER (WHERE status = 'lost') AS lost_count
     FROM lead_submissions WHERE org_id = $1`,
    [req.user.orgId]
  );
  const formsCount = await db.query(
    `SELECT COUNT(*) FROM lead_forms WHERE org_id = $1`, [req.user.orgId]
  );
  res.json({
    forms: Number(formsCount.rows[0].count),
    ...Object.fromEntries(
      Object.entries(rows[0]).map(([k, v]) => [k, Number(v)])
    ),
  });
}

module.exports = {
  listForms, createForm, getForm, updateForm, deleteForm,
  getPublicForm, submitForm,
  listSubmissions, updateSubmission, deleteSubmission,
  getStats,
};
