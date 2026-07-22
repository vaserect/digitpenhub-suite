const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  listProjects, createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
} = require('../controllers/pmController');

const router = express.Router();

router.get('/projects', requireAuth, listProjects);
router.post('/projects', requireAuth, createProject);
router.patch('/projects/:id', requireAuth, updateProject);
router.delete('/projects/:id', requireAuth, deleteProject);
router.post('/projects/bulk-delete', requireAuth, bulkDeleteHandler('projects'));
router.get('/projects/export', requireAuth, async (req, res) => { const { rows } = await db.query('SELECT id, name, created_at FROM projects WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'projects.csv', rows, autoColumns(rows)); });
router.get('/projects/stats', requireAuth, async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM projects WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });

router.post('/tasks', requireAuth, createTask);
router.patch('/tasks/:id', requireAuth, updateTask);
router.delete('/tasks/:id', requireAuth, deleteTask);
router.post('/tasks/bulk-delete', requireAuth, bulkDeleteHandler('tasks'));
router.get('/tasks/export', requireAuth, async (req, res) => { const { rows } = await db.query('SELECT id, project_id, title, created_at FROM tasks WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'tasks.csv', rows, autoColumns(rows)); });
router.get('/tasks/stats', requireAuth, async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM tasks WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
