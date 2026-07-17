// backend/tests/controllers/CompanyController.test.js
// Phase 1 Implementation: Company Controller Unit Tests
// Date: 2026-07-16

const CompanyController = require('../../src/controllers/crm/CompanyController');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('CompanyController', () => {
  let controller;
  let mockCompanyService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockCompanyService = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      checkDuplicates: jest.fn(),
      merge: jest.fn(),
      getContacts: jest.fn(),
      getDeals: jest.fn(),
      getStatistics: jest.fn(),
      calculateHealthScore: jest.fn()
    };

    controller = new CompanyController(mockCompanyService);

    mockReq = {
      user: { id: 'user-123', org_id: 'org-456' },
      params: {},
      body: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a company successfully', async () => {
      const companyData = {
        name: 'Acme Corp',
        industry: 'Technology',
        website: 'https://acme.com',
        email: 'contact@acme.com'
      };

      const mockCompany = {
        id: 'company-001',
        ...companyData,
        created_at: new Date()
      };

      mockReq.body = companyData;
      mockCompanyService.create.mockResolvedValue(mockCompany);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockCompanyService.create).toHaveBeenCalledWith(
        'org-456',
        companyData,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCompany
      });
    });

    it('should handle duplicate company error', async () => {
      mockReq.body = { name: 'Existing Corp' };

      const duplicateError = new Error('Company already exists');
      duplicateError.name = 'DuplicateError';
      mockCompanyService.create.mockRejectedValue(duplicateError);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
    });

    it('should handle validation errors', async () => {
      mockReq.body = { name: '' }; // Invalid data

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockCompanyService.create.mockRejectedValue(validationError);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getById', () => {
    it('should retrieve a company by id', async () => {
      const companyId = 'company-001';
      const mockCompany = {
        id: companyId,
        name: 'Acme Corp',
        industry: 'Technology',
        contact_count: 5,
        deal_count: 10,
        health_score: 85
      };

      mockReq.params.id = companyId;
      mockCompanyService.getById.mockResolvedValue(mockCompany);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockCompanyService.getById).toHaveBeenCalledWith('org-456', companyId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCompany
      });
    });

    it('should handle company not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockCompanyService.getById.mockResolvedValue(null);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Company not found'
      });
    });
  });

  describe('list', () => {
    it('should list companies with pagination', async () => {
      const mockResult = {
        data: [
          { id: 'company-001', name: 'Acme Corp', contact_count: 5 },
          { id: 'company-002', name: 'Tech Inc', contact_count: 3 }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false
        }
      };

      mockReq.query = { page: '1', limit: '10' };
      mockCompanyService.list.mockResolvedValue(mockResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockCompanyService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 10
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult
      });
    });

    it('should apply filters', async () => {
      mockReq.query = {
        page: '1',
        limit: '10',
        industry: 'Technology',
        owner_id: 'user-789',
        search: 'acme'
      };

      mockCompanyService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockCompanyService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 10,
        industry: 'Technology',
        owner_id: 'user-789',
        search: 'acme'
      });
    });

    it('should use default pagination values', async () => {
      mockReq.query = {};
      mockCompanyService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockCompanyService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });

  describe('update', () => {
    it('should update a company successfully', async () => {
      const companyId = 'company-001';
      const updates = {
        name: 'Updated Corp',
        industry: 'Finance'
      };

      const mockUpdatedCompany = {
        id: companyId,
        ...updates,
        updated_at: new Date()
      };

      mockReq.params.id = companyId;
      mockReq.body = updates;
      mockCompanyService.update.mockResolvedValue(mockUpdatedCompany);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockCompanyService.update).toHaveBeenCalledWith(
        'org-456',
        companyId,
        updates,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCompany
      });
    });

    it('should handle update errors', async () => {
      mockReq.params.id = 'company-001';
      mockReq.body = { email: 'invalid-email' };

      const validationError = new Error('Invalid email format');
      mockCompanyService.update.mockRejectedValue(validationError);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('delete', () => {
    it('should delete a company successfully', async () => {
      const companyId = 'company-001';

      mockReq.params.id = companyId;
      mockCompanyService.delete.mockResolvedValue(true);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockCompanyService.delete).toHaveBeenCalledWith(
        'org-456',
        companyId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Company deleted successfully'
      });
    });

    it('should handle deletion errors', async () => {
      mockReq.params.id = 'company-001';

      const error = new Error('Cannot delete company with active deals');
      mockCompanyService.delete.mockRejectedValue(error);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('checkDuplicates', () => {
    it('should check for duplicate companies', async () => {
      const mockDuplicates = [
        { id: 'company-002', name: 'Acme Corp', similarity: 95 },
        { id: 'company-003', name: 'ACME Corporation', similarity: 90 }
      ];

      mockReq.query = { name: 'Acme Corp' };
      mockCompanyService.checkDuplicates.mockResolvedValue(mockDuplicates);

      await controller.checkDuplicates(mockReq, mockRes, mockNext);

      expect(mockCompanyService.checkDuplicates).toHaveBeenCalledWith(
        'org-456',
        'Acme Corp',
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDuplicates
      });
    });

    it('should return empty array when no duplicates found', async () => {
      mockReq.query = { name: 'Unique Company' };
      mockCompanyService.checkDuplicates.mockResolvedValue([]);

      await controller.checkDuplicates(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });

  describe('merge', () => {
    it('should merge companies successfully', async () => {
      const sourceId = 'company-002';
      const targetId = 'company-001';

      const mockMergedCompany = {
        id: targetId,
        name: 'Acme Corp',
        contact_count: 10,
        deal_count: 15
      };

      mockReq.params.id = targetId;
      mockReq.body = { source_company_id: sourceId };
      mockCompanyService.merge.mockResolvedValue(mockMergedCompany);

      await controller.merge(mockReq, mockRes, mockNext);

      expect(mockCompanyService.merge).toHaveBeenCalledWith(
        'org-456',
        sourceId,
        targetId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMergedCompany,
        message: 'Companies merged successfully'
      });
    });

    it('should handle merge errors', async () => {
      mockReq.params.id = 'company-001';
      mockReq.body = { source_company_id: 'company-001' }; // Same company

      const error = new Error('Cannot merge company with itself');
      mockCompanyService.merge.mockRejectedValue(error);

      await controller.merge(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getContacts', () => {
    it('should retrieve contacts for company', async () => {
      const companyId = 'company-001';
      const mockResult = {
        data: [
          { id: 'contact-001', first_name: 'John', last_name: 'Doe' },
          { id: 'contact-002', first_name: 'Jane', last_name: 'Smith' }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockReq.params.id = companyId;
      mockReq.query = { page: '1', limit: '10' };
      mockCompanyService.getContacts.mockResolvedValue(mockResult);

      await controller.getContacts(mockReq, mockRes, mockNext);

      expect(mockCompanyService.getContacts).toHaveBeenCalledWith(
        'org-456',
        companyId,
        { page: 1, limit: 10 }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult
      });
    });
  });

  describe('getDeals', () => {
    it('should retrieve deals for company', async () => {
      const companyId = 'company-001';
      const mockResult = {
        data: [
          { id: 'deal-001', name: 'Deal 1', amount: 10000 },
          { id: 'deal-002', name: 'Deal 2', amount: 20000 }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockReq.params.id = companyId;
      mockReq.query = { page: '1', limit: '10', status: 'open' };
      mockCompanyService.getDeals.mockResolvedValue(mockResult);

      await controller.getDeals(mockReq, mockRes, mockNext);

      expect(mockCompanyService.getDeals).toHaveBeenCalledWith(
        'org-456',
        companyId,
        { page: 1, limit: 10, status: 'open' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult
      });
    });
  });

  describe('getStatistics', () => {
    it('should retrieve company statistics', async () => {
      const companyId = 'company-001';
      const mockStats = {
        contact_count: 5,
        total_deals: 10,
        open_deals: 3,
        won_deals: 6,
        lost_deals: 1,
        total_revenue: 150000,
        pipeline_value: 75000,
        avg_deal_size: 25000,
        health_score: 85
      };

      mockReq.params.id = companyId;
      mockCompanyService.getStatistics.mockResolvedValue(mockStats);

      await controller.getStatistics(mockReq, mockRes, mockNext);

      expect(mockCompanyService.getStatistics).toHaveBeenCalledWith(
        'org-456',
        companyId
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate company health score', async () => {
      const companyId = 'company-001';
      const mockScore = {
        overall_score: 85,
        factors: {
          contact_engagement: 90,
          deal_activity: 85,
          revenue_trend: 80,
          pipeline_health: 85
        }
      };

      mockReq.params.id = companyId;
      mockCompanyService.calculateHealthScore.mockResolvedValue(mockScore);

      await controller.calculateHealthScore(mockReq, mockRes, mockNext);

      expect(mockCompanyService.calculateHealthScore).toHaveBeenCalledWith(
        'org-456',
        companyId
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockScore
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', async () => {
      mockReq.params = {}; // Missing id

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('required')
        })
      );
    });

    it('should handle invalid pagination parameters', async () => {
      mockReq.query = { page: 'invalid', limit: 'invalid' };
      mockCompanyService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      // Should use default values
      expect(mockCompanyService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });
});
