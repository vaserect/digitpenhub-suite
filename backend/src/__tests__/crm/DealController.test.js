// backend/tests/controllers/DealController.test.js
// Phase 1 Implementation: Deal Controller Unit Tests
// Date: 2026-07-16

const DealController = require('../../src/controllers/crm/DealController');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('DealController', () => {
  let controller;
  let mockDealService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockDealService = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addProduct: jest.fn(),
      removeProduct: jest.fn(),
      updateProduct: jest.fn(),
      changeStage: jest.fn(),
      getForecast: jest.fn()
    };

    controller = new DealController(mockDealService);

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
    it('should create a deal successfully', async () => {
      const dealData = {
        name: 'New Deal',
        amount: 50000,
        pipeline_id: 'pipeline-001',
        stage_id: 'stage-001',
        company_id: 'company-001'
      };

      const mockDeal = {
        id: 'deal-001',
        ...dealData,
        created_at: new Date()
      };

      mockReq.body = dealData;
      mockDealService.create.mockResolvedValue(mockDeal);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockDealService.create).toHaveBeenCalledWith(
        'org-456',
        dealData,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDeal
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = { name: '' }; // Invalid data

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockDealService.create.mockRejectedValue(validationError);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle service errors', async () => {
      mockReq.body = { name: 'Test Deal' };

      const serviceError = new Error('Service error');
      mockDealService.create.mockRejectedValue(serviceError);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getById', () => {
    it('should retrieve a deal by id', async () => {
      const dealId = 'deal-001';
      const mockDeal = {
        id: dealId,
        name: 'Test Deal',
        amount: 50000,
        products: [],
        company: { id: 'company-001', name: 'Acme Corp' }
      };

      mockReq.params.id = dealId;
      mockDealService.getById.mockResolvedValue(mockDeal);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockDealService.getById).toHaveBeenCalledWith('org-456', dealId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDeal
      });
    });

    it('should handle deal not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockDealService.getById.mockResolvedValue(null);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Deal not found'
      });
    });
  });

  describe('list', () => {
    it('should list deals with pagination', async () => {
      const mockResult = {
        data: [
          { id: 'deal-001', name: 'Deal 1', amount: 10000 },
          { id: 'deal-002', name: 'Deal 2', amount: 20000 }
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
      mockDealService.list.mockResolvedValue(mockResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockDealService.list).toHaveBeenCalledWith('org-456', {
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
        pipeline_id: 'pipeline-001',
        stage_id: 'stage-001',
        status: 'open',
        search: 'acme'
      };

      mockDealService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockDealService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 10,
        pipeline_id: 'pipeline-001',
        stage_id: 'stage-001',
        status: 'open',
        search: 'acme'
      });
    });

    it('should use default pagination values', async () => {
      mockReq.query = {};
      mockDealService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockDealService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });

  describe('update', () => {
    it('should update a deal successfully', async () => {
      const dealId = 'deal-001';
      const updates = {
        name: 'Updated Deal',
        amount: 75000
      };

      const mockUpdatedDeal = {
        id: dealId,
        ...updates,
        updated_at: new Date()
      };

      mockReq.params.id = dealId;
      mockReq.body = updates;
      mockDealService.update.mockResolvedValue(mockUpdatedDeal);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockDealService.update).toHaveBeenCalledWith(
        'org-456',
        dealId,
        updates,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedDeal
      });
    });

    it('should handle update errors', async () => {
      mockReq.params.id = 'deal-001';
      mockReq.body = { amount: -1000 }; // Invalid amount

      const validationError = new Error('Invalid amount');
      mockDealService.update.mockRejectedValue(validationError);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('delete', () => {
    it('should delete a deal successfully', async () => {
      const dealId = 'deal-001';

      mockReq.params.id = dealId;
      mockDealService.delete.mockResolvedValue(true);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockDealService.delete).toHaveBeenCalledWith(
        'org-456',
        dealId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Deal deleted successfully'
      });
    });

    it('should handle deletion errors', async () => {
      mockReq.params.id = 'deal-001';

      const error = new Error('Cannot delete deal');
      mockDealService.delete.mockRejectedValue(error);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addProduct', () => {
    it('should add a product to deal', async () => {
      const dealId = 'deal-001';
      const productData = {
        product_id: 'product-001',
        quantity: 5,
        unit_price: 100
      };

      const mockResult = {
        id: 'line-item-001',
        deal_id: dealId,
        ...productData,
        total: 500
      };

      mockReq.params.id = dealId;
      mockReq.body = productData;
      mockDealService.addProduct.mockResolvedValue(mockResult);

      await controller.addProduct(mockReq, mockRes, mockNext);

      expect(mockDealService.addProduct).toHaveBeenCalledWith(
        'org-456',
        dealId,
        productData,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  describe('removeProduct', () => {
    it('should remove a product from deal', async () => {
      const dealId = 'deal-001';
      const productId = 'product-001';

      mockReq.params = { id: dealId, productId };
      mockDealService.removeProduct.mockResolvedValue(true);

      await controller.removeProduct(mockReq, mockRes, mockNext);

      expect(mockDealService.removeProduct).toHaveBeenCalledWith(
        'org-456',
        dealId,
        productId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product removed successfully'
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product in deal', async () => {
      const dealId = 'deal-001';
      const productId = 'product-001';
      const updates = {
        quantity: 10,
        unit_price: 150
      };

      const mockResult = {
        id: 'line-item-001',
        ...updates,
        total: 1500
      };

      mockReq.params = { id: dealId, productId };
      mockReq.body = updates;
      mockDealService.updateProduct.mockResolvedValue(mockResult);

      await controller.updateProduct(mockReq, mockRes, mockNext);

      expect(mockDealService.updateProduct).toHaveBeenCalledWith(
        'org-456',
        dealId,
        productId,
        updates,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  describe('changeStage', () => {
    it('should change deal stage successfully', async () => {
      const dealId = 'deal-001';
      const stageData = {
        stage_id: 'stage-002',
        reason: 'Progressing to next stage'
      };

      const mockResult = {
        id: dealId,
        stage_id: stageData.stage_id,
        updated_at: new Date()
      };

      mockReq.params.id = dealId;
      mockReq.body = stageData;
      mockDealService.changeStage.mockResolvedValue(mockResult);

      await controller.changeStage(mockReq, mockRes, mockNext);

      expect(mockDealService.changeStage).toHaveBeenCalledWith(
        'org-456',
        dealId,
        stageData.stage_id,
        'user-123',
        stageData.reason
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });
  });

  describe('getForecast', () => {
    it('should retrieve sales forecast', async () => {
      const mockForecast = {
        committed: 100000,
        best_case: 150000,
        pipeline: 200000,
        closed: 50000,
        total_deals: 25,
        avg_deal_size: 8000
      };

      mockReq.query = {
        pipeline_id: 'pipeline-001',
        start_date: '2026-01-01',
        end_date: '2026-12-31'
      };

      mockDealService.getForecast.mockResolvedValue(mockForecast);

      await controller.getForecast(mockReq, mockRes, mockNext);

      expect(mockDealService.getForecast).toHaveBeenCalledWith('org-456', {
        pipeline_id: 'pipeline-001',
        start_date: '2026-01-01',
        end_date: '2026-12-31'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockForecast
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
      mockDealService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      // Should use default values
      expect(mockDealService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });
});
