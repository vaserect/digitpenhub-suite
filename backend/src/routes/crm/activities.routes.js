const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');
const r = Router();
r.use(requireAuth);

r.get('/contacts/:contactId/activities', async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM crm_activities WHERE org_id = $1 AND entity_type = 'contact' AND entity_id = $2 ORDER BY created_at DESC LIMIT 50",
    [req.user.orgId, req.params.contactId]
  );
  res.json({ activities: rows });
});

r.post('/contacts/:contactId/activities', async (req, res) => {
  const { activityType, subject, description } = req.body;
  if (!activityType || !subject) return res.status(400).json({ error: 'activityType and subject required' });
  const { rows } = await db.query(
    `INSERT INTO crm_activities (org_id, entity_type, entity_id, activity_type, subject, description) VALUES ($1,'contact',$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, req.params.contactId, activityType, subject, description]
  );
  res.status(201).json({ activity: rows[0] });
});

r.get('/contacts/:contactId/notes', async (req, res) => {
  const { rows } = await db.query(
    'SELECT n.*, u.full_name as created_by_name FROM crm_notes n LEFT JOIN users u ON u.id = n.created_by WHERE n.org_id = $1 AND n.contact_id = $2 ORDER BY n.pinned DESC, n.created_at DESC',
    [req.user.orgId, req.params.contactId]
  );
  res.json({ notes: rows });
});

r.post('/contacts/:contactId/notes', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const { rows } = await db.query(
    'INSERT INTO crm_notes (org_id, contact_id, content, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.orgId, req.params.contactId, content, req.user.id]
  );
  res.status(201).json({ note: rows[0] });
});

r.put('/notes/:id', async (req, res) => {
  const { content, pinned } = req.body;
  const { rows } = await db.query(
    'UPDATE crm_notes SET content = COALESCE($1, content), pinned = COALESCE($2, pinned), updated_at = NOW() WHERE id = $3 AND org_id = $4 RETURNING *',
    [content, pinned, req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Note not found' });
  res.json({ note: rows[0] });
});

r.delete('/notes/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM crm_notes WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Note not found' });
  res.json({ ok: true });
});

r.get('/deals/:dealId/activities', async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM crm_activities WHERE org_id = $1 AND entity_type = 'deal' AND entity_id = $2 ORDER BY created_at DESC LIMIT 50",
    [req.user.orgId, req.params.dealId]
  );
  res.json({ activities: rows });
});

r.post('/deals/:dealId/activities', async (req, res) => {
  const { activityType, subject, description } = req.body;
  const { rows } = await db.query(
    "INSERT INTO crm_activities (org_id, entity_type, entity_id, activity_type, subject, description) VALUES ($1,'deal',$2,$3,$4,$5) RETURNING *",
    [req.user.orgId, req.params.dealId, activityType, subject, description]
  );
  res.status(201).json({ activity: rows[0] });
});

module.exports = r;
