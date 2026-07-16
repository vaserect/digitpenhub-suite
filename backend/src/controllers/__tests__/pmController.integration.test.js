const request = require('supertest');
const express = require('express');
const pmController = require('../pmController.refactored');
const ProjectService = require('../../services/pm/ProjectService');
const TaskService = require('../../services/pm/TaskService');

// Mock the services
jest.mock('../../services/pm/ProjectService');
jest.mock('../../services/pm/TaskService');

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: 'user-123',
    orgId: 'org-123',
    email: 'test@example.com',
  };
  next();
};

// Setup routes
app.get('/api/v1/pm/projects', mockAuth, pmController.listProjects);
app.post('/api/v1/pm/projects', mockAuth, pmController.createProject);
app.put('/api/v1/pm/projects/:id', mockAuth, pmController.updateProject);
app.delete('/api/v1/pm/projects/:id', mockAuth, pmController.deleteProject);
app.post('/api/v1/pm/tasks', mockAuth, pmController.createTask);
app.put('/api/v1/pm/tasks/:id', mockAuth, pmController.updateTask);
app.delete('/api/v1/pm/tasks/:id', mockAuth, pmController.deleteTask);

describe('PM Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/pm/projects', () => {
    it('should list all projects with tasks', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1' },
        { id: 'proj-2', name: 'Project 2' },
      ];

      const mockTasks1 = [
        { id: 'task-1', title: 'Task 1', status: 'todo', sort_order: 0 },
        { id: 'task-2', title: 'Task 2', status: 'done', sort_order: 1 },
      ];

      const mockTasks2 = [
        { id: 'task-3', title: 'Task 3', status: 'in_progress', sort_order: 0 },
      ];

      ProjectService.findAllWithStats = jest.fn().mockResolvedValue(mockProjects);
      TaskService.findByProject = jest
        .fn()
        .mockResolvedValueOnce(mockTasks1)
        .mockResolvedValueOnce(mockTasks2);

      const response = await request(app).get('/api/v1/pm/projects');

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(2);
      expect(response.body.projects[0].name).toBe('Project 1');
      expect(response.body.projects[0].tasks).toHaveLength(2);
      expect(response.body.projects[1].tasks).toHaveLength(1);
      expect(ProjectService.findAllWithStats).toHaveBeenCalledWith('org-123');
      expect(TaskService.findByProject).toHaveBeenCalledTimes(2);
    });

    it('should handle empty projects list', async () => {
      ProjectService.findAllWithStats = jest.fn().mockResolvedValue([]);

      const response = await request(app).get('/api/v1/pm/projects');

      expect(response.status).toBe(200);
      expect(response.body.projects).toEqual([]);
    });

    it('should handle service errors', async () => {
      ProjectService.findAllWithStats = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/pm/projects');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to list projects');
    });
  });

  describe('POST /api/v1/pm/projects', () => {
    it('should create a new project', async () => {
      const mockProject = {
        id: 'proj-123',
        name: 'New Project',
      };

      ProjectService.create = jest.fn().mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/v1/pm/projects')
        .send({ name: 'New Project' });

      expect(response.status).toBe(201);
      expect(response.body.project.id).toBe('proj-123');
      expect(response.body.project.name).toBe('New Project');
      expect(response.body.project.tasks).toEqual([]);
      expect(ProjectService.create).toHaveBeenCalledWith(
        { name: 'New Project' },
        'org-123',
        'user-123'
      );
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app).post('/api/v1/pm/projects').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('name is required.');
      expect(ProjectService.create).not.toHaveBeenCalled();
    });

    it('should return 409 for duplicate project name', async () => {
      ProjectService.create = jest
        .fn()
        .mockRejectedValue(new Error('Project with this name already exists'));

      const response = await request(app)
        .post('/api/v1/pm/projects')
        .send({ name: 'Duplicate' });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for validation errors', async () => {
      ProjectService.create = jest
        .fn()
        .mockRejectedValue(new Error('Project name must be at least 3 characters'));

      const response = await request(app)
        .post('/api/v1/pm/projects')
        .send({ name: 'AB' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be at least');
    });
  });

  describe('PUT /api/v1/pm/projects/:id', () => {
    it('should update a project', async () => {
      const mockProject = {
        id: 'proj-123',
        name: 'Updated Project',
      };

      ProjectService.update = jest.fn().mockResolvedValue(mockProject);

      const response = await request(app)
        .put('/api/v1/pm/projects/proj-123')
        .send({ name: 'Updated Project' });

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe('Updated Project');
      expect(ProjectService.update).toHaveBeenCalledWith(
        'proj-123',
        { name: 'Updated Project' },
        'org-123',
        'user-123'
      );
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .put('/api/v1/pm/projects/proj-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('name is required.');
    });

    it('should return 404 if project not found', async () => {
      ProjectService.update = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/pm/projects/non-existent')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found.');
    });

    it('should return 409 for duplicate name', async () => {
      ProjectService.update = jest
        .fn()
        .mockRejectedValue(new Error('Project with this name already exists'));

      const response = await request(app)
        .put('/api/v1/pm/projects/proj-123')
        .send({ name: 'Duplicate' });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('DELETE /api/v1/pm/projects/:id', () => {
    it('should delete a project', async () => {
      ProjectService.delete = jest.fn().mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/pm/projects/proj-123');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(ProjectService.delete).toHaveBeenCalledWith(
        'proj-123',
        'org-123',
        'user-123'
      );
    });

    it('should return 404 if project not found', async () => {
      ProjectService.delete = jest.fn().mockResolvedValue(false);

      const response = await request(app).delete('/api/v1/pm/projects/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found.');
    });

    it('should handle service errors', async () => {
      ProjectService.delete = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/v1/pm/projects/proj-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete project');
    });
  });

  describe('POST /api/v1/pm/tasks', () => {
    it('should create a new task', async () => {
      const mockProject = { id: 'proj-123', name: 'Project' };
      const mockTask = {
        id: 'task-123',
        title: 'New Task',
        status: 'todo',
        sort_order: 0,
      };

      ProjectService.findById = jest.fn().mockResolvedValue(mockProject);
      TaskService.create = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'proj-123', title: 'New Task' });

      expect(response.status).toBe(201);
      expect(response.body.task.id).toBe('task-123');
      expect(response.body.task.title).toBe('New Task');
      expect(response.body.task.status).toBe('todo');
      expect(ProjectService.findById).toHaveBeenCalledWith('proj-123', 'org-123');
      expect(TaskService.create).toHaveBeenCalledWith(
        { project_id: 'proj-123', title: 'New Task', status: 'todo' },
        'org-123',
        'user-123'
      );
    });

    it('should create task with custom status', async () => {
      const mockProject = { id: 'proj-123', name: 'Project' };
      const mockTask = {
        id: 'task-123',
        title: 'New Task',
        status: 'in_progress',
        sort_order: 0,
      };

      ProjectService.findById = jest.fn().mockResolvedValue(mockProject);
      TaskService.create = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'proj-123', title: 'New Task', status: 'in_progress' });

      expect(response.status).toBe(201);
      expect(response.body.task.status).toBe('in_progress');
    });

    it('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ title: 'Task' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('projectId and title are required.');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'proj-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('projectId and title are required.');
    });

    it('should return 404 if project not found', async () => {
      ProjectService.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'non-existent', title: 'Task' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found.');
      expect(TaskService.create).not.toHaveBeenCalled();
    });

    it('should return 400 for validation errors', async () => {
      const mockProject = { id: 'proj-123', name: 'Project' };

      ProjectService.findById = jest.fn().mockResolvedValue(mockProject);
      TaskService.create = jest
        .fn()
        .mockRejectedValue(new Error('Task title must be at least 3 characters'));

      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'proj-123', title: 'AB' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be at least');
    });

    it('should return 400 for invalid status', async () => {
      const mockProject = { id: 'proj-123', name: 'Project' };

      ProjectService.findById = jest.fn().mockResolvedValue(mockProject);
      TaskService.create = jest
        .fn()
        .mockRejectedValue(new Error('Status must be one of: todo, in_progress, done'));

      const response = await request(app)
        .post('/api/v1/pm/tasks')
        .send({ projectId: 'proj-123', title: 'Task', status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Status must be one of');
    });
  });

  describe('PUT /api/v1/pm/tasks/:id', () => {
    it('should update a task', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Updated Task',
        status: 'in_progress',
        sort_order: 0,
      };

      TaskService.update = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .put('/api/v1/pm/tasks/task-123')
        .send({ title: 'Updated Task', status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.task.title).toBe('Updated Task');
      expect(response.body.task.status).toBe('in_progress');
      expect(TaskService.update).toHaveBeenCalledWith(
        'task-123',
        { status: 'in_progress', title: 'Updated Task' },
        'org-123',
        'user-123'
      );
    });

    it('should update only title', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Updated Title',
        status: 'todo',
        sort_order: 0,
      };

      TaskService.update = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .put('/api/v1/pm/tasks/task-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.task.title).toBe('Updated Title');
    });

    it('should update only status', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Task',
        status: 'done',
        sort_order: 0,
      };

      TaskService.update = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .put('/api/v1/pm/tasks/task-123')
        .send({ status: 'done' });

      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe('done');
    });

    it('should return 404 if task not found', async () => {
      TaskService.update = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/pm/tasks/non-existent')
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found.');
    });

    it('should return 400 for validation errors', async () => {
      TaskService.update = jest
        .fn()
        .mockRejectedValue(new Error('Task title must be at least 3 characters'));

      const response = await request(app)
        .put('/api/v1/pm/tasks/task-123')
        .send({ title: 'AB' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be at least');
    });

    it('should return 400 for invalid status', async () => {
      TaskService.update = jest
        .fn()
        .mockRejectedValue(new Error('Status must be one of: todo, in_progress, done'));

      const response = await request(app)
        .put('/api/v1/pm/tasks/task-123')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Status must be one of');
    });
  });

  describe('DELETE /api/v1/pm/tasks/:id', () => {
    it('should delete a task', async () => {
      TaskService.delete = jest.fn().mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/pm/tasks/task-123');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(TaskService.delete).toHaveBeenCalledWith(
        'task-123',
        'org-123',
        'user-123'
      );
    });

    it('should return 404 if task not found', async () => {
      TaskService.delete = jest.fn().mockResolvedValue(false);

      const response = await request(app).delete('/api/v1/pm/tasks/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found.');
    });

    it('should handle service errors', async () => {
      TaskService.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/v1/pm/tasks/task-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete task');
    });
  });

  describe('STATUSES constant', () => {
    it('should export STATUSES for backward compatibility', () => {
      expect(pmController.STATUSES).toEqual(['todo', 'in_progress', 'done']);
    });
  });
});
