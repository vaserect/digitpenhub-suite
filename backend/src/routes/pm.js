const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listProjects, createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
} = require('../controllers/pmController');

const router = express.Router();

router.get('/projects', requireAuth, listProjects);
router.post('/projects', requireAuth, createProject);
router.patch('/projects/:id', requireAuth, updateProject);
router.delete('/projects/:id', requireAuth, deleteProject);

router.post('/tasks', requireAuth, createTask);
router.patch('/tasks/:id', requireAuth, updateTask);
router.delete('/tasks/:id', requireAuth, deleteTask);

module.exports = router;
