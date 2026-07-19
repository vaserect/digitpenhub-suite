// backend/tests/controllers/PipelineController.test.js
// Phase 1 Implementation: Pipeline Controller Unit Tests
// Date: 2026-07-16

const PipelineController = require('../../controllers/crm/PipelineController');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

describe('PipelineController', () => {
  let controller;
  let mockPipelineService;
  let mockReq;
  let mockNext;

  beforeEach(() => {
    mockPipelineService = {
      create: jest.fn(),
      getById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setDefault: jest.fn(),
      getDefault: jest.fn(),
      createStage: jest.fn(),
      updateStage: jest.fn(),
      deleteStage: jest.fn(),
      reorderStages: jest.fn(),
      getStatistics: jest.fn()
    };

    controller = new PipelineController(mockPipelineService);

    mockReq = {
      user: { id: 'user-123', orgId: 'org-456', userId: 'user-123' },
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
    it('should create a pipeline successfully', async () => {
      const pipelineData = {
        name: 'Sales Pipeline',
        description: 'Main sales pipeline'
      };

      const mockPipeline = {
        id: 'pipeline-001',
        ...pipelineData,
        is_default: true,
        stages: [
          { id: 'stage-001', name: 'Lead', display_order: 1 },
          { id: 'stage-002', name: 'Qualified', display_order: 2 }
        ],
        created_at: new Date()
      };

      mockReq.body = pipelineData;
      mockPipelineService.create.mockResolvedValue(mockPipeline);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockPipelineService.create).toHaveBeenCalledWith(
        'org-456',
        pipelineData,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPipeline
      });
    });

    it('should handle validation errors', async () => {
      mockReq.body = { name: '' }; // Invalid data

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockPipelineService.create.mockRejectedValue(validationError);

      await controller.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getById', () => {
    it('should retrieve a pipeline by id', async () => {
      const pipelineId = 'pipeline-001';
      const mockPipeline = {
        id: pipelineId,
        name: 'Sales Pipeline',
        is_default: true,
        deal_count: 25,
        stages: [
          { id: 'stage-001', name: 'Lead', deal_count: 5 },
          { id: 'stage-002', name: 'Qualified', deal_count: 8 }
        ]
      };

      mockReq.params.id = pipelineId;
      mockPipelineService.getById.mockResolvedValue(mockPipeline);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockPipelineService.getById).toHaveBeenCalledWith('org-456', pipelineId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPipeline
      });
    });

    it('should handle pipeline not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockPipelineService.getById.mockResolvedValue(null);

      await controller.getById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pipeline not found'
      });
    });
  });

  describe('list', () => {
    it('should list pipelines with pagination', async () => {
      const mockResult = {
        data: [
          { id: 'pipeline-001', name: 'Sales Pipeline', is_default: true, deal_count: 25 },
          { id: 'pipeline-002', name: 'Support Pipeline', is_default: false, deal_count: 10 }
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

      mockReq.query = { page: '1', limit: '10' };
      mockPipelineService.list.mockResolvedValue(mockResult);

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockPipelineService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 10
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult
      });
    });

    it('should apply search filter', async () => {
      mockReq.query = {
        page: '1',
        limit: '10',
        search: 'sales'
      };

      mockPipelineService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockPipelineService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 10,
        search: 'sales'
      });
    });

    it('should use default pagination values', async () => {
      mockReq.query = {};
      mockPipelineService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      expect(mockPipelineService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });

  describe('update', () => {
    it('should update a pipeline successfully', async () => {
      const pipelineId = 'pipeline-001';
      const updates = {
        name: 'Updated Pipeline',
        description: 'New description'
      };

      const mockUpdatedPipeline = {
        id: pipelineId,
        ...updates,
        updated_at: new Date()
      };

      mockReq.params.id = pipelineId;
      mockReq.body = updates;
      mockPipelineService.update.mockResolvedValue(mockUpdatedPipeline);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockPipelineService.update).toHaveBeenCalledWith(
        'org-456',
        pipelineId,
        updates,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedPipeline
      });
    });

    it('should handle update errors', async () => {
      mockReq.params.id = 'pipeline-001';
      mockReq.body = { name: '' };

      const validationError = new Error('Name is required');
      mockPipelineService.update.mockRejectedValue(validationError);

      await controller.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('delete', () => {
    it('should delete a pipeline successfully', async () => {
      const pipelineId = 'pipeline-001';

      mockReq.params.id = pipelineId;
      mockPipelineService.delete.mockResolvedValue(true);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockPipelineService.delete).toHaveBeenCalledWith(
        'org-456',
        pipelineId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Pipeline deleted successfully'
      });
    });

    it('should handle deletion errors', async () => {
      mockReq.params.id = 'pipeline-001';

      const error = new Error('Cannot delete default pipeline');
      mockPipelineService.delete.mockRejectedValue(error);

      await controller.delete(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('setDefault', () => {
    it('should set pipeline as default', async () => {
      const pipelineId = 'pipeline-002';

      const mockResult = {
        id: pipelineId,
        name: 'New Default Pipeline',
        is_default: true
      };

      mockReq.params.id = pipelineId;
      mockPipelineService.setDefault.mockResolvedValue(mockResult);

      await controller.setDefault(mockReq, mockRes, mockNext);

      expect(mockPipelineService.setDefault).toHaveBeenCalledWith(
        'org-456',
        pipelineId,
        'user-123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Default pipeline updated'
      });
    });
  });

  describe('getDefault', () => {
    it('should retrieve default pipeline', async () => {
      const mockPipeline = {
        id: 'pipeline-001',
        name: 'Default Pipeline',
        is_default: true,
        stages: []
      };

      mockPipelineService.getDefault.mockResolvedValue(mockPipeline);

      await controller.getDefault(mockReq, mockRes, mockNext);

      expect(mockPipelineService.getDefault).toHaveBeenCalledWith('org-456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPipeline
      });
    });

    it('should handle no default pipeline', async () => {
      mockPipelineService.getDefault.mockResolvedValue(null);

      await controller.getDefault(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No default pipeline found'
      });
    });
  });

  describe('Stage Management', () => {
    describe('createStage', () => {
      it('should create a new stage', async () => {
        const pipelineId = 'pipeline-001';
        const stageData = {
          name: 'New Stage',
          probability: 50,
          color: '#FF5733'
        };

        const mockStage = {
          id: 'stage-007',
          pipeline_id: pipelineId,
          ...stageData,
          display_order: 7
        };

        mockReq.params.id = pipelineId;
        mockReq.body = stageData;
        mockPipelineService.createStage.mockResolvedValue(mockStage);

        await controller.createStage(mockReq, mockRes, mockNext);

        expect(mockPipelineService.createStage).toHaveBeenCalledWith(
          'org-456',
          pipelineId,
          stageData,
          'user-123'
        );
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: mockStage
        });
      });
    });

    describe('updateStage', () => {
      it('should update a stage successfully', async () => {
        const pipelineId = 'pipeline-001';
        const stageId = 'stage-001';
        const updates = {
          name: 'Updated Stage',
          probability: 75
        };

        const mockUpdatedStage = {
          id: stageId,
          ...updates
        };

        mockReq.params = { id: pipelineId, stageId };
        mockReq.body = updates;
        mockPipelineService.updateStage.mockResolvedValue(mockUpdatedStage);

        await controller.updateStage(mockReq, mockRes, mockNext);

        expect(mockPipelineService.updateStage).toHaveBeenCalledWith(
          'org-456',
          pipelineId,
          stageId,
          updates,
          'user-123'
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: mockUpdatedStage
        });
      });
    });

    describe('deleteStage', () => {
      it('should delete a stage successfully', async () => {
        const pipelineId = 'pipeline-001';
        const stageId = 'stage-001';

        mockReq.params = { id: pipelineId, stageId };
        mockPipelineService.deleteStage.mockResolvedValue(true);

        await controller.deleteStage(mockReq, mockRes, mockNext);

        expect(mockPipelineService.deleteStage).toHaveBeenCalledWith(
          'org-456',
          pipelineId,
          stageId,
          'user-123'
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Stage deleted successfully'
        });
      });

      it('should handle deletion errors', async () => {
        mockReq.params = { id: 'pipeline-001', stageId: 'stage-001' };

        const error = new Error('Cannot delete stage with active deals');
        mockPipelineService.deleteStage.mockRejectedValue(error);

        await controller.deleteStage(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe.skip('reorderStages', () => {
      it('should reorder stages successfully', async () => {
        const pipelineId = 'pipeline-001';
        const stageOrder = [
          { id: 'stage-002', display_order: 1 },
          { id: 'stage-001', display_order: 2 },
          { id: 'stage-003', display_order: 3 }
        ];

        mockReq.params.id = pipelineId;
        mockReq.body = { stages: stageOrder };
        mockPipelineService.reorderStages.mockResolvedValue(true);

        await controller.reorderStages(mockReq, mockRes, mockNext);

        expect(mockPipelineService.reorderStages).toHaveBeenCalledWith(
          'org-456',
          pipelineId,
          stageOrder,
          'user-123'
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Stages reordered successfully'
        });
      });
    });
  });

  describe.skip('getStatistics', () => {
    it('should retrieve pipeline statistics', async () => {
      const pipelineId = 'pipeline-001';
      const mockStats = {
        total_deals: 50,
        open_deals: 30,
        won_deals: 15,
        lost_deals: 5,
        total_value: 500000,
        avg_deal_size: 10000,
        win_rate: 75.0,
        avg_days_to_close: 45,
        stage_distribution: [
          { stage_id: 'stage-001', stage_name: 'Lead', deal_count: 10 },
          { stage_id: 'stage-002', stage_name: 'Qualified', deal_count: 8 }
        ]
      };

      mockReq.params.id = pipelineId;
      mockPipelineService.getStatistics.mockResolvedValue(mockStats);

      await controller.getStatistics(mockReq, mockRes, mockNext);

      expect(mockPipelineService.getStatistics).toHaveBeenCalledWith(
        'org-456',
        pipelineId
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
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
      mockPipelineService.list.mockResolvedValue({ data: [], pagination: {} });

      await controller.list(mockReq, mockRes, mockNext);

      // Should use default values
      expect(mockPipelineService.list).toHaveBeenCalledWith('org-456', {
        page: 1,
        limit: 20
      });
    });
  });
});
