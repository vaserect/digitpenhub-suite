const db = require('../db');
const ContactService = require('../services/crm/ContactService');
const { attachCustomFields, validateCustomFieldValues, upsertCustomFieldValues } = require('../utils/customFields');
const { notify } = require('../utils/notify');
const { trackActivity } = require('../utils/activityTracker');

const STAGES = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];

async function listContacts(req, res) {
  try {
    const contacts = await ContactService.findAll(req.user.orgId);
    const stats = await ContactService.getStatistics(req.user.orgId);
    const withEngineFields = await attachCustomFields(contacts, 'crm_contact', req.user.orgId);
    res.json({ contacts: withEngineFields, counts: stats });
  } catch (err) { throw err; }
}

async function createContact(req, res) {
  const { fullName, company, email, phone, stage, valueNgn, tags, customFields } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required.' });
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }
  const { errors, defByKey } = await validateCustomFieldValues(req.user.orgId, 'crm_contact', customFields || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  const client = await db.connect();
  let contact = null;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, created_by, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags`,
      [req.user.orgId, fullName, company || null, email || null, phone || null, stage || 'new', valueNgn || 0, req.user.id,
       Array.isArray(tags) ? tags : []]
    );
    contact = rows[0];
    if (customFields) {
      await upsertCustomFieldValues(client, req.user.orgId, 'crm_contact', contact.id, customFields, defByKey);
    }
    await client.query(`INSERT INTO audit_log (user_id, action, meta) VALUES ($1,'crm.contact.create',$2)`, [
      req.user.id, JSON.stringify({ contactId: contact.id }),
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
  trackActivity(req.user.orgId, req.user.id, 'contact.created', {
    contactId: contact.id, description: `Created contact ${fullName}`, metadata: { fullName, source: 'manual' },
  });
  res.status(201).json({ contact: { ...contact, customFields: customFields || {} } });
}

async function updateContact(req, res) {
  const { id } = req.params;
  const { fullName, company, email, phone, stage, valueNgn, tags, customFields } = req.body || {};
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }
  let defByKey = null;
  if (customFields !== undefined) {
    const validation = await validateCustomFieldValues(req.user.orgId, 'crm_contact', customFields || {});
    if (validation.errors.length) return res.status(400).json({ error: validation.errors.join(' ') });
    defByKey = validation.defByKey;
  }
  const client = await db.connect();
  let contact = null;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE contacts
       SET full_name = COALESCE($1, full_name), company = COALESCE($2, company),
           email = COALESCE($3, email), phone = COALESCE($4, phone),
           stage = COALESCE($5, stage), value_ngn = COALESCE($6, value_ngn),
           tags = COALESCE($7, tags), last_touch_at = now(), updated_at = now()
       WHERE id = $8 AND org_id = $9
       RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags`,
      [fullName || null, company ?? null, email ?? null, phone ?? null, stage || null, valueNgn ?? null,
       Array.isArray(tags) ? tags : null, id, req.user.orgId]
    );
    if (rows.length) {
      contact = rows[0];
      if (customFields !== undefined) {
        await upsertCustomFieldValues(client, req.user.orgId, 'crm_contact', id, customFields, defByKey);
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
  if (!contact) return res.status(404).json({ error: 'Contact not found.' });
  if (stage) {
    trackActivity(req.user.orgId, req.user.id, 'contact.stage_changed', {
      contactId: id, description: `Stage changed to ${stage}`, metadata: { newStage: stage },
    });
  }
  const [withFields] = await attachCustomFields([contact], 'crm_contact', req.user.orgId);
  res.json({ contact: withFields });
}

async function deleteContact(req, res) {
  const { id } = req.params;
  const deleted = await ContactService.delete(id, req.user.orgId, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Contact not found.' });
  trackActivity(req.user.orgId, req.user.id, 'contact.deleted', {
    contactId: id, description: 'Deleted contact', metadata: {},
  });
  res.json({ ok: true });
}

async function assertContactInOrg(contactId, orgId) {
  const contact = await ContactService.findById(contactId, orgId);
  return contact !== null;
}

async function listContactNotes(req, res) {
  const { contactId } = req.params;
  try {
    const notes = await ContactService.getNotes(contactId, req.user.orgId);
    res.json({ notes });
  } catch (err) {
    if (err.message === 'Contact not found') return res.status(404).json({ error: 'Contact not found.' });
    throw err;
  }
}

async function createContactNote(req, res) {
  const { contactId } = req.params;
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'body is required.' });
  try {
    const note = await ContactService.addNote(contactId, { content: body.trim() }, req.user.orgId, req.user.id);
    trackActivity(req.user.orgId, req.user.id, 'note.added', {
      contactId, description: 'Added note', metadata: { preview: body.trim().slice(0, 100) },
    });
    res.status(201).json({ note: { ...note, author_name: req.user.fullName || null } });
  } catch (err) {
    if (err.message === 'Contact not found') return res.status(404).json({ error: 'Contact not found.' });
    throw err;
  }
}

async function deleteContactNote(req, res) {
  try {
    await ContactService.deleteNote(req.params.contactId, req.params.noteId, req.user.orgId);
    trackActivity(req.user.orgId, req.user.id, 'note.deleted', {
      contactId: req.params.contactId, description: 'Deleted note', metadata: {},
    });
    res.json({ ok: true });
  } catch (err) {
    if (err.message === 'Note not found') return res.status(404).json({ error: 'Note not found.' });
    throw err;
  }
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
  trackActivity(req.user.orgId, req.user.id, 'task.added', {
    contactId, description: `Added task: ${title}`, metadata: { title, dueDate },
  });
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
  if (status === 'done') {
    trackActivity(req.user.orgId, req.user.id, 'task.completed', {
      contactId: req.params.contactId, description: 'Completed task', metadata: { taskId },
    });
  }
  res.json({ task: rows[0] });
}

async function deleteContactTask(req, res) {
  const { taskId, contactId } = req.params;
  await db.query(`DELETE FROM contact_tasks WHERE id=$1 AND org_id=$2`, [taskId, req.user.orgId]);
  trackActivity(req.user.orgId, req.user.id, 'task.deleted', {
    contactId, description: 'Deleted task', metadata: {},
  });
  res.json({ ok: true });
}

async function bulkCreateContacts(req, res) {
  const { contacts } = req.body || {};
  if (!Array.isArray(contacts) || !contacts.length) return res.status(400).json({ error: 'contacts array required' });
  if (contacts.length > 2000) return res.status(400).json({ error: 'Max 2000 contacts per import.' });
  try {
    const result = await ContactService.bulkCreate(contacts, req.user.orgId, req.user.id);
    res.status(201).json({
      imported: result.created.length, errors: result.errors.length, duplicate: 0, invalid: result.errors.length,
    });
  } catch (err) { throw err; }
}

module.exports = {
  listContacts, createContact, updateContact, deleteContact, STAGES,
  listContactNotes, createContactNote, deleteContactNote,
  listContactTasks, createContactTask, updateContactTask, deleteContactTask,
  bulkCreateContacts,
};
