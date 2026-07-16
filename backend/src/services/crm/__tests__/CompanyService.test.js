const CompanyService = require('../CompanyService');
const CompanyRepository = require('../../../repositories/CompanyRepository');

// Mock the repository
jest.mock('../../../repositories/CompanyRepository');

describe('CompanyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the repository mock
    CompanyService.repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      findAllWithContactCount: jest.fn(),
      findByIdWithContacts: jest.fn(),
      getStatsByIndustry: jest.fn(),
      getStatsBySize: jest.fn(),
      existsByName: jest.fn(),
      count: jest.fn(),
    };
  });

  describe('create', () => {
    it('should create a company with valid data', async () => {
      const mockCompany = {
        id: '123',
        name: 'Acme Corp',
        website: 'https://acme.com',
        industry: 'Technology',
        size: '51-200',
        email: 'info@acme.com',
        phone: '+1234567890',
      };

      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockResolvedValue(mockCompany);

      const result = await CompanyService.create(
        {
          name: 'Acme Corp',
          website: 'acme.com',
          industry: 'Technology',
          size: '51-200',
          email: 'info@acme.com',
          phone: '+1234567890',
        },
        'org-1',
        'user-1'
      );

      expect(result.name).toBe('Acme Corp');
      expect(result.website).toBe('https://acme.com');
      expect(CompanyService.repository.create).toHaveBeenCalled();
    });

    it('should throw error if name is missing', async () => {
      await expect(
        CompanyService.create({ website: 'acme.com' }, 'org-1', 'user-1')
      ).rejects.toThrow('Company name is required');
    });

    it('should throw error if name is too short', async () => {
      await expect(
        CompanyService.create({ name: 'A' }, 'org-1', 'user-1')
      ).rejects.toThrow('Company name must be at least 2 characters');
    });

    it('should throw error if name is too long', async () => {
      const longName = 'A'.repeat(201);
      await expect(
        CompanyService.create({ name: longName }, 'org-1', 'user-1')
      ).rejects.toThrow('Company name must not exceed 200 characters');
    });

    it('should throw error for invalid website format', async () => {
      await expect(
        CompanyService.create(
          { name: 'Acme Corp', website: 'not-a-url' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invalid website URL format');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        CompanyService.create(
          { name: 'Acme Corp', email: 'not-an-email' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid phone format', async () => {
      await expect(
        CompanyService.create(
          { name: 'Acme Corp', phone: '123' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Invalid phone format');
    });

    it('should throw error for invalid company size', async () => {
      await expect(
        CompanyService.create(
          { name: 'Acme Corp', size: 'invalid-size' },
          'org-1',
          'user-1'
        )
      ).rejects.toThrow('Company size must be one of');
    });

    it('should throw error if company name already exists', async () => {
      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(true);

      await expect(
        CompanyService.create({ name: 'Acme Corp' }, 'org-1', 'user-1')
      ).rejects.toThrow('A company with this name already exists');
    });

    it('should normalize website URL by adding https://', async () => {
      const mockCompany = {
        id: '123',
        name: 'Acme Corp',
        website: 'https://acme.com',
      };

      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockResolvedValue(mockCompany);

      await CompanyService.create(
        { name: 'Acme Corp', website: 'acme.com' },
        'org-1',
        'user-1'
      );

      const createCall = CompanyService.repository.create.mock.calls[0];
      expect(createCall[0].website).toBe('https://acme.com');
    });

    it('should normalize email to lowercase', async () => {
      const mockCompany = {
        id: '123',
        name: 'Acme Corp',
        email: 'info@acme.com',
      };

      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockResolvedValue(mockCompany);

      await CompanyService.create(
        { name: 'Acme Corp', email: 'INFO@ACME.COM' },
        'org-1',
        'user-1'
      );

      const createCall = CompanyService.repository.create.mock.calls[0];
      expect(createCall[0].email).toBe('info@acme.com');
    });

    it('should accept all valid company sizes', async () => {
      const validSizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockResolvedValue({ id: '123' });

      for (const size of validSizes) {
        await expect(
          CompanyService.create({ name: 'Test Corp', size }, 'org-1', 'user-1')
        ).resolves.toBeDefined();
      }
    });
  });

  describe('update', () => {
    it('should update a company with valid data', async () => {
      const mockCompany = {
        id: '123',
        name: 'Updated Corp',
        website: 'https://updated.com',
      };

      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.findById = jest.fn().mockResolvedValue({ id: '123', name: 'Old Corp' });
      CompanyService.repository.update = jest.fn().mockResolvedValue(mockCompany);

      const result = await CompanyService.update(
        '123',
        { name: 'Updated Corp', website: 'updated.com' },
        'org-1',
        'user-1'
      );

      expect(result.name).toBe('Updated Corp');
      expect(CompanyService.repository.update).toHaveBeenCalled();
    });

    it('should throw error if updated name is empty', async () => {
      CompanyService.repository.findById = jest.fn().mockResolvedValue({ id: '123', name: 'Old Corp' });
      
      await expect(
        CompanyService.update('123', { name: '' }, 'org-1', 'user-1')
      ).rejects.toThrow('Company name cannot be empty');
    });

    it('should throw error if updated name already exists', async () => {
      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(true);

      await expect(
        CompanyService.update('123', { name: 'Existing Corp' }, 'org-1', 'user-1')
      ).rejects.toThrow('A company with this name already exists');
    });

    it('should allow partial updates', async () => {
      const mockCompany = { id: '123', name: 'Acme Corp', industry: 'Tech' };

      CompanyService.repository.findById = jest.fn().mockResolvedValue({ id: '123', name: 'Acme Corp' });
      CompanyService.repository.update = jest.fn().mockResolvedValue(mockCompany);

      await CompanyService.update('123', { industry: 'Tech' }, 'org-1', 'user-1');

      const updateCall = CompanyService.repository.update.mock.calls[0];
      expect(updateCall[1]).toEqual({ industry: 'Tech' });
    });

    it('should return null if company not found', async () => {
      CompanyService.repository.update = jest.fn().mockResolvedValue(null);

      const result = await CompanyService.update(
        'non-existent',
        { name: 'Test' },
        'org-1',
        'user-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a company by ID', async () => {
      const mockCompany = {
        id: '123',
        name: 'Acme Corp',
        website: 'https://acme.com',
      };

      CompanyService.repository.findById = jest.fn().mockResolvedValue(mockCompany);

      const result = await CompanyService.findById('123', 'org-1');

      expect(result.name).toBe('Acme Corp');
      expect(result.display_name).toBe('Acme Corp');
      expect(result.has_website).toBe(true);
    });

    it('should return null if company not found', async () => {
      CompanyService.repository.findById = jest.fn().mockResolvedValue(null);

      const result = await CompanyService.findById('non-existent', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all companies for organization', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', website: 'https://a.com' },
        { id: '2', name: 'Company B', website: null },
      ];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue(mockCompanies);

      const result = await CompanyService.findAll('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].display_name).toBe('Company A');
      expect(result[0].has_website).toBe(true);
      expect(result[1].has_website).toBe(false);
    });

    it('should return empty array if no companies found', async () => {
      CompanyService.repository.findAll = jest.fn().mockResolvedValue([]);

      const result = await CompanyService.findAll('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a company', async () => {
      CompanyService.repository.findById = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });
      CompanyService.repository.delete = jest.fn().mockResolvedValue(true);

      const result = await CompanyService.delete('123', 'org-1', 'user-1');

      expect(result).toBe(true);
      expect(CompanyService.repository.delete).toHaveBeenCalledWith('123', 'org-1');
    });

    it('should return false if company not found', async () => {
      CompanyService.repository.delete = jest.fn().mockResolvedValue(false);

      const result = await CompanyService.delete('non-existent', 'org-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search companies by query', async () => {
      const mockCompanies = [
        { id: '1', name: 'Acme Corp', industry: 'Technology' },
        { id: '2', name: 'Acme Industries', industry: 'Manufacturing' },
      ];

      CompanyService.repository.search = jest.fn().mockResolvedValue(mockCompanies);

      const result = await CompanyService.search('org-1', 'acme', {});

      expect(result).toHaveLength(2);
      expect(CompanyService.repository.search).toHaveBeenCalledWith('org-1', 'acme', {});
    });

    it('should search with filters', async () => {
      const mockCompanies = [{ id: '1', name: 'Tech Corp', industry: 'Technology' }];

      CompanyService.repository.search = jest.fn().mockResolvedValue(mockCompanies);

      await CompanyService.search('org-1', 'tech', { industry: 'Technology' });

      expect(CompanyService.repository.search).toHaveBeenCalledWith('org-1', 'tech', {
        industry: 'Technology',
      });
    });
  });

  describe('findAllWithContactCount', () => {
    it('should get companies with contact counts', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', contact_count: 5 },
        { id: '2', name: 'Company B', contact_count: 0 },
      ];

      CompanyService.repository.findAllWithContactCount = jest
        .fn()
        .mockResolvedValue(mockCompanies);

      const result = await CompanyService.findAllWithContactCount('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].has_contacts).toBe(true);
      expect(result[1].has_contacts).toBe(false);
    });
  });

  describe('findByIdWithContacts', () => {
    it('should get company with all contacts', async () => {
      const mockCompany = {
        id: '123',
        name: 'Acme Corp',
        contacts: [
          { id: 'c1', full_name: 'John Doe' },
          { id: 'c2', full_name: 'Jane Smith' },
        ],
        contact_count: 2,
      };

      CompanyService.repository.findByIdWithContacts = jest
        .fn()
        .mockResolvedValue(mockCompany);

      const result = await CompanyService.findByIdWithContacts('123', 'org-1');

      expect(result.name).toBe('Acme Corp');
      expect(result.contacts).toHaveLength(2);
      expect(result.has_contacts).toBe(true);
    });

    it('should return null if company not found', async () => {
      CompanyService.repository.findByIdWithContacts = jest.fn().mockResolvedValue(null);

      const result = await CompanyService.findByIdWithContacts('non-existent', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('getStatsByIndustry', () => {
    it('should get statistics by industry', async () => {
      const mockStats = [
        { industry: 'Technology', count: '10', total_contacts: '50' },
        { industry: 'Finance', count: '5', total_contacts: '25' },
      ];

      CompanyService.repository.getStatsByIndustry = jest
        .fn()
        .mockResolvedValue(mockStats);

      const result = await CompanyService.getStatsByIndustry('org-1');

      expect(result.industries).toHaveLength(2);
      expect(result.total_industries).toBe(2);
      expect(result.total_companies).toBe(15);
      expect(result.total_contacts).toBe(75);
    });
  });

  describe('getStatsBySize', () => {
    it('should get statistics by company size', async () => {
      const mockStats = [
        { size: '1-10', count: '20', total_contacts: '30' },
        { size: '51-200', count: '10', total_contacts: '100' },
      ];

      CompanyService.repository.getStatsBySize = jest.fn().mockResolvedValue(mockStats);

      const result = await CompanyService.getStatsBySize('org-1');

      expect(result.sizes).toHaveLength(2);
      expect(result.total_companies).toBe(30);
      expect(result.total_contacts).toBe(130);
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create companies with validation', async () => {
      const companies = [
        { name: 'Company A', website: 'a.com' },
        { name: 'Company B', website: 'b.com' },
        { name: 'Company C', website: 'c.com' },
      ];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue([]);
      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await CompanyService.bulkCreate(companies, 'org-1', 'user-1');

      expect(result.created).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate names in batch', async () => {
      const companies = [
        { name: 'Company A', website: 'a.com' },
        { name: 'Company A', website: 'b.com' }, // Duplicate
      ];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue([]);
      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await CompanyService.bulkCreate(companies, 'org-1', 'user-1');

      expect(result.created).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Duplicate company name');
    });

    it('should detect existing company names', async () => {
      const companies = [{ name: 'Existing Company', website: 'test.com' }];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue([
        { id: '1', name: 'Existing Company' },
      ]);

      const result = await CompanyService.bulkCreate(companies, 'org-1', 'user-1');

      expect(result.created).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Duplicate company name');
    });

    it('should handle validation errors in bulk create', async () => {
      const companies = [
        { name: 'Valid Company', website: 'valid.com' },
        { name: 'X', website: 'invalid.com' }, // Too short
        { website: 'no-name.com' }, // Missing name
      ];

      CompanyService.repository.findAll = jest.fn().mockResolvedValue([]);
      CompanyService.repository.existsByName = jest.fn().mockResolvedValue(false);
      CompanyService.repository.create = jest.fn().mockImplementation((data) => ({
        id: Math.random().toString(),
        ...data,
      }));

      const result = await CompanyService.bulkCreate(companies, 'org-1', 'user-1');

      expect(result.created).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('validation helpers', () => {
    it('should validate website URLs correctly', () => {
      expect(CompanyService.isValidWebsite('https://example.com')).toBe(true);
      expect(CompanyService.isValidWebsite('http://example.com')).toBe(true);
      expect(CompanyService.isValidWebsite('example.com')).toBe(true);
      expect(CompanyService.isValidWebsite('subdomain.example.com')).toBe(true);
      expect(CompanyService.isValidWebsite('not-a-url')).toBe(false);
      expect(CompanyService.isValidWebsite('example')).toBe(false);
    });

    it('should validate email addresses correctly', () => {
      expect(CompanyService.isValidEmail('test@example.com')).toBe(true);
      expect(CompanyService.isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(CompanyService.isValidEmail('invalid-email')).toBe(false);
      expect(CompanyService.isValidEmail('@example.com')).toBe(false);
      expect(CompanyService.isValidEmail('test@')).toBe(false);
    });

    it('should validate phone numbers correctly', () => {
      expect(CompanyService.isValidPhone('+1234567890')).toBe(true);
      expect(CompanyService.isValidPhone('(123) 456-7890')).toBe(true);
      expect(CompanyService.isValidPhone('123-456-7890')).toBe(true);
      expect(CompanyService.isValidPhone('123')).toBe(false);
      expect(CompanyService.isValidPhone('abc')).toBe(false);
    });

    it('should normalize website URLs', () => {
      expect(CompanyService.normalizeWebsite('example.com')).toBe('https://example.com');
      expect(CompanyService.normalizeWebsite('https://example.com')).toBe(
        'https://example.com'
      );
      expect(CompanyService.normalizeWebsite('http://example.com')).toBe(
        'http://example.com'
      );
    });
  });
});
