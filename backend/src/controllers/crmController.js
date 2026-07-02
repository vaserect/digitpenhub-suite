const db = require('../db');

const STAGES = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];

async function listContacts(req, res) {
  const { rows } = await db.query(
    `SELECT id, full_name, company, email, phone, stage, value_ngn, last_touch_at
     FROM contacts WHERE org_id = $1
     ORDER BY last_touch_at DESC`,
    [req.user.orgId]
  );

  const counts = { new: 0, contacted: 0, proposal_sent: 0, won: 0, lost: 0 };
  rows.forEach((r) => { counts[r.stage] = (counts[r.stage] || 0) + 1; });

  res.json({ contacts: rows, counts });
}

async function createContact(req, res) {
  const { fullName, company, email, phone, stage, valueNgn } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'fullName is required.' });
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }

  const { rows } = await db.query(
    `INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at`,
    [req.user.orgId, fullName, company || null, email || null, phone || null, stage || 'new', valueNgn || 0, req.user.id]
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
  const { fullName, company, email, phone, stage, valueNgn } = req.body || {};
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
         last_touch_at = now(),
         updated_at = now()
     WHERE id = $7 AND org_id = $8
     RETURNING id, full_name, company, email, phone, stage, value_ngn, last_touch_at`,
    [fullName || null, company ?? null, email ?? null, phone ?? null, stage || null, valueNgn ?? null, id, req.user.orgId]
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

module.exports = { listContacts, createContact, updateContact, deleteContact, STAGES };
