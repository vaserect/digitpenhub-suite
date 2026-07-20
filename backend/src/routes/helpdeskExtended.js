const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

r.get('/canned-responses', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM helpdesk_canned_responses WHERE org_id = $1 ORDER BY title', [req.user.orgId]);
  res.json({ responses: rows });
});

r.post('/canned-responses', async (req, res) => {
  const { title, body, category } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const { rows } = await db.query(
    'INSERT INTO helpdesk_canned_responses (org_id, title, body, category, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.orgId, title, body, category || 'general', req.user.id]
  );
  res.status(201).json({ response: rows[0] });
});

r.get('/sla-policies', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM helpdesk_sla_policies WHERE org_id = $1 ORDER BY priority', [req.user.orgId]);
  res.json({ policies: rows });
});

r.post('/sla-policies', async (req, res) => {
  const { name, priority, firstResponseMin, resolutionMin } = req.body;
  if (!name || !priority || !firstResponseMin) return res.status(400).json({ error: 'name, priority, firstResponseMin required' });
  const { rows } = await db.query(
    'INSERT INTO helpdesk_sla_policies (org_id, name, priority, first_response_min, resolution_min) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.orgId, name, priority, firstResponseMin, resolutionMin || 2880]
  );
  res.status(201).json({ policy: rows[0] });
});

r.post('/:id/merge/:sourceId', async (req, res) => {
  const { id, sourceId } = req.params;
  await db.query(
    'INSERT INTO helpdesk_ticket_merges (target_ticket_id, source_ticket_id, merged_by) VALUES ($1,$2,$3)',
    [id, sourceId, req.user.id]
  );
  await db.query(`UPDATE helpdesk_tickets SET status = 'merged', merged_into = $1 WHERE id = $2 AND org_id = $3`,
    [id, sourceId, req.user.orgId]);
  res.json({ merged: true });
});

r.post('/:id/satisfaction', async (req, res) => {
  const { score } = req.body;
  if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'score must be 1-5' });
  await db.query('UPDATE helpdesk_tickets SET satisfaction_score = $1 WHERE id = $2 AND org_id = $3', [score, req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

module.exports = r;
