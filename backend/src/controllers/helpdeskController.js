const HelpdeskService = require('../services/helpdesk/HelpdeskService');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');

const helpdeskService = new HelpdeskService();
const bulkDeleteTickets = bulkDeleteHandler('helpdesk_tickets');

async function getStats(req, res) {
  const stats = await helpdeskService.getStats(req.user.orgId);
  res.json(stats);
}

async function listTickets(req, res) {
  const { status, priority } = req.query;
  const tickets = await helpdeskService.findAll(req.user.orgId, { status, priority });
  res.json({ tickets });
}

async function getTicket(req, res) {
  const result = await helpdeskService.getTicketWithReplies(req.params.id, req.user.orgId);
  if (!result.ticket) return res.status(404).json({ error: 'Not found.' });
  res.json(result);
}

async function createTicket(req, res) {
  const ticket = await helpdeskService.createTicket(req.body, req.user.orgId, req.user.id);
  res.status(201).json({ ticket });
}

async function updateTicket(req, res) {
  const { id } = req.params;
  const { status, priority, assignee, subject, description } = req.body || {};
  if (!status && !priority && assignee === undefined && !subject && !description) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }
  const ticket = await helpdeskService.update(id, { status, priority, assignee, subject, description }, req.user.orgId, req.user.id);
  if (!ticket) return res.status(404).json({ error: 'Not found.' });
  res.json({ ticket });
}

async function deleteTicket(req, res) {
  await helpdeskService.delete(req.params.id, req.user.orgId, req.user.id);
  res.json({ ok: true });
}

async function addReply(req, res) {
  const { author, body, isInternal } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  const reply = await helpdeskService.addReply(req.params.id, req.user.orgId, { author, body, isInternal });
  if (!reply) return res.status(404).json({ error: 'Not found.' });
  res.status(201).json({ reply });
}

async function exportTickets(req, res) {
  const rows = await helpdeskService.exportAll(req.user.orgId);
  sendCsv(res, 'helpdesk-tickets.csv', rows, autoColumns(rows));
}

module.exports = { getStats, listTickets, exportTickets, getTicket, createTicket, updateTicket, deleteTicket, addReply, bulkDeleteTickets };
