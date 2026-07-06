const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteTickets = bulkDeleteHandler('helpdesk_tickets');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='open')::int AS open,
       COUNT(*) FILTER(WHERE status='pending')::int AS pending,
       COUNT(*) FILTER(WHERE status='resolved')::int AS resolved
     FROM helpdesk_tickets WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listTickets(req, res) {
  const { status, priority } = req.query;
  const conditions = ['org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (status)   { conditions.push(`status=$${i++}`);   vals.push(status); }
  if (priority) { conditions.push(`priority=$${i++}`); vals.push(priority); }
  const { rows } = await db.query(`SELECT * FROM helpdesk_tickets WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, vals);
  res.json({ tickets: rows });
}

async function getTicket(req, res) {
  const [ticketRes, repliesRes] = await Promise.all([
    db.query(`SELECT * FROM helpdesk_tickets WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]),
    db.query(`SELECT * FROM helpdesk_replies WHERE ticket_id=$1 AND org_id=$2 ORDER BY created_at`, [req.params.id, req.user.orgId]),
  ]);
  if (!ticketRes.rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ ticket: ticketRes.rows[0], replies: repliesRes.rows });
}

async function createTicket(req, res) {
  const { subject, description, requesterName, requesterEmail, priority, assignee } = req.body || {};
  if (!subject?.trim())       return res.status(400).json({ error: 'subject required' });
  if (!requesterName?.trim()) return res.status(400).json({ error: 'requesterName required' });
  const seqRes = await db.query(`SELECT nextval('ticket_number_seq') AS n`);
  const ticketNumber = `TKT-${String(seqRes.rows[0].n).padStart(5, '0')}`;
  const { rows } = await db.query(
    `INSERT INTO helpdesk_tickets (org_id,ticket_number,subject,description,requester_name,requester_email,priority,assignee)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, ticketNumber, subject.trim(), description||null, requesterName.trim(), requesterEmail||null, priority||'medium', assignee||null]
  );
  res.status(201).json({ ticket: rows[0] });
}

async function updateTicket(req, res) {
  const { id } = req.params;
  const { status, priority, assignee, subject, description } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (status      !== undefined) { updates.push(`status=$${i++}`);      vals.push(status); }
  if (priority    !== undefined) { updates.push(`priority=$${i++}`);    vals.push(priority); }
  if (assignee    !== undefined) { updates.push(`assignee=$${i++}`);    vals.push(assignee||null); }
  if (subject     !== undefined) { updates.push(`subject=$${i++}`);     vals.push(subject.trim()); }
  if (description !== undefined) { updates.push(`description=$${i++}`); vals.push(description||null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE helpdesk_tickets SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ ticket: rows[0] });
}

async function deleteTicket(req, res) {
  await db.query(`DELETE FROM helpdesk_tickets WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function addReply(req, res) {
  const { author, body, isInternal } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  const { rows } = await db.query(
    `INSERT INTO helpdesk_replies (org_id,ticket_id,author,body,is_internal) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, req.params.id, author||'Support', body.trim(), !!isInternal]
  );
  await db.query(`UPDATE helpdesk_tickets SET updated_at=NOW() WHERE id=$1`, [req.params.id]);
  res.status(201).json({ reply: rows[0] });
}

async function exportTickets(req, res) {
  const { rows } = await db.query(`SELECT * FROM helpdesk_tickets WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  sendCsv(res, 'helpdesk-tickets.csv', rows, autoColumns(rows));
}

module.exports = { getStats, listTickets, exportTickets, getTicket, createTicket, updateTicket, deleteTicket, addReply, bulkDeleteTickets };
