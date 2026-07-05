const db = require('../db');
const { whatsappProviderConfigured } = require('../utils/messagingProviders');

async function getStats(req, res) {
  const [cRes, tRes, bRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c, COUNT(*) FILTER(WHERE status='active')::int AS active FROM whatsapp_contacts WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM whatsapp_templates WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c, COUNT(*) FILTER(WHERE status='sent')::int AS sent FROM whatsapp_broadcasts WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({
    totalContacts: cRes.rows[0].c,
    activeContacts: cRes.rows[0].active,
    templates: tRes.rows[0].c,
    broadcasts: bRes.rows[0].c,
    broadcastsSent: bRes.rows[0].sent,
  });
}

// ── Contacts ──────────────────────────────────────────────────────────────────

async function listContacts(req, res) {
  const { status } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM whatsapp_contacts WHERE org_id=$1 AND ($2='' OR status=$2) ORDER BY name`,
    [req.user.orgId, status || '']
  );
  res.json({ contacts: rows });
}

async function createContact(req, res) {
  const { name, phone, notes, tags } = req.body || {};
  if (!name?.trim())  return res.status(400).json({ error: 'name is required.' });
  if (!phone?.trim()) return res.status(400).json({ error: 'phone is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_contacts (org_id, name, phone, notes, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), phone.trim(), notes||null, tags||[]]
  );
  res.status(201).json({ contact: rows[0] });
}

async function updateContact(req, res) {
  const { id } = req.params;
  const { name, phone, notes, tags, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name   !==undefined){updates.push(`name=$${i++}`);  vals.push(name.trim());}
  if (phone  !==undefined){updates.push(`phone=$${i++}`); vals.push(phone.trim());}
  if (notes  !==undefined){updates.push(`notes=$${i++}`); vals.push(notes||null);}
  if (tags   !==undefined){updates.push(`tags=$${i++}`);  vals.push(tags||[]);}
  if (status !==undefined){updates.push(`status=$${i++}`);vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE whatsapp_contacts SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ contact: rows[0] });
}

async function deleteContact(req, res) {
  await db.query(`DELETE FROM whatsapp_contacts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Templates ─────────────────────────────────────────────────────────────────

async function listTemplates(req, res) {
  const { rows } = await db.query(`SELECT * FROM whatsapp_templates WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ templates: rows });
}

async function createTemplate(req, res) {
  const { name, category, body, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  if (!body?.trim()) return res.status(400).json({ error: 'body is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_templates (org_id, name, category, body, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), category||'marketing', body.trim(), status||'draft']
  );
  res.status(201).json({ template: rows[0] });
}

async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, category, body, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name    !==undefined){updates.push(`name=$${i++}`);    vals.push(name.trim());}
  if (category!==undefined){updates.push(`category=$${i++}`);vals.push(category);}
  if (body    !==undefined){updates.push(`body=$${i++}`);    vals.push(body.trim());}
  if (status  !==undefined){updates.push(`status=$${i++}`);  vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE whatsapp_templates SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}

async function deleteTemplate(req, res) {
  await db.query(`DELETE FROM whatsapp_templates WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

async function listBroadcasts(req, res) {
  const { rows } = await db.query(
    `SELECT wb.*, wt.name AS template_name FROM whatsapp_broadcasts wb
     LEFT JOIN whatsapp_templates wt ON wt.id=wb.template_id
     WHERE wb.org_id=$1 ORDER BY wb.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ broadcasts: rows });
}

async function createBroadcast(req, res) {
  const { name, templateId, recipientCount, notes, scheduledAt, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO whatsapp_broadcasts (org_id, name, template_id, recipient_count, notes, scheduled_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, name.trim(), templateId||null, Number(recipientCount)||0, notes||null, scheduledAt||null, status||'draft']
  );
  res.status(201).json({ broadcast: rows[0] });
}

async function updateBroadcast(req, res) {
  const { id } = req.params;
  const { name, templateId, recipientCount, notes, scheduledAt, status } = req.body || {};
  // 'sent' may only be set via sendBroadcast, which records whether it was
  // actually dispatched or simulated — letting a plain field update claim
  // 'sent' would let the client fake a delivered broadcast with no send ever
  // happening.
  if (status === 'sent') return res.status(400).json({ error: 'Use the send action to mark a broadcast as sent.' });
  const updates=[]; const vals=[]; let i=1;
  if (name          !==undefined){updates.push(`name=$${i++}`);           vals.push(name.trim());}
  if (templateId    !==undefined){updates.push(`template_id=$${i++}`);    vals.push(templateId||null);}
  if (recipientCount!==undefined){updates.push(`recipient_count=$${i++}`);vals.push(Number(recipientCount));}
  if (notes         !==undefined){updates.push(`notes=$${i++}`);          vals.push(notes||null);}
  if (scheduledAt   !==undefined){updates.push(`scheduled_at=$${i++}`);   vals.push(scheduledAt||null);}
  if (status        !==undefined){updates.push(`status=$${i++}`);         vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE whatsapp_broadcasts SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Broadcast not found.' });
  res.json({ broadcast: rows[0] });
}

async function deleteBroadcast(req, res) {
  await db.query(`DELETE FROM whatsapp_broadcasts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function sendBroadcast(req, res) {
  const { id } = req.params;
  const existing = await db.query(`SELECT * FROM whatsapp_broadcasts WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Broadcast not found.' });
  if (existing.rows[0].status === 'sent') return res.status(400).json({ error: 'Already sent.' });

  // No WhatsApp Business API credentials configured for this deployment —
  // simulate the send rather than claiming a real dispatch. See
  // utils/messagingProviders.js for how to wire a real provider.
  const simulated = !whatsappProviderConfigured();

  const { rows } = await db.query(
    `UPDATE whatsapp_broadcasts SET status='sent', sent_at=NOW(), simulated=$1 WHERE id=$2 AND org_id=$3 RETURNING *`,
    [simulated, id, req.user.orgId]
  );
  res.json({ broadcast: rows[0], simulated });
}

module.exports = {
  getStats,
  listContacts, createContact, updateContact, deleteContact,
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  listBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast, sendBroadcast,
};
