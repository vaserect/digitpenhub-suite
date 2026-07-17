// backend/tests/repositories/CompanyRepository.test.js
// Phase 1 Implementation: Company Repository Unit Tests
// Date: 2026-07-16

const CompanyRepository = require('../../src/repositories/CompanyRepository');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('CompanyRepository', () => {
  let repository;
  let mockDb;
  let mockLogger;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };

    repository = new CompanyRepository();
    repository.db = mockDb;
    repository.logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new company successfully', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = {
        name: 'Acme Corp',
        industry: 'Technology',
        website: 'https://acme.com',
        email: 'contact@acme.com'
      };

      const mockResult = {
        rows: [{
          id: 'company-001',
          org_id: orgId,
          name: companyData.name,
          industry: companyData.industry,
          website: companyData.website,
          email: companyData.email,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.create(orgId, companyData, userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Company created',
        expect.objectContaining({ companyId: 'company-001', orgId, userId })
      );
    });

    it('should handle database errors', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const companyData = { name: 'Acme Corp' };

      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(repository.create(orgId, companyData, userId)).rejects.toThrow(dbError);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should retrieve company with related data', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';

      const mockResult = {
        rows: [{
          id: companyId,
          org_id: orgId,
          name: 'Acme Corp',
          industry: 'Technology',
          owner_name: 'John Doe',
          contact_count: 5,
          deal_count: 10,
          total_revenue: 100000,
          pipeline_value: 50000
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getById(orgId, companyId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(result.contact_count).toBe(5);
      expect(result.deal_count).toBe(10);
    });

    it('should return null when company not found', async () => {
      const orgId = 'org-123';
      const companyId = 'nonexistent';

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await repository.getById(orgId, companyId);

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list companies with pagination', async () => {
      const orgId = 'org-123';
      const filters = { page: 1, limit: 10 };

      const mockCountResult = { rows: [{ total: '25' }] };
      const mockDataResult = {
        rows: [
          { id: 'company-001', name: 'Acme Corp', contact_count: 5 },
          { id: 'company-002', name: 'Tech Inc', contact_count: 3 }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await repository.list(orgId, filters);

      expect(result.data).toEqual(mockDataResult.rows);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should filter by industry', async () => {
      const orgId = 'org-123';
      const filters = { industry: 'Technology', page: 1, limit: 10 };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.list(orgId, filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('c.industry = $2'),
        expect.any(Array)
      );
    });

    it('should filter by search term', async () => {
      const orgId = 'org-123';
      const filters = { search: 'acme', page: 1, limit: 10 };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.list(orgId, filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['org-123', '%acme%', 10, 0])
      );
    });
  });

  describe('update', () => {
    it('should update company successfully', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';
      const updates = {
        name: 'Updated Corp',
        industry: 'Finance'
      };

      const mockResult = {
        rows: [{
          id: companyId,
          name: updates.name,
          industry: updates.industry,
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.update(orgId, companyId, updates, userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw error when no valid fields to update', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';
      const updates = { invalidField: 'value' };

      await expect(repository.update(orgId, companyId, updates, userId))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should soft delete company successfully', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const userId = 'user-456';

      mockDb.query.mockResolvedValue({ rows: [{ id: companyId }] });

      const result = await repository.delete(orgId, companyId, userId);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getContacts', () => {
    it('should retrieve contacts for company', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const filters = { page: 1, limit: 10 };

      const mockCountResult = { rows: [{ total: '5' }] };
      const mockDataResult = {
        rows: [
          { id: 'contact-001', first_name: 'John', last_name: 'Doe' },
          { id: 'contact-002', first_name: 'Jane', last_name: 'Smith' }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await repository.getContacts(orgId, companyId, filters);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
    });
  });

  describe('getDeals', () => {
    it('should retrieve deals for company', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';
      const filters = { status: 'open', page: 1, limit: 10 };

      const mockCountResult = { rows: [{ total: '3' }] };
      const mockDataResult = {
        rows: [
          { id: 'deal-001', name: 'Deal 1', amount: 10000 },
          { id: 'deal-002', name: 'Deal 2', amount: 20000 }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await repository.getDeals(orgId, companyId, filters);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
    });
  });

  describe('getStatistics', () => {
    it('should retrieve company statistics', async () => {
      const orgId = 'org-123';
      const companyId = 'company-001';

      const mockResult = {
        rows: [{
          contact_count: 5,
          total_deals: 10,
          open_deals: 3,
          won_deals: 6,
          lost_deals: 1,
          total_revenue: 150000,
          pipeline_value: 75000,
          avg_deal_size: 25000
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getStatistics(orgId, companyId);

      expect(result.contact_count).toBe(5);
      expect(result.total_deals).toBe(10);
      expect(result.total_revenue).toBe(150000);
    });
  });

  describe('searchByName', () => {
    it('should search companies by name', async () => {
      const orgId = 'org-123';
      const searchTerm = 'acme';
      const limit = 5;

      const mockResult = {
        rows: [
          { id: 'company-001', name: 'Acme Corp', industry: 'Technology' },
          { id: 'company-002', name: 'Acme Industries', industry: 'Manufacturing' }
        ]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.searchByName(orgId, searchTerm, limit);

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        [orgId, `%${searchTerm}%`, limit]
      );
    });
  });
});
