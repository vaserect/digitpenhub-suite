const db = require('../db');
const { notify } = require('../utils/notify');

// A field is only actually required/visible if it has no `showIf` condition,
// or its condition is met by the given answers — matches the same branching
// logic the public form page evaluates client-side, so server-side
// validation can't be bypassed by a field the visitor never saw.
function isFieldVisible(field, data) {
  if (!field.showIf || !field.showIf.fieldId) return true;
  const answer = data[field.showIf.fieldId];
  const target = field.showIf.value;
  if (field.showIf.operator === 'not_equals') return String(answer ?? '') !== String(target ?? '');
  return String(answer ?? '') === String(target ?? '');
}

async function getStats(req, res) {
  const [fRes, rRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM forms WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM form_responses WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({ activeForms: fRes.rows[0].c, totalResponses: rRes.rows[0].c });
}

async function listForms(req, res) {
  const { rows } = await db.query(
    `SELECT f.*, COUNT(r.id)::int AS response_count FROM forms f
     LEFT JOIN form_responses r ON r.form_id=f.id
     WHERE f.org_id=$1 GROUP BY f.id ORDER BY f.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ forms: rows });
}

async function getForm(req, res) {
  const { rows } = await db.query(`SELECT * FROM forms WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ form: rows[0] });
}

async function createForm(req, res) {
  const { name, description, fields, status, submitMessage } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO forms (org_id,name,description,fields,status,submit_message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, JSON.stringify(fields||[]), status||'active', submitMessage||'Thank you for your submission!']
  );
  res.status(201).json({ form: rows[0] });
}

async function updateForm(req, res) {
  const { id } = req.params;
  const { name, description, fields, status, submitMessage } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name          !== undefined) { updates.push(`name=$${i++}`);           vals.push(name.trim()); }
  if (description   !== undefined) { updates.push(`description=$${i++}`);    vals.push(description||null); }
  if (fields        !== undefined) { updates.push(`fields=$${i++}`);         vals.push(JSON.stringify(fields)); }
  if (status        !== undefined) { updates.push(`status=$${i++}`);         vals.push(status); }
  if (submitMessage !== undefined) { updates.push(`submit_message=$${i++}`); vals.push(submitMessage||'Thank you!'); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE forms SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ form: rows[0] });
}

async function deleteForm(req, res) {
  await db.query(`DELETE FROM forms WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listResponses(req, res) {
  const { rows } = await db.query(`SELECT * FROM form_responses WHERE form_id=$1 AND org_id=$2 ORDER BY submitted_at DESC`, [req.params.id, req.user.orgId]);
  res.json({ responses: rows });
}

async function deleteResponse(req, res) {
  await db.query(`DELETE FROM form_responses WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Public — no auth (visitor-facing fill/submit page) ─────────────────────

async function getPublicForm(req, res) {
  const { rows } = await db.query(
    `SELECT id, name, description, fields, submit_message FROM forms WHERE id=$1 AND status='active'`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Form not found or inactive.' });
  res.json({ form: rows[0] });
}

async function submitPublicResponse(req, res) {
  const { rows } = await db.query(`SELECT id, org_id, name, fields FROM forms WHERE id=$1 AND status='active'`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Form not found or inactive.' });
  const form = rows[0];
  const data = req.body || {};

  const fields = Array.isArray(form.fields) ? form.fields : [];
  for (const field of fields) {
    if (!isFieldVisible(field, data)) continue; // hidden by conditional logic — not required
    if (field.required && (data[field.id] === undefined || data[field.id] === '' || data[field.id] === null)) {
      return res.status(400).json({ error: `"${field.label}" is required.` });
    }
  }

  const { rows: inserted } = await db.query(
    `INSERT INTO form_responses (org_id, form_id, data) VALUES ($1,$2,$3) RETURNING id, submitted_at`,
    [form.org_id, form.id, JSON.stringify(data)]
  );

  notify(form.org_id, {
    type: 'form_response',
    title: 'New form response',
    body: `Someone submitted "${form.name}".`,
    email: true,
  });

  res.status(201).json({ ok: true, responseId: inserted[0].id });
}

// Public — no auth. Lists every active form so a single site-wide
// sitemap.xml can include public forms, mirroring pagesController's
// listPublicSitemap.
async function listPublicSitemap(req, res) {
  const { rows } = await db.query(
    `SELECT id, created_at AS updated_at FROM forms WHERE status = 'active' ORDER BY created_at DESC`
  );
  res.json({ forms: rows });
}

module.exports = { getStats, listForms, getForm, createForm, updateForm, deleteForm, listResponses, deleteResponse, getPublicForm, submitPublicResponse, listPublicSitemap };
