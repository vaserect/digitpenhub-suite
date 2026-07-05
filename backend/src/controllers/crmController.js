const db = require('../db');

const STAGES = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];

async function listContacts(req, res) {
  const { rows } = await db.query(
    `SELECT id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags, custom_fields
     FROM contacts WHERE org_id = $1
     ORDER BY last_touch_at DESC`,
    [req.user.orgId]
  );

  const counts = { new: 0, contacted: 0, proposal_sent: 0, won: 0, lost: 0 };
  rows.forEach((r) => { counts[r.stage] = (counts[r.stage] || 0) + 1; });

  res.json({ contacts: rows, counts });
}

async function createContact(req, res) {
  const { fullName, company, email, phone, stage, valueNgn, tags, customFields } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required.' });
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }

  const { rows } = await db.query(
    `INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, created_by, tags, custom_fields)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags, custom_fields`,
    [req.user.orgId, fullName, company || null, email || null, phone || null, stage || 'new', valueNgn || 0, req.user.id,
     Array.isArray(tags) ? tags : [], JSON.stringify(customFields || {})]
  );

  await db.query(`INSERT INTO audit_log (user_id, action, meta) VALUES ($1,'crm.contact.create',$2)`, [
    req.user.id,
    JSON.stringify({ contactId: rows[0].id }),
  ]);

  res.status(201).json({ contact: rows[0] });
}

// Full edit: any subset of these fields can be sent; whatever's omitted is left unchanged.
// stage/value updates also bump last_touch_at — that field exists specifically to mean
// "when did someone last act on this contact," so any edit at all counts as a touch.
async function updateContact(req, res) {
  const { id } = req.params;
  const { fullName, company, email, phone, stage, valueNgn, tags, customFields } = req.body || {};
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }

  // org_id check in the WHERE clause is the tenant-isolation guard — a user can never
  // touch another organization's contact even if they guess a valid id.
  const { rows } = await db.query(
    `UPDATE contacts
     SET full_name = COALESCE($1, full_name),
         company = COALESCE($2, company),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         stage = COALESCE($5, stage),
         value_ngn = COALESCE($6, value_ngn),
         tags = COALESCE($7, tags),
         custom_fields = COALESCE($8, custom_fields),
         last_touch_at = now(),
         updated_at = now()
     WHERE id = $9 AND org_id = $10
     RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags, custom_fields`,
    [fullName || null, company ?? null, email ?? null, phone ?? null, stage || null, valueNgn ?? null,
     Array.isArray(tags) ? tags : null, customFields ? JSON.stringify(customFields) : null, id, req.user.orgId]
  );

  if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ contact: rows[0] });
}

async function deleteContact(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM contacts WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });

  await db.query(`INSERT INTO audit_log (user_id, action, meta) VALUES ($1,'crm.contact.delete',$2)`, [
    req.user.id,
    JSON.stringify({ contactId: id }),
  ]);

  res.json({ ok: true });
}

// A contact_id foreign key alone doesn't enforce tenant isolation — a user
// could otherwise read/write notes and tasks on another org's contact by ID.
async function assertContactInOrg(contactId, orgId) {
  const { rows } = await db.query(`SELECT 1 FROM contacts WHERE id=$1 AND org_id=$2`, [contactId, orgId]);
  return rows.length > 0;
}

async function listContactNotes(req, res) {
  const { contactId } = req.params;
  if (!(await assertContactInOrg(contactId, req.user.orgId))) return res.status(404).json({ error: 'Contact not found.' });
  const { rows } = await db.query(
    `SELECT n.id, n.body, n.created_at, u.full_name AS author_name
     FROM contact_notes n LEFT JOIN users u ON u.id = n.author_id
     WHERE n.contact_id = $1 ORDER BY n.created_at DESC`,
    [contactId]
  );
  res.json({ notes: rows });
}

async function createContactNote(req, res) {
  const { contactId } = req.params;
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'body is required.' });
  if (!(await assertContactInOrg(contactId, req.user.orgId))) return res.status(404).json({ error: 'Contact not found.' });
  const { rows } = await db.query(
    `INSERT INTO contact_notes (org_id, contact_id, author_id, body) VALUES ($1,$2,$3,$4) RETURNING id, body, created_at`,
    [req.user.orgId, contactId, req.user.id, body.trim()]
  );
  res.status(201).json({ note: { ...rows[0], author_name: req.user.fullName || null } });
}

async function deleteContactNote(req, res) {
  await db.query(`DELETE FROM contact_notes WHERE id=$1 AND org_id=$2`, [req.params.noteId, req.user.orgId]);
  res.json({ ok: true });
}

async function listContactTasks(req, res) {
  const { contactId } = req.params;
  if (!(await assertContactInOrg(contactId, req.user.orgId))) return res.status(404).json({ error: 'Contact not found.' });
  const { rows } = await db.query(
    `SELECT id, title, due_date, status, created_at FROM contact_tasks WHERE contact_id = $1 ORDER BY status, due_date NULLS LAST, created_at`,
    [contactId]
  );
  res.json({ tasks: rows });
}

async function createContactTask(req, res) {
  const { contactId } = req.params;
  const { title, dueDate } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  if (!(await assertContactInOrg(contactId, req.user.orgId))) return res.status(404).json({ error: 'Contact not found.' });
  const { rows } = await db.query(
    `INSERT INTO contact_tasks (org_id, contact_id, title, due_date, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, contactId, title.trim(), dueDate || null, req.user.id]
  );
  res.status(201).json({ task: rows[0] });
}

async function updateContactTask(req, res) {
  const { taskId } = req.params;
  const { title, dueDate, status } = req.body || {};
  if (status && !['open', 'done'].includes(status)) return res.status(400).json({ error: 'status must be open or done.' });
  const { rows } = await db.query(
    `UPDATE contact_tasks SET title=COALESCE($1,title), due_date=COALESCE($2,due_date), status=COALESCE($3,status), updated_at=now()
     WHERE id=$4 AND org_id=$5 RETURNING *`,
    [title || null, dueDate || null, status || null, taskId, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
  res.json({ task: rows[0] });
}

async function deleteContactTask(req, res) {
  await db.query(`DELETE FROM contact_tasks WHERE id=$1 AND org_id=$2`, [req.params.taskId, req.user.orgId]);
  res.json({ ok: true });
}

// CSV import — mirrors the dedupe-by-identifier pattern already used by
// SMS Marketing's bulk contact import (dedupe by email within the org and
// within the same upload).
async function bulkCreateContacts(req, res) {
  const { contacts } = req.body || {};
  if (!Array.isArray(contacts) || !contacts.length) return res.status(400).json({ error: 'contacts array required' });
  if (contacts.length > 2000) return res.status(400).json({ error: 'Max 2000 contacts per import.' });

  const { rows: existingRows } = await db.query(`SELECT email FROM contacts WHERE org_id=$1 AND email IS NOT NULL`, [req.user.orgId]);
  const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase()));

  const seen = new Set();
  const valid = [];
  let invalid = 0, duplicate = 0;
  for (const raw of contacts) {
    const fullName = String(raw?.fullName || raw?.name || '').trim();
    const email = String(raw?.email || '').trim().toLowerCase() || null;
    const company = String(raw?.company || '').trim() || null;
    const phone = String(raw?.phone || '').trim() || null;
    if (!fullName) { invalid++; continue; }
    if (email && (existingEmails.has(email) || seen.has(email))) { duplicate++; continue; }
    if (email) seen.add(email);
    valid.push({ fullName, email, company, phone });
  }

  if (!valid.length) return res.json({ imported: 0, duplicate, invalid });

  const values = [];
  const placeholders = valid.map((c, i) => {
    const base = i * 6;
    values.push(req.user.orgId, c.fullName, c.company, c.email, c.phone, req.user.id);
    return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6})`;
  });
  await db.query(
    `INSERT INTO contacts (org_id, full_name, company, email, phone, created_by) VALUES ${placeholders.join(',')}`,
    values
  );

  res.status(201).json({ imported: valid.length, duplicate, invalid });
}

module.exports = {
  listContacts, createContact, updateContact, deleteContact, STAGES,
  listContactNotes, createContactNote, deleteContactNote,
  listContactTasks, createContactTask, updateContactTask, deleteContactTask,
  bulkCreateContacts,
};
