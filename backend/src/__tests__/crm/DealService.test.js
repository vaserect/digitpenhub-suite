// backend/tests/services/DealService.test.js
// Phase 1 Implementation: Deal Service Unit Tests
// Date: 2026-07-16

const DealService = require('../../services/crm/DealService');
const DealRepository = require('../../repositories/crm/DealRepository');
const PipelineService = require('../../services/crm/PipelineService');
const ActivityService = require('../../services/crm/ActivityService');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

jest.mock('../../repositories/crm/DealRepository');
jest.mock('../../services/crm/PipelineService');
jest.mock('../../services/crm/ActivityService');
jest.mock('../../utils/eventBus');

describe('DealService', () => {
  let service;
  let mockRepository;
  let mockPipelineService;
  let mockActivityService;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addProduct: jest.fn(),
      getProducts: jest.fn(),
      removeProduct: jest.fn(),
      getPipelineMetrics: jest.fn()
    };

    mockPipelineService = {
      getById: jest.fn(),
      getStage: jest.fn()
    };

    mockActivityService = {
      create: jest.fn()
    };

    service = new DealService();
    service.repository = mockRepository;
    service.pipelineService = mockPipelineService;
    service.activityService = mockActivityService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a deal successfully', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        name: 'Test Deal',
        pipelineId: 'pipeline-789',
        stageId: 'stage-101',
        amount: 50000
      };

      const mockPipeline = {
        id: 'pipeline-789',
        name: 'Sales Pipeline'
      };

      const mockStage = {
        id: 'stage-101',
        name: 'Proposal',
        pipelineId: 'pipeline-789',
        probability: 50
      };

      const mockDeal = {
        id: 'deal-001',
        ...dealData,
        probability: 50
      };

      mockPipelineService.getById.mockResolvedValue(mockPipeline);
      mockPipelineService.getStage.mockResolvedValue(mockStage);
      mockRepository.create.mockResolvedValue(mockDeal);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.create(orgId, dealData, userId);

      expect(result).toEqual(mockDeal);
      expect(mockPipelineService.getById).toHaveBeenCalledWith(orgId, dealData.pipelineId);
      expect(mockPipelineService.getStage).toHaveBeenCalledWith(dealData.stageId);
      expect(mockRepository.create).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({ probability: 50 }),
        userId
      );
      expect(mockActivityService.create).toHaveBeenCalled();
    });

    it('should throw ValidationError when name is missing', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        pipelineId: 'pipeline-789',
        stageId: 'stage-101'
      };

      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow('Deal name is required');
    });

    it('should throw NotFoundError when pipeline not found', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        name: 'Test Deal',
        pipelineId: 'nonexistent',
        stageId: 'stage-101'
      };

      mockPipelineService.getById.mockResolvedValue(null);

      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow(NotFoundError);
      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow('Pipeline not found');
    });

    it('should throw ValidationError when stage is invalid for pipeline', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const dealData = {
        name: 'Test Deal',
        pipelineId: 'pipeline-789',
        stageId: 'stage-101'
      };

      const mockPipeline = { id: 'pipeline-789', name: 'Sales Pipeline' };
      const mockStage = { id: 'stage-101', pipelineId: 'different-pipeline' };

      mockPipelineService.getById.mockResolvedValue(mockPipeline);
      mockPipelineService.getStage.mockResolvedValue(mockStage);

      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow(ValidationError);
      await expect(service.create(orgId, dealData, userId))
        .rejects.toThrow('Invalid stage for pipeline');
    });
  });

  describe('getById', () => {
    it('should retrieve a deal by ID', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';

      const mockDeal = {
        id: dealId,
        name: 'Test Deal',
        amount: 50000
      };

      mockRepository.getById.mockResolvedValue(mockDeal);

      const result = await service.getById(orgId, dealId);

      expect(result).toEqual(mockDeal);
      expect(mockRepository.getById).toHaveBeenCalledWith(orgId, dealId);
    });

    it('should throw NotFoundError when deal not found', async () => {
      const orgId = 'org-123';
      const dealId = 'nonexistent';

      mockRepository.getById.mockResolvedValue(null);

      await expect(service.getById(orgId, dealId))
        .rejects.toThrow(NotFoundError);
      await expect(service.getById(orgId, dealId))
        .rejects.toThrow('Deal not found');
    });
  });

  describe('update', () => {
    it('should update deal successfully', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const updates = {
        name: 'Updated Deal',
        amount: 75000
      };

      const currentDeal = {
        id: dealId,
        name: 'Test Deal',
        amount: 50000,
        stageId: 'stage-101',
        pipelineId: 'pipeline-789'
      };

      const updatedDeal = {
        ...currentDeal,
        ...updates
      };

      mockRepository.getById.mockResolvedValue(currentDeal);
      mockRepository.update.mockResolvedValue(updatedDeal);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.update(orgId, dealId, updates, userId);

      expect(result).toEqual(updatedDeal);
      expect(mockRepository.update).toHaveBeenCalledWith(orgId, dealId, updates, userId);
    });

    it('should update stage and probability when stage changes', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const updates = {
        stageId: 'stage-102'
      };

      const currentDeal = {
        id: dealId,
        stageId: 'stage-101',
        stageName: 'Proposal',
        pipelineId: 'pipeline-789'
      };

      const newStage = {
        id: 'stage-102',
        name: 'Negotiation',
        pipelineId: 'pipeline-789',
        probability: 75,
        isClosedWon: false,
        isClosedLost: false
      };

      const updatedDeal = {
        ...currentDeal,
        stageId: 'stage-102',
        stageName: 'Negotiation',
        probability: 75
      };

      mockRepository.getById.mockResolvedValue(currentDeal);
      mockPipelineService.getStage.mockResolvedValue(newStage);
      mockRepository.update.mockResolvedValue(updatedDeal);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.update(orgId, dealId, updates, userId);

      expect(mockPipelineService.getStage).toHaveBeenCalledWith('stage-102');
      expect(mockRepository.update).toHaveBeenCalledWith(
        orgId,
        dealId,
        expect.objectContaining({ probability: 75 }),
        userId
      );
      expect(mockActivityService.create).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({ type: 'deal_stage_changed' }),
        userId
      );
    });

    it('should auto-update status to won when moved to closed won stage', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const updates = { stageId: 'stage-won' };

      const currentDeal = {
        id: dealId,
        stageId: 'stage-101',
        pipelineId: 'pipeline-789'
      };

      const wonStage = {
        id: 'stage-won',
        pipelineId: 'pipeline-789',
        probability: 100,
        isClosedWon: true
      };

      mockRepository.getById.mockResolvedValue(currentDeal);
      mockPipelineService.getStage.mockResolvedValue(wonStage);
      mockRepository.update.mockResolvedValue({ ...currentDeal, status: 'won' });
      mockActivityService.create.mockResolvedValue({});

      await service.update(orgId, dealId, updates, userId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        orgId,
        dealId,
        expect.objectContaining({
          status: 'won',
          actualCloseDate: expect.any(Date)
        }),
        userId
      );
    });
  });

  describe('delete', () => {
    it('should delete deal successfully', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';

      const mockDeal = {
        id: dealId,
        name: 'Test Deal',
        amount: 50000
      };

      mockRepository.getById.mockResolvedValue(mockDeal);
      mockRepository.delete.mockResolvedValue(true);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.delete(orgId, dealId, userId);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(orgId, dealId, userId);
      expect(mockActivityService.create).toHaveBeenCalled();
    });
  });

  describe('addProduct', () => {
    it('should add product with calculated total price', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const productData = {
        name: 'Product A',
        quantity: 2,
        unitPrice: 1000,
        discountPercent: 10,
        taxPercent: 8
      };

      const mockDeal = { id: dealId };
      const mockProduct = {
        id: 'product-001',
        ...productData,
        totalPrice: 1944 // (2000 - 200) * 1.08
      };

      mockRepository.getById.mockResolvedValue(mockDeal);
      mockRepository.addProduct.mockResolvedValue(mockProduct);
      mockActivityService.create.mockResolvedValue({});

      const result = await service.addProduct(orgId, dealId, productData, userId);

      expect(mockRepository.addProduct).toHaveBeenCalledWith(
        dealId,
        expect.objectContaining({ totalPrice: expect.any(Number) })
      );
    });

    it('should throw ValidationError when product name is missing', async () => {
      const orgId = 'org-123';
      const dealId = 'deal-001';
      const userId = 'user-456';
      const productData = {
        quantity: 2,
        unitPrice: 1000
      };

      const mockDeal = { id: dealId };
      mockRepository.getById.mockResolvedValue(mockDeal);

      await expect(service.addProduct(orgId, dealId, productData, userId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('calculateForecast', () => {
    it('should calculate sales forecast correctly', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const mockDeals = {
        data: [
          { amount: 10000, probability: 80 },
          { amount: 20000, probability: 50 },
          { amount: 30000, probability: 25 }
        ]
      };

      const mockClosedDeals = {
        data: [
          { amount: 15000, actualCloseDate: new Date('2026-06-15') }
        ]
      };

      mockRepository.list
        .mockResolvedValueOnce(mockDeals)
        .mockResolvedValueOnce(mockClosedDeals);

      const result = await service.calculateForecast(orgId, userId, startDate, endDate);

      expect(result.committed).toBe(10000); // Only 80% probability
      expect(result.bestCase).toBe(60000); // All deals
      expect(result.pipeline).toBe(25500); // Weighted: 8000 + 10000 + 7500
      expect(result.closed).toBe(15000);
    });
  });

  describe('validateDealData', () => {
    it('should validate required fields', () => {
      expect(() => service.validateDealData({}))
        .toThrow('Deal name is required');

      expect(() => service.validateDealData({ name: 'Test' }))
        .toThrow('Pipeline ID is required');

      expect(() => service.validateDealData({ name: 'Test', pipelineId: 'p1' }))
        .toThrow('Stage ID is required');
    });

    it('should validate amount is not negative', () => {
      const dealData = {
        name: 'Test',
        pipelineId: 'p1',
        stageId: 's1',
        amount: -100
      };

      expect(() => service.validateDealData(dealData))
        .toThrow('Deal amount cannot be negative');
    });

    it('should validate probability range', () => {
      const dealData = {
        name: 'Test',
        pipelineId: 'p1',
        stageId: 's1',
        probability: 150
      };

      expect(() => service.validateDealData(dealData))
        .toThrow('Probability must be between 0 and 100');
    });
  });
});
