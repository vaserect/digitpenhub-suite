const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const {
  listProjects, createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
  exportProjects, exportTasks, projectStats, taskStats,
} = require('../controllers/pmController');

const router = express.Router();

// ── Projects ───────────────────────────────────────────────────────────────
router.get('/projects', requireAuth, listProjects);
router.post('/projects', requireAuth, createProject);
router.patch('/projects/:id', requireAuth, updateProject);
router.delete('/projects/:id', requireAuth, deleteProject);
router.post('/projects/bulk-delete', requireAuth, bulkDeleteHandler('projects'));

router.get('/projects/export', requireAuth, exportProjects);
router.get('/projects/stats', requireAuth, projectStats);

// ── Tasks ──────────────────────────────────────────────────────────────────
router.post('/tasks', requireAuth, createTask);
router.patch('/tasks/:id', requireAuth, updateTask);
router.delete('/tasks/:id', requireAuth, deleteTask);
router.post('/tasks/bulk-delete', requireAuth, bulkDeleteHandler('tasks'));

router.get('/tasks/export', requireAuth, exportTasks);
router.get('/tasks/stats', requireAuth, taskStats);

module.exports = router;
