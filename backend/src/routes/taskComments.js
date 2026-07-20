const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

r.get('/:taskId/comments', async (req, res) => {
  const { rows } = await db.query(
    'SELECT c.*, u.full_name as created_by_name FROM task_comments c LEFT JOIN users u ON u.id = c.created_by WHERE c.task_id = $1 AND c.org_id = $2 ORDER BY c.created_at DESC',
    [req.params.taskId, req.user.orgId]
  );
  res.json({ comments: rows });
});

r.post('/:taskId/comments', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const { rows } = await db.query(
    'INSERT INTO task_comments (task_id, org_id, content, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.params.taskId, req.user.orgId, content, req.user.id]
  );
  res.status(201).json({ comment: rows[0] });
});

r.get('/:taskId/attachments', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM task_attachments WHERE task_id = $1 AND org_id = $2 ORDER BY created_at DESC',
    [req.params.taskId, req.user.orgId]
  );
  res.json({ attachments: rows });
});

r.post('/:taskId/attachments', async (req, res) => {
  const { fileName, fileSize, fileUrl } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName required' });
  const { rows } = await db.query(
    'INSERT INTO task_attachments (task_id, org_id, file_name, file_size, file_url, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.params.taskId, req.user.orgId, fileName, fileSize || 0, fileUrl || null, req.user.id]
  );
  res.status(201).json({ attachment: rows[0] });
});

// Bulk update task stage (for drag-and-drop kanban)
r.patch('/bulk-stage', async (req, res) => {
  const { taskIds, stage } = req.body;
  if (!taskIds || !Array.isArray(taskIds) || !stage) return res.status(400).json({ error: 'taskIds array and stage required' });
  const { rowCount } = await db.query(
    'UPDATE tasks SET stage = $1, updated_at = NOW() WHERE id = ANY($2) AND org_id = $3::uuid',
    [stage, taskIds, req.user.orgId]
  );
  res.json({ updated: rowCount });
});

r.patch('/:id/stage', async (req, res) => {
  const { stage, sortOrder } = req.body;
  if (!stage) return res.status(400).json({ error: 'stage required' });
  await db.query(
    'UPDATE tasks SET stage = $1, sort_order = COALESCE($2, sort_order), updated_at = NOW() WHERE id = $3::uuid AND org_id = $4',
    [stage, sortOrder, req.params.id, req.user.orgId]
  );
  res.json({ ok: true });
});

module.exports = r;
