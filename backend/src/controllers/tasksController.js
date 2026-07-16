const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { buildUpdateQuery, escapeLikePattern } = require('../utils/queryBuilder');
const bulkDeleteTasks = bulkDeleteHandler('task_items');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='todo')::int AS todo,
       COUNT(*) FILTER(WHERE status='in_progress')::int AS in_progress,
       COUNT(*) FILTER(WHERE status='done')::int AS done,
       COUNT(*) FILTER(WHERE due_date<CURRENT_DATE AND status!='done')::int AS overdue
     FROM task_items WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json(rows[0]);
}

async function listTasks(req, res) {
  const { status, priority, assignee } = req.query;
  const conditions = ['org_id=$1'];
  const vals = [req.user.orgId];
  let i = 2;
  
  if (status) {
    conditions.push(`status=$${i++}`);
    vals.push(status);
  }
  
  if (priority) {
    conditions.push(`priority=$${i++}`);
    vals.push(priority);
  }
  
  // FIXED: Use escapeLikePattern to prevent pattern injection
  if (assignee) {
    conditions.push(`assignee ILIKE $${i++}`);
    vals.push(`%${escapeLikePattern(assignee)}%`);
  }
  
  const { rows } = await db.query(
    `SELECT * FROM task_items WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    vals
  );
  res.json({ tasks: rows });
}

async function createTask(req, res) {
  const { title, description, status, priority, dueDate, assignee, label } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  
  const { rows } = await db.query(
    `INSERT INTO task_items (org_id,title,description,status,priority,due_date,assignee,label) 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      req.user.orgId,
      title.trim(),
      description || null,
      status || 'todo',
      priority || 'medium',
      dueDate || null,
      assignee || null,
      label || null
    ]
  );
  res.status(201).json({ task: rows[0] });
}

async function updateTask(req, res) {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, assignee, label } = req.body || {};
  
  // FIXED: Use buildUpdateQuery helper to prevent SQL injection
  const updates = {};
  
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description || null;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.due_date = dueDate || null;
  if (assignee !== undefined) updates.assignee = assignee || null;
  if (label !== undefined) updates.label = label || null;
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }
  
  // Add updated_at timestamp
  updates.updated_at = db.raw('NOW()');
  
  try {
    const { query, values } = buildUpdateQuery(
      'task_items',
      updates,
      { id, org_id: req.user.orgId }
    );
    
    const { rows } = await db.query(query, values);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found.' });
    }
    
    res.json({ task: rows[0] });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}

async function deleteTask(req, res) {
  await db.query(
    `DELETE FROM task_items WHERE id=$1 AND org_id=$2`,
    [req.params.id, req.user.orgId]
  );
  res.json({ ok: true });
}

async function listComments(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM task_item_comments WHERE task_id=$1 AND org_id=$2 ORDER BY created_at`,
    [req.params.id, req.user.orgId]
  );
  res.json({ comments: rows });
}

async function addComment(req, res) {
  const { author, body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  
  const { rows } = await db.query(
    `INSERT INTO task_item_comments (org_id,task_id,author,body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, req.params.id, author || 'You', body.trim()]
  );
  res.status(201).json({ comment: rows[0] });
}

async function exportTasks(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM task_items WHERE org_id=$1 ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'tasks.csv', rows, autoColumns(rows));
}

module.exports = {
  getStats,
  listTasks,
  exportTasks,
  createTask,
  updateTask,
  deleteTask,
  listComments,
  addComment,
  bulkDeleteTasks
};
