// backend/tests/services/CompanyService.test.js
// Phase 1 Implementation: Company Service Unit Tests
// Date: 2026-07-16

const CompanyService = require('../../src/services/crm/CompanyService');
const CompanyRepository = require('../../src/repositories/CompanyRepository');
const ActivityService = require('../../src/services/crm/ActivityService');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

jest.mock('../../src/repositories/CompanyRepository');
jest.mock('../../src/services/crm/ActivityService');
jest.mock('../../utils/eventBus');

describe('CompanyService', () => {
  let service;
  let mockRepository;
  let mockActivityService;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      searchByName: jest.fn(),
      getContacts: jest.fn(),
      getDeals: jest.fn(),
      getStatistics: jest.fn()
    };

    mockActivityService = {
      create: jest.fn()
    };

    service = new CompanyService();
    service.repository = mockRepository;
    service.activityService = mockActivityService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a company successfully', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        name: 'Acme Corp',
        industry: 'Technology',
        website: 'https://acme.com'
      };

      const mockCompany = {
        id: 'company-001',
        ...companyData
      };

      mockRepository.searchByName.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(mockCompany);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.create(orgId, companyData, userId);

      expect(result).toEqual(mockCompany);
      expect(mockRepository.searchByName).toHaveBeenCalledWith(orgId, companyData.name, 1);
      expect(mockRepository.create).toHaveBeenCalledWith(orgId, companyData, userId);
      expect(mockActivityService.create).toHaveBeenCalled();
    });

    it('should throw ValidationError when name is missing', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        industry: 'Technology'
      };

      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow('Company name is required');
    });

    it('should throw ValidationError when duplicate company exists', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        name: 'Acme Corp'
      };

      mockRepository.searchByName.mockResolvedValue([
        { id: 'existing-001', name: 'Acme Corp' }
      ]);

      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow('A company with this name already exists');
    });

    it('should throw ValidationError for invalid email', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        name: 'Acme Corp',
        email: 'invalid-email'
      };

      mockRepository.searchByName.mockResolvedValue([]);

      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow('Invalid email address');
    });

    it('should throw ValidationError for invalid website URL', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        name: 'Acme Corp',
        website: 'not-a-url'
      };

      mockRepository.searchByName.mockResolvedValue([]);

      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, companyData, userId))
        .rejects.toThrow('Invalid website URL');
    });
  });

  describe('merge', () => {
    it('should merge two companies successfully', async () => {
      const orgId = 'org-123';
      const sourceId = 'company-001';
      const targetId = 'company-002';
      const userId = 'user-456';

      const sourceCompany = {
        id: sourceId,
        name: 'Source Corp',
        tags: ['tag1', 'tag2'],
        customFields: { field1: 'value1' }
      };

      const targetCompany = {
        id: targetId,
        name: 'Target Corp',
        tags: ['tag2', 'tag3'],
        customFields: { field2: 'value2' }
      };

      mockRepository.getById
        .mockResolvedValueOnce(sourceCompany)
        .mockResolvedValueOnce(targetCompany)
        .mockResolvedValueOnce({ ...targetCompany, tags: ['tag1', 'tag2', 'tag3'] });
      
      mockRepository.update.mockResolvedValue({});
      mockRepository.delete.mockResolvedValue(true);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.merge(orgId, sourceId, targetId, userId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        orgId,
        targetId,
        expect.objectContaining({
          tags: expect.arrayContaining(['tag1', 'tag2', 'tag3'])
        }),
        userId
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(orgId, sourceId, userId);
    });

    it('should throw ValidationError when merging company with itself', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';

      await expect(service.merge(orgId, companyId, companyId, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.merge(orgId, companyId, companyId, userId))
        .rejects.toThrow('Cannot merge a company with itself');
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score correctly', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';

      const mockCompany = {
        id: companyId,
        name: 'Acme Corp'
      };

      const mockStats = {
        contact_count: 5,
        total_deals: 10,
        total_revenue: 100000,
        pipeline_value: 50000
      };

      mockRepository.getById.mockResolvedValue(mockCompany);
      mockRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.calculateHealthScore(orgId, companyId);

      expect(result.score).toBeGreaterThan(0);
      expect(result.status).toBeDefined();
      expect(result.factors).toHaveLength(4);
      expect(result.factors[0].name).toBe('Contact Engagement');
      expect(result.factors[1].name).toBe('Deal Activity');
      expect(result.factors[2].name).toBe('Revenue Generation');
      expect(result.factors[3].name).toBe('Pipeline Value');
    });

    it('should return excellent status for high score', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';

      const mockCompany = { id: companyId, name: 'Acme Corp' };
      const mockStats = {
        contact_count: 10,
        total_deals: 20,
        total_revenue: 500000,
        pipeline_value: 200000
      };

      mockRepository.getById.mockResolvedValue(mockCompany);
      mockRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.calculateHealthScore(orgId, companyId);

      expect(result.status).toBe('excellent');
      expect(result.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('delete', () => {
    it('should throw ValidationError when company has active deals', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';

      const mockCompany = { id: companyId, name: 'Acme Corp' };
      const mockStats = { open_deals: 5 };

      mockRepository.getById.mockResolvedValue(mockCompany);
      mockRepository.getStatistics.mockResolvedValue(mockStats);

      await expect(service.delete(orgId, companyId, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.delete(orgId, companyId, userId))
        .rejects.toThrow('Cannot delete company with 5 active deal(s)');
    });

    it('should delete company successfully when no active deals', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';

      const mockCompany = { id: companyId, name: 'Acme Corp' };
      const mockStats = { open_deals: 0, contact_count: 2, total_deals: 3 };

      mockRepository.getById.mockResolvedValue(mockCompany);
      mockRepository.getStatistics.mockResolvedValue(mockStats);
      mockRepository.delete.mockResolvedValue(true);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.delete(orgId, companyId, userId);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(orgId, companyId, userId);
    });
  });

  describe('searchByName', () => {
    it('should search companies by name', async () => {
      const orgId = 'org-123';
      const searchTerm = 'Acme';

      const mockResults = [
        { id: 'company-001', name: 'Acme Corp' },
        { id: 'company-002', name: 'Acme Industries' }
      ];

      mockRepository.searchByName.mockResolvedValue(mockResults);

      const result = await service.searchByName(orgId, searchTerm);

      expect(result).toEqual(mockResults);
      expect(mockRepository.searchByName).toHaveBeenCalledWith(orgId, searchTerm, 10);
    });

    it('should throw ValidationError for short search term', async () => {
      const orgId = 'org-123';
      const searchTerm = 'A';

      await expect(service.searchByName(orgId, searchTerm))
        .rejects.toThrow(ValidationError);
      await expect(service.searchByName(orgId, searchTerm))
        .rejects.toThrow('Search term must be at least 2 characters');
    });
  });

  describe('validation helpers', () => {
    it('should validate email correctly', () => {
      expect(service.isValidEmail('test@example.com')).toBe(true);
      expect(service.isValidEmail('invalid-email')).toBe(false);
      expect(service.isValidEmail('test@')).toBe(false);
      expect(service.isValidEmail('@example.com')).toBe(false);
    });

    it('should validate URL correctly', () => {
      expect(service.isValidUrl('https://example.com')).toBe(true);
      expect(service.isValidUrl('http://example.com')).toBe(true);
      expect(service.isValidUrl('not-a-url')).toBe(false);
      expect(service.isValidUrl('example.com')).toBe(false);
    });
  });
});
