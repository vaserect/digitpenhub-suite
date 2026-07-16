const contactService = require('../../services/crm/ContactService.cached');
const companyService = require('../../services/crm/CompanyService.cached');
const projectService = require('../../services/pm/ProjectService.cached');
const taskService = require('../../services/pm/TaskService.cached');
const invoiceService = require('../../services/invoicing/InvoiceService.cached');
const { CacheManager } = require('../../cache/CacheManager');
const { setCacheInstance } = require('../../cache/cacheDecorators');

// Mock the repositories
jest.mock('../../repositories/ContactRepository');
jest.mock('../../repositories/CompanyRepository');
jest.mock('../../repositories/ProjectRepository');
jest.mock('../../repositories/TaskRepository');
jest.mock('../../repositories/InvoiceRepository');

describe('Cached Services Integration Tests', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-123';
  let cache;

  beforeAll(() => {
    // Create cache instance for tests
    cache = new CacheManager({
      enabled: true,
      type: 'memory',
      defaultTTL: 60,
      maxMemoryItems: 100,
    });
    
    // Set cache instance for decorators to use
    setCacheInstance(cache);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await cache.clear();
    cache.resetStats();
  });

  afterAll(async () => {
    await cache.close();
  });

  describe('ContactService Caching', () => {
    const service = contactService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should cache findById results', async () => {
      const mockContact = { id: 'contact-1', name: 'John Doe', email: 'john@example.com' };
      service.repository.findById = jest.fn().mockResolvedValue(mockContact);

      // First call - cache miss
      const result1 = await service.findById('contact-1', mockOrgId);
      expect(result1).toMatchObject({ id: 'contact-1', name: 'John Doe', email: 'john@example.com' });
      expect(service.repository.findById).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const result2 = await service.findById('contact-1', mockOrgId);
      expect(result2).toMatchObject({ id: 'contact-1', name: 'John Doe', email: 'john@example.com' });
      expect(service.repository.findById).toHaveBeenCalledTimes(1); // Not called again

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should cache findAll results', async () => {
      const mockContacts = [
        { id: 'contact-1', name: 'John' },
        { id: 'contact-2', name: 'Jane' },
      ];
      service.repository.findAll = jest.fn().mockResolvedValue(mockContacts);

      // First call - cache miss
      const result1 = await service.findAll(mockOrgId);
      expect(result1.length).toBe(2);
      expect(result1[0]).toMatchObject({ id: 'contact-1', name: 'John' });
      expect(service.repository.findAll).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const result2 = await service.findAll(mockOrgId);
      expect(result2.length).toBe(2);
      expect(service.repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on create', async () => {
      const mockContact = { id: 'contact-1', name: 'John' };
      service.repository.findAll = jest.fn().mockResolvedValue([mockContact]);
      service.repository.findByEmail = jest.fn().mockResolvedValue(null);
      service.repository.create = jest.fn().mockResolvedValue(mockContact);

      // Cache findAll
      await service.findAll(mockOrgId);
      expect(service.repository.findAll).toHaveBeenCalledTimes(1);

      // Create new contact - should invalidate cache
      await service.create({ name: 'New', email: 'new@example.com' }, mockOrgId, mockUserId);

      // Next findAll should hit database again
      await service.findAll(mockOrgId);
      expect(service.repository.findAll).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache on update', async () => {
      const mockContact = { id: 'contact-1', name: 'John', email: 'john@example.com' };
      service.repository.findById = jest.fn().mockResolvedValue(mockContact);
      service.repository.update = jest.fn().mockResolvedValue({ ...mockContact, name: 'Updated' });

      // Cache findById
      await service.findById('contact-1', mockOrgId);
      const initialCalls = service.repository.findById.mock.calls.length;

      // Update contact - should invalidate cache
      await service.update('contact-1', { name: 'Updated', email: 'john@example.com' }, mockOrgId, mockUserId);

      // Next findById should hit database again (cache was invalidated)
      await service.findById('contact-1', mockOrgId);
      expect(service.repository.findById.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should invalidate cache on delete', async () => {
      const mockContact = { id: 'contact-1', name: 'John', email: 'john@example.com' };
      service.repository.findById = jest.fn().mockResolvedValue(mockContact);
      service.repository.delete = jest.fn().mockResolvedValue(1);

      // Cache findById
      await service.findById('contact-1', mockOrgId);
      const initialCalls = service.repository.findById.mock.calls.length;

      // Delete contact - should invalidate cache
      await service.delete('contact-1', mockOrgId, mockUserId);

      // Next findById should hit database again (cache was invalidated)
      await service.findById('contact-1', mockOrgId);
      expect(service.repository.findById.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe('CompanyService Caching', () => {
    const service = companyService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should cache findById results', async () => {
      const mockCompany = { id: 'company-1', name: 'Acme Corp' };
      service.repository.findById = jest.fn().mockResolvedValue(mockCompany);

      await service.findById('company-1', mockOrgId);
      await service.findById('company-1', mockOrgId);

      expect(service.repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on update', async () => {
      const mockCompany = { id: 'company-1', name: 'Acme' };
      service.repository.findById = jest.fn().mockResolvedValue(mockCompany);
      service.repository.update = jest.fn().mockResolvedValue({ ...mockCompany, name: 'Updated' });

      await service.findById('company-1', mockOrgId);
      const initialCalls = service.repository.findById.mock.calls.length;
      
      await service.update('company-1', { name: 'Updated' }, mockOrgId, mockUserId);
      await service.findById('company-1', mockOrgId);

      expect(service.repository.findById.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe('ProjectService Caching', () => {
    const service = projectService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should cache findById results', async () => {
      const mockProject = { id: 'proj-1', name: 'Project 1' };
      service.repository.findById = jest.fn().mockResolvedValue(mockProject);

      await service.findById('proj-1', mockOrgId);
      await service.findById('proj-1', mockOrgId);

      expect(service.repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should cache findByIdWithStats separately', async () => {
      const mockProject = { id: 'proj-1', name: 'Project 1', total_tasks: 5 };
      service.repository.findByIdWithStats = jest.fn().mockResolvedValue(mockProject);

      await service.findByIdWithStats('proj-1', mockOrgId);
      await service.findByIdWithStats('proj-1', mockOrgId);

      expect(service.repository.findByIdWithStats).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on create', async () => {
      const mockProject = { id: 'proj-1', name: 'Project' };
      service.repository.findAll = jest.fn().mockResolvedValue([mockProject]);
      service.repository.existsByName = jest.fn().mockResolvedValue(false);
      service.repository.create = jest.fn().mockResolvedValue(mockProject);

      await service.findAll(mockOrgId);
      await service.create({ name: 'New Project' }, mockOrgId, mockUserId);
      await service.findAll(mockOrgId);

      expect(service.repository.findAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('TaskService Caching with Cascade', () => {
    // Services are singletons

    it('should cache findById results', async () => {
      const mockTask = { id: 'task-1', title: 'Task 1', project_id: 'proj-1' };
      taskService.repository.findById = jest.fn().mockResolvedValue(mockTask);

      await taskService.findById('task-1', mockOrgId);
      await taskService.findById('task-1', mockOrgId);

      expect(taskService.repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should cache findByProject results', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];
      taskService.repository.findByProject = jest.fn().mockResolvedValue(mockTasks);

      await taskService.findByProject('proj-1', mockOrgId);
      await taskService.findByProject('proj-1', mockOrgId);

      expect(taskService.repository.findByProject).toHaveBeenCalledTimes(1);
    });

    it('should invalidate task and project cache on task update', async () => {
      const mockTask = { id: 'task-1', title: 'Task', project_id: 'proj-1' };
      const mockProject = { id: 'proj-1', name: 'Project', total_tasks: 5 };

      taskService.repository.findById = jest.fn().mockResolvedValue(mockTask);
      taskService.repository.update = jest.fn().mockResolvedValue({ ...mockTask, title: 'Updated' });
      projectService.repository.findByIdWithStats = jest.fn().mockResolvedValue(mockProject);

      // Cache both task and project
      await taskService.findById('task-1', mockOrgId);
      await projectService.findByIdWithStats('proj-1', mockOrgId);
      
      const taskCalls = taskService.repository.findById.mock.calls.length;
      const projectCalls = projectService.repository.findByIdWithStats.mock.calls.length;

      // Update task - should invalidate both caches
      await taskService.update('task-1', { title: 'Updated' }, mockOrgId, mockUserId);

      // Both should hit database again
      await taskService.findById('task-1', mockOrgId);
      await projectService.findByIdWithStats('proj-1', mockOrgId);

      expect(taskService.repository.findById.mock.calls.length).toBeGreaterThan(taskCalls);
      expect(projectService.repository.findByIdWithStats.mock.calls.length).toBeGreaterThan(projectCalls);
    });
  });

  describe('InvoiceService Caching', () => {
    const service = invoiceService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should cache findById results', async () => {
      const mockInvoice = { id: 'inv-1', invoice_number: 'INV-001', amount: 1000 };
      service.repository.findById = jest.fn().mockResolvedValue(mockInvoice);

      await service.findById('inv-1', mockOrgId);
      await service.findById('inv-1', mockOrgId);

      expect(service.repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on update', async () => {
      const mockInvoice = { id: 'inv-1', amount: 1000 };
      service.repository.findById = jest.fn().mockResolvedValue(mockInvoice);
      service.repository.update = jest.fn().mockResolvedValue({ ...mockInvoice, amount: 2000 });

      await service.findById('inv-1', mockOrgId);
      const initialCalls = service.repository.findById.mock.calls.length;
      
      await service.update('inv-1', { amount: 2000 }, mockOrgId, mockUserId);
      await service.findById('inv-1', mockOrgId);

      expect(service.repository.findById.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    const service = contactService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should isolate cache by organization', async () => {
      const mockContact1 = { id: 'contact-1', name: 'Org1 Contact' };
      const mockContact2 = { id: 'contact-1', name: 'Org2 Contact' };

      service.repository.findById = jest
        .fn()
        .mockResolvedValueOnce(mockContact1)
        .mockResolvedValueOnce(mockContact2);

      // Cache for org-1
      const result1 = await service.findById('contact-1', 'org-1');
      expect(result1.name).toBe('Org1 Contact');

      // Cache for org-2 (different org, should hit database)
      const result2 = await service.findById('contact-1', 'org-2');
      expect(result2.name).toBe('Org2 Contact');

      // Both orgs should have separate cache entries
      expect(service.repository.findById).toHaveBeenCalledTimes(2);

      // Verify org-1 cache still works
      const result3 = await service.findById('contact-1', 'org-1');
      expect(result3.name).toBe('Org1 Contact');
      expect(service.repository.findById).toHaveBeenCalledTimes(2); // Not called again
    });
  });

  describe('Cache Statistics', () => {
    const service = contactService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should track cache hits and misses', async () => {
      const mockContact = { id: 'contact-1', name: 'John' };
      service.repository.findById = jest.fn().mockResolvedValue(mockContact);

      cache.resetStats();

      // Miss
      await service.findById('contact-1', mockOrgId);
      
      // Hit
      await service.findById('contact-1', mockOrgId);
      
      // Miss (different ID)
      await service.findById('contact-2', mockOrgId);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('33.33%');
    });
  });

  describe('Bulk Operations', () => {
    const service = contactService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should invalidate cache on bulk create', async () => {
      const mockContacts = [{ id: 'c1' }, { id: 'c2' }];
      service.repository.findAll = jest.fn().mockResolvedValue(mockContacts);
      service.repository.findByEmail = jest.fn().mockResolvedValue(null);
      service.repository.bulkCreate = jest.fn().mockResolvedValue(mockContacts);

      // Cache findAll
      await service.findAll(mockOrgId);

      // Bulk create - should invalidate
      await service.bulkCreate([
        { name: 'C1', email: 'c1@example.com' },
        { name: 'C2', email: 'c2@example.com' },
      ], mockOrgId, mockUserId);

      // Should hit database again
      await service.findAll(mockOrgId);

      expect(service.repository.findAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Caching', () => {
    const service = contactService;

    beforeEach(() => {
      // Service is singleton, just reset mocks
    });

    it('should cache search results', async () => {
      const mockResults = [{ id: 'c1', name: 'John Doe' }];
      service.repository.search = jest.fn().mockResolvedValue(mockResults);

      await service.search('john', mockOrgId);
      await service.search('john', mockOrgId);

      expect(service.repository.search).toHaveBeenCalledTimes(1);
    });

    it('should cache different search queries separately', async () => {
      service.repository.search = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'c1', name: 'John' }])
        .mockResolvedValueOnce([{ id: 'c2', name: 'Jane' }]);

      await service.search('john', mockOrgId);
      await service.search('jane', mockOrgId);

      expect(service.repository.search).toHaveBeenCalledTimes(2);
    });
  });
});
