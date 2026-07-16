const ProjectService = require('../../services/pm/ProjectService');
const TaskService = require('../../services/pm/TaskService');
const ContactService = require('../../services/crm/ContactService');
const CompanyService = require('../../services/crm/CompanyService');
const InvoiceService = require('../../services/invoicing/InvoiceService');

// Mock the repositories
jest.mock('../../repositories/ProjectRepository');
jest.mock('../../repositories/TaskRepository');
jest.mock('../../repositories/ContactRepository');
jest.mock('../../repositories/CompanyRepository');
jest.mock('../../repositories/InvoiceRepository');

describe('Cross-Service Integration Tests', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project and Task Integration', () => {
    it('should create project and add multiple tasks', async () => {
      // Mock project creation
      const mockProject = {
        id: 'proj-123',
        name: 'New Project',
        org_id: mockOrgId,
      };

      ProjectService.repository.findByName = jest.fn().mockResolvedValue(null);
      ProjectService.repository.create = jest.fn().mockResolvedValue(mockProject);

      // Mock task creation
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', sort_order: 0 },
        { id: 'task-2', title: 'Task 2', status: 'todo', sort_order: 1 },
        { id: 'task-3', title: 'Task 3', status: 'todo', sort_order: 2 },
      ];

      TaskService.repository.getNextSortOrder = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      TaskService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockTasks[0])
        .mockResolvedValueOnce(mockTasks[1])
        .mockResolvedValueOnce(mockTasks[2]);

      // Create project
      const project = await ProjectService.create(
        { name: 'New Project' },
        mockOrgId,
        mockUserId
      );

      expect(project.id).toBe('proj-123');

      // Create tasks
      const tasks = await Promise.all([
        TaskService.create(
          { project_id: project.id, title: 'Task 1' },
          mockOrgId,
          mockUserId
        ),
        TaskService.create(
          { project_id: project.id, title: 'Task 2' },
          mockOrgId,
          mockUserId
        ),
        TaskService.create(
          { project_id: project.id, title: 'Task 3' },
          mockOrgId,
          mockUserId
        ),
      ]);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
      expect(tasks[2].title).toBe('Task 3');
      expect(TaskService.repository.create).toHaveBeenCalledTimes(3);
    });

    it('should delete project and cascade to tasks', async () => {
      const projectId = 'proj-123';

      ProjectService.repository.deleteWithTasks = jest.fn().mockResolvedValue(1);

      const result = await ProjectService.delete(projectId, mockOrgId, mockUserId);

      expect(result).toBe(1);
      expect(ProjectService.repository.deleteWithTasks).toHaveBeenCalledWith(
        projectId,
        mockOrgId
      );
    });

    it('should get project with task statistics', async () => {
      const mockProject = {
        id: 'proj-123',
        name: 'Project',
        todo_count: '5',
        in_progress_count: '3',
        done_count: '12',
        total_tasks: '20',
      };

      ProjectService.repository.findByIdWithStats = jest
        .fn()
        .mockResolvedValue(mockProject);

      const project = await ProjectService.findByIdWithStats('proj-123', mockOrgId);

      expect(project.total_tasks).toBe(20);
      expect(project.completion_percentage).toBe(60);
      expect(project.is_complete).toBe(false);
    });

    it('should update task status and reflect in project stats', async () => {
      const taskId = 'task-123';
      const mockTask = { id: taskId, status: 'done' };

      TaskService.repository.updateStatus = jest.fn().mockResolvedValue(mockTask);

      const task = await TaskService.updateStatus(
        taskId,
        'done',
        mockOrgId,
        mockUserId
      );

      expect(task.status).toBe('done');
      expect(task.is_done).toBe(true);
      expect(task.can_reopen).toBe(true);
    });
  });

  describe('Company and Contact Integration', () => {
    it('should create company and add multiple contacts', async () => {
      // Mock company creation
      const mockCompany = {
        id: 'comp-123',
        name: 'Acme Corp',
        org_id: mockOrgId,
      };

      CompanyService.repository.findByName = jest.fn().mockResolvedValue(null);
      CompanyService.repository.create = jest.fn().mockResolvedValue(mockCompany);

      // Mock contact creation
      const mockContacts = [
        { id: 'contact-1', name: 'John Doe', company_id: 'comp-123' },
        { id: 'contact-2', name: 'Jane Smith', company_id: 'comp-123' },
      ];

      ContactService.repository.findByEmail = jest.fn().mockResolvedValue(null);
      ContactService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockContacts[0])
        .mockResolvedValueOnce(mockContacts[1]);

      // Create company
      const company = await CompanyService.create(
        { name: 'Acme Corp' },
        mockOrgId,
        mockUserId
      );

      expect(company.id).toBe('comp-123');

      // Create contacts
      const contacts = await Promise.all([
        ContactService.create(
          {
            name: 'John Doe',
            email: 'john@acme.com',
            company_id: company.id,
          },
          mockOrgId,
          mockUserId
        ),
        ContactService.create(
          {
            name: 'Jane Smith',
            email: 'jane@acme.com',
            company_id: company.id,
          },
          mockOrgId,
          mockUserId
        ),
      ]);

      expect(contacts).toHaveLength(2);
      expect(contacts[0].company_id).toBe('comp-123');
      expect(contacts[1].company_id).toBe('comp-123');
    });

    it('should get company with contact count', async () => {
      const mockCompany = {
        id: 'comp-123',
        name: 'Acme Corp',
        contact_count: '5',
      };

      CompanyService.repository.findById = jest
        .fn()
        .mockResolvedValue(mockCompany);

      const company = await CompanyService.findById('comp-123', mockOrgId);

      expect(company.id).toBe('comp-123');
      expect(company.name).toBe('Acme Corp');
    });

    it('should delete company and handle contact references', async () => {
      const companyId = 'comp-123';
      const mockCompany = { id: companyId, org_id: mockOrgId };

      CompanyService.repository.findById = jest.fn().mockResolvedValue(mockCompany);
      CompanyService.repository.delete = jest.fn().mockResolvedValue(true);

      const result = await CompanyService.delete(companyId, mockOrgId, mockUserId);

      expect(result).toBe(true);
      expect(CompanyService.repository.delete).toHaveBeenCalledWith(
        companyId,
        mockOrgId
      );
    });
  });

  describe('Contact and Invoice Integration', () => {
    it('should create contact and generate invoice', async () => {
      // Mock contact creation
      const mockContact = {
        id: 'contact-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      ContactService.repository.findByEmail = jest.fn().mockResolvedValue(null);
      ContactService.repository.create = jest.fn().mockResolvedValue(mockContact);

      // Mock invoice creation
      const mockInvoice = {
        id: 'inv-123',
        contact_id: 'contact-123',
        amount: 1000,
        status: 'draft',
      };

      InvoiceService.repository.generateInvoiceNumber = jest
        .fn()
        .mockResolvedValue('INV-001');
      InvoiceService.repository.create = jest.fn().mockResolvedValue(mockInvoice);

      // Create contact
      const contact = await ContactService.create(
        {
          name: 'John Doe',
          email: 'john@example.com',
        },
        mockOrgId,
        mockUserId
      );

      expect(contact.id).toBe('contact-123');

      // Create invoice for contact
      const invoice = await InvoiceService.create(
        {
          contact_id: contact.id,
          invoice_number: 'INV-001',
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          amount: 1000,
        },
        mockOrgId,
        mockUserId
      );

      expect(invoice.contact_id).toBe('contact-123');
      expect(invoice.amount).toBe(1000);
    });

    it('should get contact with invoice statistics', async () => {
      const mockContact = {
        id: 'contact-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      ContactService.repository.findById = jest
        .fn()
        .mockResolvedValue(mockContact);

      const contact = await ContactService.findById(
        'contact-123',
        mockOrgId
      );

      expect(contact.id).toBe('contact-123');
      expect(contact.name).toBe('John Doe');
    });
  });

  describe('Company and Invoice Integration', () => {
    it('should create company and generate invoices', async () => {
      // Mock company creation
      const mockCompany = {
        id: 'comp-123',
        name: 'Acme Corp',
      };

      CompanyService.repository.findByName = jest.fn().mockResolvedValue(null);
      CompanyService.repository.create = jest.fn().mockResolvedValue(mockCompany);

      // Mock invoice creation
      const mockInvoices = [
        { id: 'inv-1', company_id: 'comp-123', amount: 1000 },
        { id: 'inv-2', company_id: 'comp-123', amount: 2000 },
      ];

      InvoiceService.repository.generateInvoiceNumber = jest
        .fn()
        .mockResolvedValueOnce('INV-001')
        .mockResolvedValueOnce('INV-002');

      InvoiceService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockInvoices[0])
        .mockResolvedValueOnce(mockInvoices[1]);

      // Create company
      const company = await CompanyService.create(
        { name: 'Acme Corp' },
        mockOrgId,
        mockUserId
      );

      // Create invoices
      const invoices = await Promise.all([
        InvoiceService.create(
          {
            company_id: company.id,
            invoice_number: 'INV-001',
            issue_date: '2024-01-01',
            due_date: '2024-01-31',
            amount: 1000,
          },
          mockOrgId,
          mockUserId
        ),
        InvoiceService.create(
          {
            company_id: company.id,
            invoice_number: 'INV-002',
            issue_date: '2024-01-01',
            due_date: '2024-01-31',
            amount: 2000,
          },
          mockOrgId,
          mockUserId
        ),
      ]);

      expect(invoices).toHaveLength(2);
      expect(invoices[0].company_id).toBe('comp-123');
      expect(invoices[1].company_id).toBe('comp-123');
    });
  });

  describe('Bulk Operations Across Services', () => {
    it('should bulk create projects and tasks', async () => {
      // Mock bulk project creation
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1' },
        { id: 'proj-2', name: 'Project 2' },
      ];

      ProjectService.repository.findByName = jest.fn().mockResolvedValue(null);
      ProjectService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockProjects[0])
        .mockResolvedValueOnce(mockProjects[1]);

      // Create projects
      const projectsResult = await ProjectService.bulkCreate(
        [{ name: 'Project 1' }, { name: 'Project 2' }],
        mockOrgId,
        mockUserId
      );

      expect(projectsResult.created).toHaveLength(2);
      expect(projectsResult.failed).toHaveLength(0);

      // Mock bulk task creation
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', project_id: 'proj-1' },
        { id: 'task-2', title: 'Task 2', project_id: 'proj-1' },
      ];

      TaskService.repository.getNextSortOrder = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);

      TaskService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockTasks[0])
        .mockResolvedValueOnce(mockTasks[1]);

      // Create tasks for first project
      const tasksResult = await TaskService.bulkCreate(
        [
          { project_id: 'proj-1', title: 'Task 1' },
          { project_id: 'proj-1', title: 'Task 2' },
        ],
        mockOrgId,
        mockUserId
      );

      expect(tasksResult.created).toHaveLength(2);
      expect(tasksResult.failed).toHaveLength(0);
    });

    it('should bulk create contacts and companies', async () => {
      // Mock bulk company creation
      const mockCompanies = [
        { id: 'comp-1', name: 'Company 1' },
        { id: 'comp-2', name: 'Company 2' },
      ];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue([]);
      CompanyService.repository.findByName = jest.fn().mockResolvedValue(null);
      CompanyService.repository.create = jest
        .fn()
        .mockResolvedValueOnce(mockCompanies[0])
        .mockResolvedValueOnce(mockCompanies[1]);

      const companiesResult = await CompanyService.bulkCreate(
        [{ name: 'Company 1' }, { name: 'Company 2' }],
        mockOrgId,
        mockUserId
      );

      expect(companiesResult.created).toHaveLength(2);

      // Mock bulk contact creation
      const mockContacts = [
        { id: 'contact-1', name: 'Contact 1', company_id: 'comp-1' },
        { id: 'contact-2', name: 'Contact 2', company_id: 'comp-2' },
      ];

      ContactService.repository.findByEmail = jest.fn().mockResolvedValue(null);
      ContactService.repository.bulkCreate = jest
        .fn()
        .mockResolvedValue([mockContacts[0], mockContacts[1]]);

      const contactsResult = await ContactService.bulkCreate(
        [
          { name: 'Contact 1', email: 'c1@example.com', company_id: 'comp-1' },
          { name: 'Contact 2', email: 'c2@example.com', company_id: 'comp-2' },
        ],
        mockOrgId,
        mockUserId
      );

      expect(contactsResult.created).toHaveLength(2);
    });
  });

  describe('Search Across Services', () => {
    it('should search projects and tasks', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Marketing Campaign' },
        { id: 'proj-2', name: 'Marketing Website' },
      ];

      const mockTasks = [
        { id: 'task-1', title: 'Marketing Research' },
        { id: 'task-2', title: 'Marketing Plan' },
      ];

      ProjectService.repository.search = jest.fn().mockResolvedValue(mockProjects);
      TaskService.repository.search = jest.fn().mockResolvedValue(mockTasks);

      const projects = await ProjectService.search('Marketing', mockOrgId);
      const tasks = await TaskService.search('Marketing', mockOrgId);

      expect(projects).toHaveLength(2);
      expect(tasks).toHaveLength(2);
    });

    it('should search contacts and companies', async () => {
      const mockContacts = [
        { id: 'contact-1', name: 'John Doe' },
        { id: 'contact-2', name: 'John Smith' },
      ];

      const mockCompanies = [
        { id: 'comp-1', name: 'John Corp' },
      ];

      ContactService.repository.search = jest.fn().mockResolvedValue(mockContacts);
      CompanyService.repository.search = jest.fn().mockResolvedValue(mockCompanies);

      const contacts = await ContactService.search('John', mockOrgId);
      const companies = await CompanyService.search('John', mockOrgId);

      expect(contacts).toHaveLength(2);
      expect(companies).toHaveLength(1);
    });
  });

  describe('Statistics Across Services', () => {
    it('should get organization-wide statistics', async () => {
      // Mock project statistics
      const mockProjects = [
        { id: 'proj-1', status: 'active' },
        { id: 'proj-2', status: 'active' },
        { id: 'proj-3', status: 'completed' },
      ];

      ProjectService.repository.findAll = jest
        .fn()
        .mockResolvedValue(mockProjects);

      // Mock task statistics
      const mockTasks = [
        { id: 'task-1', status: 'todo' },
        { id: 'task-2', status: 'in_progress' },
        { id: 'task-3', status: 'done' },
      ];

      TaskService.repository.findByProject = jest
        .fn()
        .mockResolvedValue(mockTasks);

      // Mock contact statistics
      const mockContacts = [
        { id: 'contact-1', company_id: 'comp-1' },
        { id: 'contact-2', company_id: null },
      ];

      ContactService.repository.findAll = jest
        .fn()
        .mockResolvedValue(mockContacts);

      // Get all statistics
      const projects = await ProjectService.findAll(mockOrgId);
      const tasks = await TaskService.findByProject('proj-123', mockOrgId);
      const contacts = await ContactService.findAll(mockOrgId);

      expect(projects).toHaveLength(3);
      expect(tasks).toHaveLength(3);
      expect(contacts).toHaveLength(2);
    });
  });

  describe('Error Handling Across Services', () => {
    it('should handle cascading errors gracefully', async () => {
      // Mock project creation failure
      ProjectService.repository.findByName = jest.fn().mockResolvedValue(null);
      ProjectService.repository.create = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        ProjectService.create({ name: 'Project' }, mockOrgId, mockUserId)
      ).rejects.toThrow('Failed to create project');
    });

    it('should handle validation errors across services', async () => {
      // Invalid project name
      await expect(
        ProjectService.create({ name: 'AB' }, mockOrgId, mockUserId)
      ).rejects.toThrow('Project name must be at least 3 characters');

      // Invalid task title
      await expect(
        TaskService.create(
          { project_id: 'proj-123', title: 'AB' },
          mockOrgId,
          mockUserId
        )
      ).rejects.toThrow('Task title must be at least 3 characters');

      // Invalid contact email
      await expect(
        ContactService.create(
          { name: 'John', email: 'invalid' },
          mockOrgId,
          mockUserId
        )
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('Tenant Isolation Across Services', () => {
    it('should enforce tenant isolation in all services', async () => {
      const org1 = 'org-1';
      const org2 = 'org-2';

      // Mock data for org1
      const mockProject1 = { id: 'proj-1', org_id: org1 };
      const mockContact1 = { id: 'contact-1', org_id: org1 };

      ProjectService.repository.findById = jest
        .fn()
        .mockImplementation((id, orgId) => {
          if (orgId === org1) return Promise.resolve(mockProject1);
          return Promise.resolve(null);
        });

      ContactService.repository.findById = jest
        .fn()
        .mockImplementation((id, orgId) => {
          if (orgId === org1) return Promise.resolve(mockContact1);
          return Promise.resolve(null);
        });

      // Org1 can access its data
      const project1 = await ProjectService.findById('proj-1', org1);
      expect(project1).not.toBeNull();

      // Org2 cannot access org1's data
      const project2 = await ProjectService.findById('proj-1', org2);
      expect(project2).toBeNull();

      // Same for contacts
      const contact1 = await ContactService.findById('contact-1', org1);
      expect(contact1).not.toBeNull();

      const contact2 = await ContactService.findById('contact-1', org2);
      expect(contact2).toBeNull();
    });
  });
});
