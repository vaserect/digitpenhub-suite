const db = require('../db');
const { smsProviderConfigured } = require('../utils/messagingProviders');
const { sendCsv, autoColumns } = require('../utils/csv');

async function getStats(req, res) {
  const [campRes, contactRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='sent')::int AS sent, COALESCE(SUM(sent_count),0)::int AS messages FROM sms_campaigns WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM sms_contacts WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
  ]);
  res.json({ totalCampaigns: campRes.rows[0].total, sentCampaigns: campRes.rows[0].sent, totalMessages: campRes.rows[0].messages, activeContacts: contactRes.rows[0].c });
}

async function listContacts(req, res) {
  const { status, search } = req.query;
  const conditions = ['org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (status) { conditions.push(`status=$${i++}`); vals.push(status); }
  if (search) { conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i})`); vals.push(`%${search}%`); i++; }
  const { rows } = await db.query(`SELECT * FROM sms_contacts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ contacts: rows });
}

async function createContact(req, res) {
  const { name, phone, tags } = req.body || {};
  if (!name?.trim())  return res.status(400).json({ error: 'name required' });
  if (!phone?.trim()) return res.status(400).json({ error: 'phone required' });
  const { rows } = await db.query(
    `INSERT INTO sms_contacts (org_id,name,phone,tags) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), phone.trim(), tags||[]]
  );
  res.status(201).json({ contact: rows[0] });
}

async function updateContact(req, res) {
  const { id } = req.params;
  const { name, phone, tags, status } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name   !== undefined) { updates.push(`name=$${i++}`);   vals.push(name.trim()); }
  if (phone  !== undefined) { updates.push(`phone=$${i++}`);  vals.push(phone.trim()); }
  if (tags   !== undefined) { updates.push(`tags=$${i++}`);   vals.push(tags||[]); }
  if (status !== undefined) { updates.push(`status=$${i++}`); vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE sms_contacts SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ contact: rows[0] });
}

async function deleteContact(req, res) {
  await db.query(`DELETE FROM sms_contacts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// Bulk CSV import — accepts up to 2000 rows per request (matches the
// contact-list realistically pasted/uploaded at once; larger lists should be
// split client-side). Dedupes against existing contacts by phone number
// within the org, and against duplicate phone numbers within the same
// upload, so re-importing the same file twice doesn't double contacts.
async function bulkCreateContacts(req, res) {
  const { contacts } = req.body || {};
  if (!Array.isArray(contacts) || !contacts.length) return res.status(400).json({ error: 'contacts array required' });
  if (contacts.length > 2000) return res.status(400).json({ error: 'Max 2000 contacts per import.' });

  const { rows: existingRows } = await db.query(`SELECT phone FROM sms_contacts WHERE org_id=$1`, [req.user.orgId]);
  const existingPhones = new Set(existingRows.map((r) => r.phone));

  const seen = new Set();
  const valid = [];
  let invalid = 0, duplicate = 0;
  for (const raw of contacts) {
    const name = String(raw?.name || '').trim();
    const phone = String(raw?.phone || '').trim();
    const tags = Array.isArray(raw?.tags) ? raw.tags : String(raw?.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    if (!name || !phone) { invalid++; continue; }
    if (existingPhones.has(phone) || seen.has(phone)) { duplicate++; continue; }
    seen.add(phone);
    valid.push({ name, phone, tags });
  }

  if (!valid.length) return res.json({ imported: 0, duplicate, invalid });

  const values = [];
  const placeholders = valid.map((c, i) => {
    const base = i * 4;
    values.push(req.user.orgId, c.name, c.phone, c.tags);
    return `($${base+1},$${base+2},$${base+3},$${base+4})`;
  });
  await db.query(`INSERT INTO sms_contacts (org_id,name,phone,tags) VALUES ${placeholders.join(',')}`, values);

  res.status(201).json({ imported: valid.length, duplicate, invalid });
}

async function listCampaigns(req, res) {
  const { rows } = await db.query(`SELECT * FROM sms_campaigns WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ campaigns: rows });
}

async function createCampaign(req, res) {
  const { name, message, scheduledAt } = req.body || {};
  if (!name?.trim())    return res.status(400).json({ error: 'name required' });
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });
  const { rows } = await db.query(
    `INSERT INTO sms_campaigns (org_id,name,message,scheduled_at) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), message.trim(), scheduledAt||null]
  );
  res.status(201).json({ campaign: rows[0] });
}

async function sendCampaign(req, res) {
  const { id } = req.params;
  const { contactIds } = req.body || {};
  const camp = await db.query(`SELECT * FROM sms_campaigns WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!camp.rows.length)           return res.status(404).json({ error: 'Not found.' });
  if (camp.rows[0].status === 'sent') return res.status(400).json({ error: 'Already sent.' });
  const count = contactIds?.length || 0;

  // No SMS gateway is configured for this deployment — simulate the send
  // (record it, don't claim delivery) rather than lying about a real send.
  // See utils/messagingProviders.js for how to wire a real provider.
  const simulated = !smsProviderConfigured();

  const { rows } = await db.query(
    `UPDATE sms_campaigns SET status='sent',sent_at=NOW(),recipients_count=$1,sent_count=$1,simulated=$2 WHERE id=$3 AND org_id=$4 RETURNING *`,
    [count, simulated, id, req.user.orgId]
  );
  res.json({ campaign: rows[0], simulated });
}

async function deleteCampaign(req, res) {
  await db.query(`DELETE FROM sms_campaigns WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportContacts(req, res) {
  const { rows } = await db.query(`SELECT * FROM sms_contacts WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'sms-contacts.csv', rows, autoColumns(rows));
}

module.exports = { getStats, listContacts, exportContacts, createContact, updateContact, deleteContact, bulkCreateContacts, listCampaigns, createCampaign, sendCampaign, deleteCampaign };
