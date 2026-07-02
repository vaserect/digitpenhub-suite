const db = require('../db');

const STATUSES = ['todo', 'in_progress', 'done'];

async function listProjects(req, res) {
  const { rows } = await db.query(
    `SELECT p.id as project_id, p.name as project_name,
            t.id as task_id, t.title, t.status, t.sort_order
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.org_id = $1
     ORDER BY p.created_at, t.status, t.sort_order`,
    [req.user.orgId]
  );

  const byId = new Map();
  for (const row of rows) {
    if (!byId.has(row.project_id)) {
      byId.set(row.project_id, { id: row.project_id, name: row.project_name, tasks: [] });
    }
    if (row.task_id) {
      byId.get(row.project_id).tasks.push({
        id: row.task_id,
        title: row.title,
        status: row.status,
        sortOrder: row.sort_order,
      });
    }
  }

  res.json({ projects: [...byId.values()] });
}

async function createProject(req, res) {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO projects (org_id, name, created_by) VALUES ($1,$2,$3) RETURNING id, name`,
    [req.user.orgId, name, req.user.id]
  );
  res.status(201).json({ project: { ...rows[0], tasks: [] } });
}

async function updateProject(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `UPDATE projects SET name = $1 WHERE id = $2 AND org_id = $3 RETURNING id, name`,
    [name, id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project: rows[0] });
}

// Deleting a project cascades to its tasks at the database level (ON DELETE CASCADE in
// 002_crm_pm.sql) — no need to delete tasks separately here, Postgres handles it atomically.
async function deleteProject(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM projects WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
}

async function createTask(req, res) {
  const { projectId, title, status } = req.body || {};
  if (!projectId || !title) return res.status(400).json({ error: 'projectId and title are required.' });
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }

  // Confirm the project actually belongs to this org before attaching a task to it —
  // otherwise a guessed UUID from another org could be used to plant data cross-tenant.
  const owns = await db.query('SELECT 1 FROM projects WHERE id = $1 AND org_id = $2', [
    projectId,
    req.user.orgId,
  ]);
  if (!owns.rows.length) return res.status(404).json({ error: 'Project not found.' });

  const { rows } = await db.query(
    `INSERT INTO tasks (org_id, project_id, title, status, created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, title, status, sort_order`,
    [req.user.orgId, projectId, title, status || 'todo', req.user.id]
  );
  res.status(201).json({ task: rows[0] });
}

async function updateTask(req, res) {
  const { id } = req.params;
  const { status, title } = req.body || {};
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }

  const { rows } = await db.query(
    `UPDATE tasks
     SET status = COALESCE($1, status),
         title = COALESCE($2, title),
         updated_at = now()
     WHERE id = $3 AND org_id = $4
     RETURNING id, title, status, sort_order`,
    [status || null, title || null, id, req.user.orgId]
  );

  if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
  res.json({ task: rows[0] });
}

async function deleteTask(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM tasks WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
  res.json({ ok: true });
}

module.exports = {
  listProjects, createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask, STATUSES,
};
