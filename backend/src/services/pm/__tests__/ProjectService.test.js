const ProjectService = require('../ProjectService');
const ProjectRepository = require('../../../repositories/ProjectRepository');

// Mock the repository
jest.mock('../../../repositories/ProjectRepository');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the repository mock
    ProjectService.repository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByIdWithStats: jest.fn(),
      findAllWithStats: jest.fn(),
      getStatistics: jest.fn(),
      search: jest.fn(),
      findByCreator: jest.fn(),
      findRecent: jest.fn(),
      deleteWithTasks: jest.fn(),
      existsByName: jest.fn(),
    };
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const mockProject = {
        id: '123',
        name: 'New Project',
        org_id: 'org-1',
        created_by: 'user-1',
      };

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.create = jest.fn().mockResolvedValue(mockProject);

      const result = await ProjectService.create(
        { name: 'New Project' },
        'org-1',
        'user-1'
      );

      expect(result.name).toBe('New Project');
      expect(result.total_tasks).toBe(0);
      expect(result.completion_percentage).toBe(0);
      expect(ProjectService.repository.create).toHaveBeenCalled();
    });

    it('should throw error if name is missing', async () => {
      await expect(
        ProjectService.create({}, 'org-1', 'user-1')
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error if name is too short', async () => {
      await expect(
        ProjectService.create({ name: 'AB' }, 'org-1', 'user-1')
      ).rejects.toThrow('Project name must be at least 3 characters');
    });

    it('should throw error if name is too long', async () => {
      const longName = 'A'.repeat(201);
      await expect(
        ProjectService.create({ name: longName }, 'org-1', 'user-1')
      ).rejects.toThrow('Project name must not exceed 200 characters');
    });

    it('should throw error if project name already exists', async () => {
      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(true);

      await expect(
        ProjectService.create({ name: 'Existing Project' }, 'org-1', 'user-1')
      ).rejects.toThrow('A project with this name already exists');
    });

    it('should trim project name', async () => {
      const mockProject = { id: '123', name: 'Trimmed Project' };

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.create = jest.fn().mockResolvedValue(mockProject);

      await ProjectService.create(
        { name: '  Trimmed Project  ' },
        'org-1',
        'user-1'
      );

      const createCall = ProjectService.repository.create.mock.calls[0];
      expect(createCall[0].name).toBe('Trimmed Project');
    });
  });

  describe('update', () => {
    it('should update a project successfully', async () => {
      const mockProject = {
        id: '123',
        name: 'Updated Project',
        total_tasks: 5,
        done_count: 2,
      };

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.update = jest.fn().mockResolvedValue(mockProject);
      ProjectService.repository.findByIdWithStats = jest.fn().mockResolvedValue(mockProject);

      const result = await ProjectService.update(
        '123',
        { name: 'Updated Project' },
        'org-1',
        'user-1'
      );

      expect(result.name).toBe('Updated Project');
      expect(ProjectService.repository.update).toHaveBeenCalled();
    });

    it('should return null if project not found', async () => {
      ProjectService.repository.update = jest.fn().mockResolvedValue(null);

      const result = await ProjectService.update(
        'non-existent',
        { name: 'Updated' },
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });

    it('should throw error if updated name already exists', async () => {
      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(true);

      await expect(
        ProjectService.update(
          '123',
          { name: 'Existing Name' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('A project with this name already exists');
    });

    it('should validate name length on update', async () => {
      await expect(
        ProjectService.update('123', { name: 'AB' }, 'org-1', 'user-1')
      ).rejects.toThrow('Project name must be at least 3 characters');
    });
  });

  describe('findByIdWithStats', () => {
    it('should find project with statistics', async () => {
      const mockProject = {
        id: '123',
        name: 'Test Project',
        total_tasks: 10,
        todo_count: 3,
        in_progress_count: 2,
        done_count: 5,
      };

      ProjectService.repository.findByIdWithStats = jest
        .fn()
        .mockResolvedValue(mockProject);

      const result = await ProjectService.findByIdWithStats('123', 'org-1');

      expect(result.name).toBe('Test Project');
      expect(result.total_tasks).toBe(10);
      expect(result.completion_percentage).toBe(50);
      expect(result.is_complete).toBe(false);
      expect(result.has_tasks).toBe(true);
    });

    it('should return null if project not found', async () => {
      ProjectService.repository.findByIdWithStats = jest.fn().mockResolvedValue(null);

      const result = await ProjectService.findByIdWithStats('non-existent', 'org-1');

      expect(result).toBeNull();
    });

    it('should calculate 100% completion correctly', async () => {
      const mockProject = {
        id: '123',
        name: 'Complete Project',
        total_tasks: 5,
        done_count: 5,
      };

      ProjectService.repository.findByIdWithStats = jest
        .fn()
        .mockResolvedValue(mockProject);

      const result = await ProjectService.findByIdWithStats('123', 'org-1');

      expect(result.completion_percentage).toBe(100);
      expect(result.is_complete).toBe(true);
    });

    it('should handle project with no tasks', async () => {
      const mockProject = {
        id: '123',
        name: 'Empty Project',
        total_tasks: 0,
        done_count: 0,
      };

      ProjectService.repository.findByIdWithStats = jest
        .fn()
        .mockResolvedValue(mockProject);

      const result = await ProjectService.findByIdWithStats('123', 'org-1');

      expect(result.completion_percentage).toBe(0);
      expect(result.is_complete).toBe(false);
      expect(result.has_tasks).toBe(false);
    });
  });

  describe('findAllWithStats', () => {
    it('should find all projects with statistics', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', total_tasks: 5, done_count: 2 },
        { id: '2', name: 'Project 2', total_tasks: 10, done_count: 8 },
      ];

      ProjectService.repository.findAllWithStats = jest
        .fn()
        .mockResolvedValue(mockProjects);

      const result = await ProjectService.findAllWithStats('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].completion_percentage).toBe(40);
      expect(result[1].completion_percentage).toBe(80);
    });

    it('should pass options to repository', async () => {
      ProjectService.repository.findAllWithStats = jest.fn().mockResolvedValue([]);

      await ProjectService.findAllWithStats('org-1', {
        limit: 50,
        offset: 10,
      });

      expect(ProjectService.repository.findAllWithStats).toHaveBeenCalledWith('org-1', {
        limit: 50,
        offset: 10,
      });
    });
  });

  describe('getStatistics', () => {
    it('should get project statistics', async () => {
      const mockStats = {
        total_projects: '10',
        total_tasks: '50',
        todo_tasks: '15',
        in_progress_tasks: '20',
        done_tasks: '15',
        completion_percentage: '30.00',
      };

      ProjectService.repository.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const result = await ProjectService.getStatistics('org-1');

      expect(result.total_projects).toBe(10);
      expect(result.total_tasks).toBe(50);
      expect(result.completion_percentage).toBe(30);
      expect(result.average_tasks_per_project).toBe(5);
    });

    it('should handle zero projects', async () => {
      const mockStats = {
        total_projects: '0',
        total_tasks: '0',
        todo_tasks: '0',
        in_progress_tasks: '0',
        done_tasks: '0',
        completion_percentage: '0.00',
      };

      ProjectService.repository.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const result = await ProjectService.getStatistics('org-1');

      expect(result.average_tasks_per_project).toBe(0);
    });
  });

  describe('search', () => {
    it('should search projects by name', async () => {
      const mockProjects = [
        { id: '1', name: 'Marketing Project', total_tasks: 5, done_count: 2 },
        { id: '2', name: 'Marketing Campaign', total_tasks: 3, done_count: 1 },
      ];

      ProjectService.repository.search = jest.fn().mockResolvedValue(mockProjects);

      const result = await ProjectService.search('Marketing', 'org-1');

      expect(result).toHaveLength(2);
      expect(ProjectService.repository.search).toHaveBeenCalledWith(
        'Marketing',
        'org-1',
        {}
      );
    });

    it('should return empty array for empty query', async () => {
      const result = await ProjectService.search('', 'org-1');

      expect(result).toEqual([]);
      expect(ProjectService.repository.search).not.toHaveBeenCalled();
    });

    it('should trim search query', async () => {
      ProjectService.repository.search = jest.fn().mockResolvedValue([]);

      await ProjectService.search('  test  ', 'org-1');

      expect(ProjectService.repository.search).toHaveBeenCalledWith('test', 'org-1', {});
    });
  });

  describe('findByCreator', () => {
    it('should find projects by creator', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', created_by: 'user-1' },
        { id: '2', name: 'Project 2', created_by: 'user-1' },
      ];

      ProjectService.repository.findByCreator = jest
        .fn()
        .mockResolvedValue(mockProjects);

      const result = await ProjectService.findByCreator('user-1', 'org-1');

      expect(result).toHaveLength(2);
      expect(ProjectService.repository.findByCreator).toHaveBeenCalledWith(
        'user-1',
        'org-1'
      );
    });
  });

  describe('findRecent', () => {
    it('should find recent projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Recent 1', total_tasks: 5 },
        { id: '2', name: 'Recent 2', total_tasks: 3 },
      ];

      ProjectService.repository.findRecent = jest.fn().mockResolvedValue(mockProjects);

      const result = await ProjectService.findRecent('org-1', 5);

      expect(result).toHaveLength(2);
      expect(ProjectService.repository.findRecent).toHaveBeenCalledWith('org-1', 5);
    });

    it('should use default limit', async () => {
      ProjectService.repository.findRecent = jest.fn().mockResolvedValue([]);

      await ProjectService.findRecent('org-1');

      expect(ProjectService.repository.findRecent).toHaveBeenCalledWith('org-1', 10);
    });
  });

  describe('delete', () => {
    it('should delete project with tasks', async () => {
      ProjectService.repository.deleteWithTasks = jest.fn().mockResolvedValue(true);

      const result = await ProjectService.delete('123', 'org-1', 'user-1');

      expect(result).toBe(true);
      expect(ProjectService.repository.deleteWithTasks).toHaveBeenCalledWith(
        '123',
        'org-1'
      );
    });

    it('should return false if project not found', async () => {
      ProjectService.repository.deleteWithTasks = jest.fn().mockResolvedValue(false);

      const result = await ProjectService.delete('non-existent', 'org-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create projects', async () => {
      const projectsData = [
        { name: 'Project 1' },
        { name: 'Project 2' },
        { name: 'Project 3' },
      ];

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await ProjectService.bulkCreate(projectsData, 'org-1', 'user-1');

      expect(result.created).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const projectsData = [
        { name: 'Valid Project' },
        { name: 'AB' }, // Too short
        { name: 'Another Valid' },
      ];

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await ProjectService.bulkCreate(projectsData, 'org-1', 'user-1');

      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('at least 3 characters');
    });

    it('should continue on errors', async () => {
      const projectsData = [
        { name: '' }, // Invalid
        { name: 'Valid Project' },
      ];

      ProjectService.repository.existsByName = jest.fn().mockResolvedValue(false);
      ProjectService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await ProjectService.bulkCreate(projectsData, 'org-1', 'user-1');

      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('enrichEntity', () => {
    it('should enrich project with computed fields', async () => {
      const project = {
        id: '123',
        name: 'Test Project',
        total_tasks: 10,
        todo_count: 3,
        in_progress_count: 2,
        done_count: 5,
      };

      const enriched = ProjectService.enrichEntity(project);

      expect(enriched.completion_percentage).toBe(50);
      expect(enriched.is_complete).toBe(false);
      expect(enriched.has_tasks).toBe(true);
    });

    it('should handle string numbers', async () => {
      const project = {
        id: '123',
        name: 'Test Project',
        total_tasks: '10',
        done_count: '5',
      };

      const enriched = ProjectService.enrichEntity(project);

      expect(enriched.total_tasks).toBe(10);
      expect(enriched.done_count).toBe(5);
      expect(enriched.completion_percentage).toBe(50);
    });

    it('should mark complete project correctly', async () => {
      const project = {
        id: '123',
        name: 'Complete Project',
        total_tasks: 5,
        done_count: 5,
      };

      const enriched = ProjectService.enrichEntity(project);

      expect(enriched.is_complete).toBe(true);
      expect(enriched.completion_percentage).toBe(100);
    });

    it('should handle project with no tasks', async () => {
      const project = {
        id: '123',
        name: 'Empty Project',
        total_tasks: 0,
        done_count: 0,
      };

      const enriched = ProjectService.enrichEntity(project);

      expect(enriched.has_tasks).toBe(false);
      expect(enriched.is_complete).toBe(false);
      expect(enriched.completion_percentage).toBe(0);
    });
  });
});
