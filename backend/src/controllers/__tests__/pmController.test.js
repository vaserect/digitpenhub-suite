const { listProjects, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask } = require('../pmController');
const db = require('../../db');

// Mock database module
jest.mock('../../db');

describe('PM Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Create fresh mock request and response objects for each test
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('listProjects', () => {
    it('should return projects with nested tasks', async () => {
      const mockRows = [
        { 
          project_id: 'p1', 
          project_name: 'Project Alpha', 
          task_id: 't1', 
          title: 'Task 1', 
          status: 'todo', 
          sort_order: 0 
        },
        { 
          project_id: 'p1', 
          project_name: 'Project Alpha', 
          task_id: 't2', 
          title: 'Task 2', 
          status: 'in_progress', 
          sort_order: 1 
        },
        { 
          project_id: 'p2', 
          project_name: 'Project Beta', 
          task_id: 't3', 
          title: 'Task 3', 
          status: 'done', 
          sort_order: 0 
        }
      ];
      db.query.mockResolvedValue({ rows: mockRows });

      await listProjects(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.id as project_id'),
        [req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({
        projects: expect.arrayContaining([
          expect.objectContaining({
            id: 'p1',
            name: 'Project Alpha',
            tasks: expect.arrayContaining([
              expect.objectContaining({ id: 't1', title: 'Task 1', status: 'todo' }),
              expect.objectContaining({ id: 't2', title: 'Task 2', status: 'in_progress' })
            ])
          }),
          expect.objectContaining({
            id: 'p2',
            name: 'Project Beta',
            tasks: expect.arrayContaining([
              expect.objectContaining({ id: 't3', title: 'Task 3', status: 'done' })
            ])
          })
        ])
      });
    });

    it('should handle projects without tasks', async () => {
      const mockRows = [
        { 
          project_id: 'p1', 
          project_name: 'Empty Project', 
          task_id: null, 
          title: null, 
          status: null, 
          sort_order: null 
        }
      ];
      db.query.mockResolvedValue({ rows: mockRows });

      await listProjects(req, res);

      expect(res.json).toHaveBeenCalledWith({
        projects: [
          { id: 'p1', name: 'Empty Project', tasks: [] }
        ]
      });
    });

    it('should return empty array when no projects exist', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await listProjects(req, res);

      expect(res.json).toHaveBeenCalledWith({ projects: [] });
    });

    it('should filter by org_id', async () => {
      req.user.orgId = 'specific-org-id';
      db.query.mockResolvedValue({ rows: [] });

      await listProjects(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['specific-org-id']
      );
    });
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      req.body = { name: 'New Project' };
      const mockProject = { id: 'p-new', name: 'New Project' };
      db.query.mockResolvedValue({ rows: [mockProject] });

      await createProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        [req.user.orgId, 'New Project', req.user.id]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        project: { ...mockProject, tasks: [] }
      });
    });

    it('should return 400 if name is missing', async () => {
      req.body = {};

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'name is required.'
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should return 400 if name is null', async () => {
      req.body = { name: null };

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'name is required.'
      });
    });

    it('should return 400 if name is empty string', async () => {
      req.body = { name: '' };

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'name is required.'
      });
    });

    it('should use correct user and org IDs', async () => {
      req.user = { id: 'user-123', orgId: 'org-456' };
      req.body = { name: 'Test Project' };
      db.query.mockResolvedValue({ rows: [{ id: 'p1', name: 'Test Project' }] });

      await createProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['org-456', 'Test Project', 'user-123']
      );
    });
  });

  describe('updateProject', () => {
    it('should update project name successfully', async () => {
      req.params = { id: 'p1' };
      req.body = { name: 'Updated Name' };
      const mockProject = { id: 'p1', name: 'Updated Name' };
      db.query.mockResolvedValue({ rows: [mockProject] });

      await updateProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects'),
        ['Updated Name', 'p1', req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({ project: mockProject });
    });

    it('should return 404 if project not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { name: 'Updated Name' };
      db.query.mockResolvedValue({ rows: [] });

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project not found.'
      });
    });

    it('should return 400 if name is missing', async () => {
      req.params = { id: 'p1' };
      req.body = {};

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'name is required.'
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should enforce org_id isolation', async () => {
      req.params = { id: 'p1' };
      req.body = { name: 'Updated Name' };
      req.user.orgId = 'org-123';
      db.query.mockResolvedValue({ rows: [] });

      await updateProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['Updated Name', 'p1', 'org-123']
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      req.params = { id: 'p1' };
      db.query.mockResolvedValue({ rows: [{ id: 'p1' }] });

      await deleteProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects'),
        ['p1', req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should return 404 if project not found', async () => {
      req.params = { id: 'nonexistent' };
      db.query.mockResolvedValue({ rows: [] });

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project not found.'
      });
    });

    it('should enforce org_id isolation', async () => {
      req.params = { id: 'p1' };
      req.user.orgId = 'org-123';
      db.query.mockResolvedValue({ rows: [] });

      await deleteProject(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['p1', 'org-123']
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      req.body = { projectId: 'p1', title: 'New Task', status: 'todo' };
      
      // Mock project ownership check
      db.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Project exists
        .mockResolvedValueOnce({ rows: [{ id: 't1', title: 'New Task', status: 'todo', sort_order: 0 }] }); // Task created

      await createTask(req, res);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT 1 FROM projects'),
        ['p1', req.user.orgId]
      );
      expect(db.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO tasks'),
        [req.user.orgId, 'p1', 'New Task', 'todo', req.user.id]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        task: expect.objectContaining({ id: 't1', title: 'New Task', status: 'todo' })
      });
    });

    it('should default to todo status if not provided', async () => {
      req.body = { projectId: 'p1', title: 'New Task' };
      
      db.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] })
        .mockResolvedValueOnce({ rows: [{ id: 't1', title: 'New Task', status: 'todo', sort_order: 0 }] });

      await createTask(req, res);

      expect(db.query).toHaveBeenNthCalledWith(2,
        expect.any(String),
        [req.user.orgId, 'p1', 'New Task', 'todo', req.user.id]
      );
    });

    it('should return 400 if projectId is missing', async () => {
      req.body = { title: 'New Task' };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'projectId and title are required.'
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should return 400 if title is missing', async () => {
      req.body = { projectId: 'p1' };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'projectId and title are required.'
      });
    });

    it('should return 400 if status is invalid', async () => {
      req.body = { projectId: 'p1', title: 'New Task', status: 'invalid_status' };

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'status must be one of: todo, in_progress, done'
      });
    });

    it('should return 404 if project does not belong to org', async () => {
      req.body = { projectId: 'p1', title: 'New Task' };
      db.query.mockResolvedValueOnce({ rows: [] }); // Project not found

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Project not found.'
      });
      expect(db.query).toHaveBeenCalledTimes(1); // Only ownership check
    });

    it('should validate project ownership before creating task', async () => {
      req.body = { projectId: 'other-org-project', title: 'Malicious Task' };
      req.user.orgId = 'org-123';
      db.query.mockResolvedValueOnce({ rows: [] }); // Project doesn't belong to org

      await createTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM projects'),
        ['other-org-project', 'org-123']
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateTask', () => {
    it('should update task status', async () => {
      req.params = { id: 't1' };
      req.body = { status: 'in_progress' };
      const mockTask = { id: 't1', title: 'Task 1', status: 'in_progress', sort_order: 0 };
      db.query.mockResolvedValue({ rows: [mockTask] });

      await updateTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks'),
        ['in_progress', null, 't1', req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({ task: mockTask });
    });

    it('should update task title', async () => {
      req.params = { id: 't1' };
      req.body = { title: 'Updated Title' };
      const mockTask = { id: 't1', title: 'Updated Title', status: 'todo', sort_order: 0 };
      db.query.mockResolvedValue({ rows: [mockTask] });

      await updateTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [null, 'Updated Title', 't1', req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({ task: mockTask });
    });

    it('should update both status and title', async () => {
      req.params = { id: 't1' };
      req.body = { status: 'done', title: 'Completed Task' };
      const mockTask = { id: 't1', title: 'Completed Task', status: 'done', sort_order: 0 };
      db.query.mockResolvedValue({ rows: [mockTask] });

      await updateTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['done', 'Completed Task', 't1', req.user.orgId]
      );
    });

    it('should return 400 if status is invalid', async () => {
      req.params = { id: 't1' };
      req.body = { status: 'invalid_status' };

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'status must be one of: todo, in_progress, done'
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should return 404 if task not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { status: 'done' };
      db.query.mockResolvedValue({ rows: [] });

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Task not found.'
      });
    });

    it('should enforce org_id isolation', async () => {
      req.params = { id: 't1' };
      req.body = { status: 'done' };
      req.user.orgId = 'org-123';
      db.query.mockResolvedValue({ rows: [] });

      await updateTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['done', null, 't1', 'org-123']
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      req.params = { id: 't1' };
      db.query.mockResolvedValue({ rows: [{ id: 't1' }] });

      await deleteTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tasks'),
        ['t1', req.user.orgId]
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should return 404 if task not found', async () => {
      req.params = { id: 'nonexistent' };
      db.query.mockResolvedValue({ rows: [] });

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Task not found.'
      });
    });

    it('should enforce org_id isolation', async () => {
      req.params = { id: 't1' };
      req.user.orgId = 'org-123';
      db.query.mockResolvedValue({ rows: [] });

      await deleteTask(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['t1', 'org-123']
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should always filter by org_id in all operations', async () => {
      const orgId = 'secure-org-id';
      req.user.orgId = orgId;

      // Test listProjects
      db.query.mockResolvedValue({ rows: [] });
      await listProjects(req, res);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [orgId]);

      // Test createProject
      req.body = { name: 'Test' };
      db.query.mockResolvedValue({ rows: [{ id: 'p1', name: 'Test' }] });
      await createProject(req, res);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [orgId, 'Test', req.user.id]);

      // Test updateProject
      req.params = { id: 'p1' };
      db.query.mockResolvedValue({ rows: [{ id: 'p1', name: 'Test' }] });
      await updateProject(req, res);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['Test', 'p1', orgId]);

      // Test deleteProject
      db.query.mockResolvedValue({ rows: [{ id: 'p1' }] });
      await deleteProject(req, res);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['p1', orgId]);
    });
  });
});
