const db = require('../db');
const { notify } = require('../utils/notify');
const { trackActivity } = require('../utils/activityTracker');

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
    `SELECT id, org_id, fields_json, name FROM lead_forms WHERE id = $1 AND is_active = true`,
    [id]
  );
  if (!formResult.rows.length) return res.status(404).json({ error: 'Form not found or inactive.' });

  const form = formResult.rows[0];
  const data = req.body || {};
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  // Validate required fields defined on the form
  const fields = Array.isArray(form.fields_json) ? form.fields_json : [];
  for (const field of fields) {
    const fieldId = field.id || field.key;
    if (field.required && (data[fieldId] === undefined || data[fieldId] === '' || data[fieldId] === null)) {
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

  // Extract contact fields intelligently
  let email = null;
  let phone = null;
  let fullName = null;
  let company = null;

  for (const field of fields) {
    const fieldId = field.id || field.key;
    const val = data[fieldId];
    if (!val) continue;

    const labelLower = (field.label || '').toLowerCase();
    const typeLower = (field.type || '').toLowerCase();

    if (typeLower === 'email' || labelLower.includes('email')) {
      email = String(val).trim().toLowerCase();
    } else if (typeLower === 'phone' || labelLower.includes('phone') || labelLower.includes('mobile')) {
      phone = String(val).trim();
    } else if (labelLower.includes('name')) {
      fullName = String(val).trim();
    } else if (labelLower.includes('company')) {
      company = String(val).trim();
    }
  }

  if (!fullName && email) {
    fullName = email.split('@')[0];
  }

  if (email) {
    try {
      let contactId = null;
      let isNewContact = false;

      const contactCheck = await db.query(
        `SELECT id, full_name, phone, company FROM contacts WHERE org_id = $1 AND email = $2`,
        [form.org_id, email]
      );

      if (contactCheck.rows.length > 0) {
        const existingContact = contactCheck.rows[0];
        contactId = existingContact.id;
        // Update contact with new details if they were empty
        await db.query(
          `UPDATE contacts 
           SET last_touch_at = NOW(),
               full_name = COALESCE($1, full_name),
               phone = COALESCE($2, phone),
               company = COALESCE($3, company)
           WHERE id = $4`,
          [fullName || null, phone || null, company || null, contactId]
        );
      } else {
        isNewContact = true;
        const insertRes = await db.query(
          `INSERT INTO contacts (org_id, full_name, email, phone, company, stage, tags, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'new', $6, NOW(), NOW())
           RETURNING id`,
          [form.org_id, fullName || 'Anonymous Lead', email, phone || null, company || null, ['lead-form', form.name]]
        );
        contactId = insertRes.rows[0].id;
      }

      // Track activity on contact timeline
      if (contactId) {
        trackActivity(form.org_id, null, 'contact.form_submitted', {
          contactId,
          description: `Submitted lead form: ${form.name}`,
          metadata: { formId: form.id, formName: form.name, submissionData: data }
        });
      }

      // Trigger automation workflows for form_submitted
      const formWorkflows = await db.query(
        `SELECT id FROM automation_workflows 
         WHERE org_id = $1 AND status = 'active' AND trigger_type = 'form_submitted'`,
        [form.org_id]
      );

      for (const wf of formWorkflows.rows) {
        await db.query(
          `INSERT INTO automation_enrollments (org_id, workflow_id, contact_email, contact_name, status, enrolled_at)
           VALUES ($1, $2, $3, $4, 'active', NOW())
           ON CONFLICT DO NOTHING`,
          [form.org_id, wf.id, email, fullName || 'Anonymous Lead']
        );
      }

      // Trigger automation workflows for contact_created (if it was newly created)
      if (isNewContact) {
        const contactWorkflows = await db.query(
          `SELECT id FROM automation_workflows 
           WHERE org_id = $1 AND status = 'active' AND trigger_type = 'contact_created'`,
          [form.org_id]
        );

        for (const wf of contactWorkflows.rows) {
          await db.query(
            `INSERT INTO automation_enrollments (org_id, workflow_id, contact_email, contact_name, status, enrolled_at)
             VALUES ($1, $2, $3, $4, 'active', NOW())
             ON CONFLICT DO NOTHING`,
            [form.org_id, wf.id, email, fullName || 'Anonymous Lead']
          );
        }
      }
    } catch (err) {
      console.error('Failed to integrate CRM Contact from lead submission:', err);
    }
  }

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
