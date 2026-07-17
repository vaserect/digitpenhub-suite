// backend/tests/repositories/DealRepository.test.js
// Phase 1 Implementation: Deal Repository Unit Tests
// Date: 2026-07-16

const DealRepository = require('../../src/repositories/DealRepository');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('DealRepository', () => {
  let repository;
  let mockDb;
  let mockLogger;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: jest.fn()
    };

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };

    // Create repository instance with mocks
    repository = new DealRepository();
    repository.db = mockDb;
    repository.logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new deal successfully', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        name: 'Test Deal',
        pipelineId: 'pipeline-789',
        stageId: 'stage-101',
        amount: 50000,
        currency: 'USD',
        probability: 50
      };

      const mockResult = {
        rows: [{
          id: 'deal-001',
          org_id: orgId,
          name: dealData.name,
          pipeline_id: dealData.pipelineId,
          stage_id: dealData.stageId,
          amount: dealData.amount,
          currency: dealData.currency,
          probability: dealData.probability,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.create(orgId, dealData, userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deal created',
        expect.objectContaining({ dealId: 'deal-001', orgId, userId })
      );
    });

    it('should handle database errors', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        name: 'Test Deal',
        pipelineId: 'pipeline-789',
        stageId: 'stage-101'
      };

      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(repository.create(orgId, dealData, userId)).rejects.toThrow(dbError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating deal',
        expect.objectContaining({ error: dbError.message, orgId, userId })
      );
    });
  });

  describe('getById', () => {
    it('should retrieve a deal by ID with related data', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';

      const mockResult = {
        rows: [{
          id: dealId,
          org_id: orgId,
          name: 'Test Deal',
          amount: 50000,
          contact_name: 'John Doe',
          contact_email: 'john@example.com',
          company_name: 'Acme Corp',
          pipeline_name: 'Sales Pipeline',
          stage_name: 'Proposal',
          owner_name: 'Jane Smith',
          product_count: 3,
          products_total: 45000
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getById(orgId, dealId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [dealId, orgId]
      );
    });

    it('should return null when deal not found', async () => {
      const orgId = 'org-123';
      const dealId = 'nonexistent';

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await repository.getById(orgId, dealId);

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list deals with pagination', async () => {
      const orgId = 'org-123';
      const filters = {
        page: 1,
        limit: 10
      };

      const mockCountResult = { rows: [{ total: '25' }] };
      const mockDataResult = {
        rows: [
          { id: 'deal-001', name: 'Deal 1', amount: 10000 },
          { id: 'deal-002', name: 'Deal 2', amount: 20000 }
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

    it('should filter deals by pipeline', async () => {
      const orgId = 'org-123';
      const filters = {
        pipelineId: 'pipeline-789',
        page: 1,
        limit: 10
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.list(orgId, filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('d.pipeline_id = $2'),
        expect.any(Array)
      );
    });

    it('should filter deals by search term', async () => {
      const orgId = 'org-123';
      const filters = {
        search: 'important',
        page: 1,
        limit: 10
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '3' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.list(orgId, filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['org-123', '%important%', 10, 0])
      );
    });
  });

  describe('update', () => {
    it('should update deal successfully', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const updates = {
        name: 'Updated Deal Name',
        amount: 75000
      };

      const mockResult = {
        rows: [{
          id: dealId,
          name: updates.name,
          amount: updates.amount,
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.update(orgId, dealId, updates, userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deal updated',
        expect.objectContaining({ dealId, orgId, userId })
      );
    });

    it('should throw error when no valid fields to update', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const updates = {
        invalidField: 'value'
      };

      await expect(repository.update(orgId, dealId, updates, userId))
        .rejects.toThrow('No valid fields to update');
    });

    it('should throw error when deal not found', async () => {
      const orgId = 'org-123';
      const dealId = 'nonexistent';
      const userId = 'user-456';
      const updates = { name: 'New Name' };

      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(repository.update(orgId, dealId, updates, userId))
        .rejects.toThrow('Deal not found');
    });
  });

  describe('delete', () => {
    it('should soft delete deal successfully', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';

      mockDb.query.mockResolvedValue({ rows: [{ id: dealId }] });

      const result = await repository.delete(orgId, dealId, userId);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deal deleted',
        expect.objectContaining({ dealId, orgId, userId })
      );
    });

    it('should throw error when deal not found', async () => {
      const orgId = 'org-123';
      const dealId = 'nonexistent';
      const userId = 'user-456';

      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(repository.delete(orgId, dealId, userId))
        .rejects.toThrow('Deal not found');
    });
  });

  describe('addProduct', () => {
    it('should add product to deal successfully', async () => {
      const dealId = 'deal-001';
      const productData = {
        name: 'Product A',
        quantity: 2,
        unitPrice: 1000,
        totalPrice: 2000
      };

      const mockResult = {
        rows: [{
          id: 'product-001',
          deal_id: dealId,
          ...productData
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.addProduct(dealId, productData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Product added to deal',
        expect.objectContaining({ dealId, productId: 'product-001' })
      );
    });
  });

  describe('getProducts', () => {
    it('should retrieve all products for a deal', async () => {
      const dealId = 'deal-001';

      const mockResult = {
        rows: [
          { id: 'product-001', name: 'Product A', quantity: 2 },
          { id: 'product-002', name: 'Product B', quantity: 1 }
        ]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getProducts(dealId);

      expect(result).toEqual(mockResult.rows);
      expect(result).toHaveLength(2);
    });
  });

  describe('removeProduct', () => {
    it('should remove product from deal successfully', async () => {
      const dealId = 'deal-001';
      const productId = 'product-001';

      mockDb.query.mockResolvedValue({ rows: [{ id: productId }] });

      const result = await repository.removeProduct(dealId, productId);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Product removed from deal',
        expect.objectContaining({ dealId, productId })
      );
    });

    it('should throw error when product not found', async () => {
      const dealId = 'deal-001';
      const productId = 'nonexistent';

      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(repository.removeProduct(dealId, productId))
        .rejects.toThrow('Product not found');
    });
  });

  describe('getPipelineMetrics', () => {
    it('should retrieve pipeline metrics', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-789';

      const mockResult = {
        rows: [
          { stage_name: 'Lead', deal_count: 10, total_value: 100000 },
          { stage_name: 'Qualified', deal_count: 5, total_value: 75000 }
        ]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getPipelineMetrics(orgId, pipelineId);

      expect(result).toEqual(mockResult.rows);
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(repository.camelToSnake('firstName')).toBe('first_name');
      expect(repository.camelToSnake('expectedCloseDate')).toBe('expected_close_date');
      expect(repository.camelToSnake('name')).toBe('name');
    });
  });
});
