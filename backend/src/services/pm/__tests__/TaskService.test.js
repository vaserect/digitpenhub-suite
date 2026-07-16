const TaskService = require('../TaskService');
const TaskRepository = require('../../../repositories/TaskRepository');

// Mock the repository
jest.mock('../../../repositories/TaskRepository');

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the repository mock
    TaskService.repository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByIdWithProject: jest.fn(),
      findByProject: jest.fn(),
      getStatsByStatus: jest.fn(),
      updateStatus: jest.fn(),
      reorder: jest.fn(),
      moveToProject: jest.fn(),
      findByCreator: jest.fn(),
      search: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      deleteByProject: jest.fn(),
      getNextSortOrder: jest.fn(),
    };
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: '123',
        project_id: 'proj-1',
        title: 'New Task',
        status: 'todo',
        sort_order: 0,
      };

      TaskService.repository.getNextSortOrder = jest.fn().mockResolvedValue(0);
      TaskService.repository.create = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.create(
        { project_id: 'proj-1', title: 'New Task' },
        'org-1',
        'user-1'
      );

      expect(result.title).toBe('New Task');
      expect(result.is_todo).toBe(true);
      expect(result.can_start).toBe(true);
      expect(TaskService.repository.create).toHaveBeenCalled();
    });

    it('should throw error if title is missing', async () => {
      await expect(
        TaskService.create({ project_id: 'proj-1' }, 'org-1', 'user-1')
      ).rejects.toThrow('Task title is required');
    });

    it('should throw error if title is too short', async () => {
      await expect(
        TaskService.create(
          { project_id: 'proj-1', title: 'AB' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Task title must be at least 3 characters');
    });

    it('should throw error if title is too long', async () => {
      const longTitle = 'A'.repeat(501);
      await expect(
        TaskService.create(
          { project_id: 'proj-1', title: longTitle },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Task title must not exceed 500 characters');
    });

    it('should throw error if project_id is missing', async () => {
      await expect(
        TaskService.create({ title: 'Task' }, 'org-1', 'user-1')
      ).rejects.toThrow('Project ID is required');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        TaskService.create(
          { project_id: 'proj-1', title: 'Task', status: 'invalid' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Status must be one of');
    });

    it('should throw error for negative sort order', async () => {
      await expect(
        TaskService.create(
          { project_id: 'proj-1', title: 'Task', sort_order: -1 },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Sort order cannot be negative');
    });

    it('should get next sort order if not provided', async () => {
      const mockTask = { id: '123', sort_order: 5 };

      TaskService.repository.getNextSortOrder = jest.fn().mockResolvedValue(5);
      TaskService.repository.create = jest.fn().mockResolvedValue(mockTask);

      await TaskService.create(
        { project_id: 'proj-1', title: 'Task' },
        'org-1',
        'user-1'
      );

      expect(TaskService.repository.getNextSortOrder).toHaveBeenCalledWith(
        'proj-1',
        'org-1'
      );
    });

    it('should trim task title', async () => {
      const mockTask = { id: '123', title: 'Trimmed Task' };

      TaskService.repository.getNextSortOrder = jest.fn().mockResolvedValue(0);
      TaskService.repository.create = jest.fn().mockResolvedValue(mockTask);

      await TaskService.create(
        { project_id: 'proj-1', title: '  Trimmed Task  ' },
        'org-1',
        'user-1'
      );

      const createCall = TaskService.repository.create.mock.calls[0];
      expect(createCall[0].title).toBe('Trimmed Task');
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const mockTask = {
        id: '123',
        title: 'Updated Task',
        status: 'in_progress',
      };

      TaskService.repository.update = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.update(
        '123',
        { title: 'Updated Task' },
        'org-1',
        'user-1'
      );

      expect(result.title).toBe('Updated Task');
      expect(TaskService.repository.update).toHaveBeenCalled();
    });

    it('should return null if task not found', async () => {
      TaskService.repository.update = jest.fn().mockResolvedValue(null);

      const result = await TaskService.update(
        'non-existent',
        { title: 'Updated' },
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });

    it('should validate title length on update', async () => {
      await expect(
        TaskService.update('123', { title: 'AB' }, 'org-1', 'user-1')
      ).rejects.toThrow('Task title must be at least 3 characters');
    });

    it('should validate status on update', async () => {
      await expect(
        TaskService.update('123', { status: 'invalid' }, 'org-1', 'user-1')
      ).rejects.toThrow('Status must be one of');
    });
  });

  describe('findByIdWithProject', () => {
    it('should find task with project info', async () => {
      const mockTask = {
        id: '123',
        title: 'Test Task',
        project_name: 'Test Project',
        status: 'todo',
      };

      TaskService.repository.findByIdWithProject = jest
        .fn()
        .mockResolvedValue(mockTask);

      const result = await TaskService.findByIdWithProject('123', 'org-1');

      expect(result.title).toBe('Test Task');
      expect(result.project_name).toBe('Test Project');
      expect(result.is_todo).toBe(true);
    });

    it('should return null if task not found', async () => {
      TaskService.repository.findByIdWithProject = jest.fn().mockResolvedValue(null);

      const result = await TaskService.findByIdWithProject('non-existent', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('findByProject', () => {
    it('should find all tasks for a project', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo' },
        { id: '2', title: 'Task 2', status: 'done' },
      ];

      TaskService.repository.findByProject = jest.fn().mockResolvedValue(mockTasks);

      const result = await TaskService.findByProject('proj-1', 'org-1');

      expect(result).toHaveLength(2);
      expect(result[0].is_todo).toBe(true);
      expect(result[1].is_done).toBe(true);
    });

    it('should pass options to repository', async () => {
      TaskService.repository.findByProject = jest.fn().mockResolvedValue([]);

      await TaskService.findByProject('proj-1', 'org-1', { status: 'done' });

      expect(TaskService.repository.findByProject).toHaveBeenCalledWith(
        'proj-1',
        'org-1',
        { status: 'done' }
      );
    });
  });

  describe('getStatistics', () => {
    it('should get task statistics', async () => {
      const mockStats = {
        todo: 5,
        in_progress: 3,
        done: 12,
        total: 20,
      };

      TaskService.repository.getStatsByStatus = jest.fn().mockResolvedValue(mockStats);

      const result = await TaskService.getStatistics('proj-1', 'org-1');

      expect(result.total).toBe(20);
      expect(result.completion_percentage).toBe(60);
      expect(result.remaining).toBe(8);
    });

    it('should handle zero tasks', async () => {
      const mockStats = {
        todo: 0,
        in_progress: 0,
        done: 0,
        total: 0,
      };

      TaskService.repository.getStatsByStatus = jest.fn().mockResolvedValue(mockStats);

      const result = await TaskService.getStatistics('proj-1', 'org-1');

      expect(result.completion_percentage).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const mockTask = { id: '123', status: 'in_progress' };

      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.updateStatus(
        '123',
        'in_progress',
        'org-1',
        'user-1'
      );

      expect(result.status).toBe('in_progress');
      expect(result.is_in_progress).toBe(true);
    });

    it('should throw error for invalid status', async () => {
      await expect(
        TaskService.updateStatus('123', 'invalid', 'org-1', 'user-1')
      ).rejects.toThrow('Invalid status');
    });

    it('should return null if task not found', async () => {
      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(null);

      const result = await TaskService.updateStatus(
        'non-existent',
        'done',
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('status transitions', () => {
    it('should start a task', async () => {
      const mockTask = { id: '123', status: 'in_progress' };

      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.start('123', 'org-1', 'user-1');

      expect(result.is_in_progress).toBe(true);
      expect(TaskService.repository.updateStatus).toHaveBeenCalledWith(
        '123',
        'in_progress',
        'org-1'
      );
    });

    it('should complete a task', async () => {
      const mockTask = { id: '123', status: 'done' };

      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.complete('123', 'org-1', 'user-1');

      expect(result.is_done).toBe(true);
      expect(TaskService.repository.updateStatus).toHaveBeenCalledWith(
        '123',
        'done',
        'org-1'
      );
    });

    it('should reopen a task', async () => {
      const mockTask = { id: '123', status: 'todo' };

      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.reopen('123', 'org-1', 'user-1');

      expect(result.is_todo).toBe(true);
      expect(TaskService.repository.updateStatus).toHaveBeenCalledWith(
        '123',
        'todo',
        'org-1'
      );
    });
  });

  describe('reorder', () => {
    it('should reorder tasks', async () => {
      const taskOrders = [
        { id: '1', sort_order: 0 },
        { id: '2', sort_order: 1 },
        { id: '3', sort_order: 2 },
      ];

      TaskService.repository.reorder = jest.fn().mockResolvedValue(true);

      const result = await TaskService.reorder(
        'proj-1',
        taskOrders,
        'org-1',
        'user-1'
      );

      expect(result).toBe(true);
      expect(TaskService.repository.reorder).toHaveBeenCalledWith(
        'proj-1',
        taskOrders,
        'org-1'
      );
    });

    it('should throw error for empty array', async () => {
      await expect(
        TaskService.reorder('proj-1', [], 'org-1', 'user-1')
      ).rejects.toThrow('Task orders must be a non-empty array');
    });

    it('should throw error for invalid task order', async () => {
      const taskOrders = [{ id: '1' }]; // Missing sort_order

      await expect(
        TaskService.reorder('proj-1', taskOrders, 'org-1', 'user-1')
      ).rejects.toThrow('Each task order must have id and sort_order');
    });

    it('should throw error for negative sort order', async () => {
      const taskOrders = [{ id: '1', sort_order: -1 }];

      await expect(
        TaskService.reorder('proj-1', taskOrders, 'org-1', 'user-1')
      ).rejects.toThrow('Sort order cannot be negative');
    });
  });

  describe('moveToProject', () => {
    it('should move task to different project', async () => {
      const mockTask = { id: '123', project_id: 'proj-2' };

      TaskService.repository.moveToProject = jest.fn().mockResolvedValue(mockTask);

      const result = await TaskService.moveToProject(
        '123',
        'proj-2',
        'org-1',
        'user-1'
      );

      expect(result.project_id).toBe('proj-2');
      expect(TaskService.repository.moveToProject).toHaveBeenCalledWith(
        '123',
        'proj-2',
        'org-1'
      );
    });

    it('should throw error if new project ID is missing', async () => {
      await expect(
        TaskService.moveToProject('123', '', 'org-1', 'user-1')
      ).rejects.toThrow('New project ID is required');
    });

    it('should return null if task not found', async () => {
      TaskService.repository.moveToProject = jest.fn().mockResolvedValue(null);

      const result = await TaskService.moveToProject(
        'non-existent',
        'proj-2',
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('findByCreator', () => {
    it('should find tasks by creator', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', created_by: 'user-1' },
        { id: '2', title: 'Task 2', created_by: 'user-1' },
      ];

      TaskService.repository.findByCreator = jest.fn().mockResolvedValue(mockTasks);

      const result = await TaskService.findByCreator('user-1', 'org-1');

      expect(result).toHaveLength(2);
      expect(TaskService.repository.findByCreator).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        {}
      );
    });

    it('should pass options to repository', async () => {
      TaskService.repository.findByCreator = jest.fn().mockResolvedValue([]);

      await TaskService.findByCreator('user-1', 'org-1', { status: 'done' });

      expect(TaskService.repository.findByCreator).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        { status: 'done' }
      );
    });
  });

  describe('search', () => {
    it('should search tasks by title', async () => {
      const mockTasks = [
        { id: '1', title: 'Important Task' },
        { id: '2', title: 'Another Important Task' },
      ];

      TaskService.repository.search = jest.fn().mockResolvedValue(mockTasks);

      const result = await TaskService.search('Important', 'org-1');

      expect(result).toHaveLength(2);
      expect(TaskService.repository.search).toHaveBeenCalledWith(
        'Important',
        'org-1',
        {}
      );
    });

    it('should return empty array for empty query', async () => {
      const result = await TaskService.search('', 'org-1');

      expect(result).toEqual([]);
      expect(TaskService.repository.search).not.toHaveBeenCalled();
    });

    it('should trim search query', async () => {
      TaskService.repository.search = jest.fn().mockResolvedValue([]);

      await TaskService.search('  test  ', 'org-1');

      expect(TaskService.repository.search).toHaveBeenCalledWith('test', 'org-1', {});
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update task statuses', async () => {
      const taskIds = ['1', '2', '3'];

      TaskService.repository.bulkUpdateStatus = jest.fn().mockResolvedValue(3);

      const result = await TaskService.bulkUpdateStatus(
        taskIds,
        'done',
        'org-1',
        'user-1'
      );

      expect(result).toBe(3);
      expect(TaskService.repository.bulkUpdateStatus).toHaveBeenCalledWith(
        taskIds,
        'done',
        'org-1'
      );
    });

    it('should throw error for invalid status', async () => {
      await expect(
        TaskService.bulkUpdateStatus(['1'], 'invalid', 'org-1', 'user-1')
      ).rejects.toThrow('Invalid status');
    });

    it('should throw error for empty array', async () => {
      await expect(
        TaskService.bulkUpdateStatus([], 'done', 'org-1', 'user-1')
      ).rejects.toThrow('Task IDs must be a non-empty array');
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create tasks', async () => {
      const tasksData = [
        { project_id: 'proj-1', title: 'Task 1' },
        { project_id: 'proj-1', title: 'Task 2' },
        { project_id: 'proj-1', title: 'Task 3' },
      ];

      TaskService.repository.getNextSortOrder = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      TaskService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await TaskService.bulkCreate(tasksData, 'org-1', 'user-1');

      expect(result.created).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const tasksData = [
        { project_id: 'proj-1', title: 'Valid Task' },
        { project_id: 'proj-1', title: 'AB' }, // Too short
        { project_id: 'proj-1', title: 'Another Valid' },
      ];

      TaskService.repository.getNextSortOrder = jest.fn().mockResolvedValue(0);
      TaskService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await TaskService.bulkCreate(tasksData, 'org-1', 'user-1');

      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('at least 3 characters');
    });
  });

  describe('deleteByProject', () => {
    it('should delete all tasks in a project', async () => {
      TaskService.repository.deleteByProject = jest.fn().mockResolvedValue(5);

      const result = await TaskService.deleteByProject('proj-1', 'org-1', 'user-1');

      expect(result).toBe(5);
      expect(TaskService.repository.deleteByProject).toHaveBeenCalledWith(
        'proj-1',
        'org-1'
      );
    });
  });

  describe('enrichEntity', () => {
    it('should enrich todo task', async () => {
      const task = { id: '123', status: 'todo' };

      const enriched = TaskService.enrichEntity(task);

      expect(enriched.is_todo).toBe(true);
      expect(enriched.is_in_progress).toBe(false);
      expect(enriched.is_done).toBe(false);
      expect(enriched.can_start).toBe(true);
      expect(enriched.can_complete).toBe(false);
      expect(enriched.can_reopen).toBe(false);
    });

    it('should enrich in_progress task', async () => {
      const task = { id: '123', status: 'in_progress' };

      const enriched = TaskService.enrichEntity(task);

      expect(enriched.is_todo).toBe(false);
      expect(enriched.is_in_progress).toBe(true);
      expect(enriched.is_done).toBe(false);
      expect(enriched.can_start).toBe(false);
      expect(enriched.can_complete).toBe(true);
      expect(enriched.can_reopen).toBe(false);
    });

    it('should enrich done task', async () => {
      const task = { id: '123', status: 'done' };

      const enriched = TaskService.enrichEntity(task);

      expect(enriched.is_todo).toBe(false);
      expect(enriched.is_in_progress).toBe(false);
      expect(enriched.is_done).toBe(true);
      expect(enriched.can_start).toBe(false);
      expect(enriched.can_complete).toBe(false);
      expect(enriched.can_reopen).toBe(true);
    });
  });
});
