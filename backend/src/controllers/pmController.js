const db = require('../db');
const ProjectService = require('../services/pm/ProjectService');
const TaskService = require('../services/pm/TaskService');

const STATUSES = ['todo', 'in_progress', 'done'];

async function listProjects(req, res) {
  try {
    const projects = await ProjectService.findAllWithStats(req.user.orgId);
    res.json({ projects });
  } catch (err) {
    throw err;
  }
}

async function createProject(req, res) {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  try {
    const project = await ProjectService.create({ name }, req.user.orgId, req.user.id);
    res.status(201).json({ project });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

async function updateProject(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  try {
    const project = await ProjectService.update(id, { name }, req.user.orgId, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;
  const deleted = await ProjectService.delete(id, req.user.orgId, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
}

async function createTask(req, res) {
  const { project_id: projectId, title, status } = req.body || {};
  if (!projectId || !title) return res.status(400).json({ error: 'projectId and title are required.' });
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }

  try {
    const task = await TaskService.create({ project_id: projectId, title, status: status || 'todo' }, req.user.orgId, req.user.id);
    res.status(201).json({ task });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not belong')) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    throw err;
  }
}

async function updateTask(req, res) {
  const { id } = req.params;
  const { status, title } = req.body || {};
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }

  try {
    const updates = {};
    if (status) updates.status = status;
    if (title) updates.title = title;
    const task = await TaskService.update(id, updates, req.user.orgId, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    throw err;
  }
}

async function deleteTask(req, res) {
  const { id } = req.params;
  const deleted = await TaskService.delete(id, req.user.orgId, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found.' });
  res.json({ ok: true });
}

module.exports = {
  listProjects, createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask, STATUSES,
};
