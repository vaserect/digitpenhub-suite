// backend/tests/repositories/PipelineRepository.test.js
// Phase 1 Implementation: Pipeline Repository Unit Tests
// Date: 2026-07-16

const PipelineRepository = require('../../src/repositories/PipelineRepository');
const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('PipelineRepository', () => {
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

    repository = new PipelineRepository();
    repository.db = mockDb;
    repository.logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new pipeline with default stages', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const pipelineData = {
        name: 'Sales Pipeline',
        description: 'Main sales pipeline'
      };

      const mockPipelineResult = {
        rows: [{
          id: 'pipeline-001',
          org_id: orgId,
          name: pipelineData.name,
          description: pipelineData.description,
          is_default: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      const mockStagesResult = {
        rows: [
          { id: 'stage-001', name: 'Lead', display_order: 1 },
          { id: 'stage-002', name: 'Qualified', display_order: 2 },
          { id: 'stage-003', name: 'Proposal', display_order: 3 },
          { id: 'stage-004', name: 'Negotiation', display_order: 4 },
          { id: 'stage-005', name: 'Closed Won', display_order: 5 },
          { id: 'stage-006', name: 'Closed Lost', display_order: 6 }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockPipelineResult)
        .mockResolvedValueOnce(mockStagesResult);

      const result = await repository.create(orgId, pipelineData, userId);

      expect(result.id).toBe('pipeline-001');
      expect(result.stages).toHaveLength(6);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Pipeline created with default stages',
        expect.objectContaining({ pipelineId: 'pipeline-001', stageCount: 6 })
      );
    });

    it('should set first pipeline as default', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const pipelineData = { name: 'First Pipeline' };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'pipeline-001', is_default: true }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repository.create(orgId, pipelineData, userId);

      expect(result.is_default).toBe(true);
    });

    it('should handle database errors', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';
      const pipelineData = { name: 'Test Pipeline' };

      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(repository.create(orgId, pipelineData, userId)).rejects.toThrow(dbError);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should retrieve pipeline with stages', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';

      const mockPipelineResult = {
        rows: [{
          id: pipelineId,
          org_id: orgId,
          name: 'Sales Pipeline',
          is_default: true,
          deal_count: 25
        }]
      };

      const mockStagesResult = {
        rows: [
          { id: 'stage-001', name: 'Lead', display_order: 1, deal_count: 5 },
          { id: 'stage-002', name: 'Qualified', display_order: 2, deal_count: 8 }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockPipelineResult)
        .mockResolvedValueOnce(mockStagesResult);

      const result = await repository.getById(orgId, pipelineId);

      expect(result.id).toBe(pipelineId);
      expect(result.stages).toHaveLength(2);
      expect(result.deal_count).toBe(25);
    });

    it('should return null when pipeline not found', async () => {
      const orgId = 'org-123';
      const pipelineId = 'nonexistent';

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await repository.getById(orgId, pipelineId);

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list pipelines with pagination', async () => {
      const orgId = 'org-123';
      const filters = { page: 1, limit: 10 };

      const mockCountResult = { rows: [{ total: '5' }] };
      const mockDataResult = {
        rows: [
          { id: 'pipeline-001', name: 'Sales Pipeline', is_default: true, deal_count: 25 },
          { id: 'pipeline-002', name: 'Support Pipeline', is_default: false, deal_count: 10 }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const result = await repository.list(orgId, filters);

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should filter by search term', async () => {
      const orgId = 'org-123';
      const filters = { search: 'sales', page: 1, limit: 10 };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.list(orgId, filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['org-123', '%sales%', 10, 0])
      );
    });
  });

  describe('update', () => {
    it('should update pipeline successfully', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';
      const userId = 'user-456';
      const updates = {
        name: 'Updated Pipeline',
        description: 'New description'
      };

      const mockResult = {
        rows: [{
          id: pipelineId,
          name: updates.name,
          description: updates.description,
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.update(orgId, pipelineId, updates, userId);

      expect(result.name).toBe(updates.name);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw error when no valid fields to update', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';
      const userId = 'user-456';
      const updates = { invalidField: 'value' };

      await expect(repository.update(orgId, pipelineId, updates, userId))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should soft delete pipeline successfully', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';
      const userId = 'user-456';

      mockDb.query.mockResolvedValue({ rows: [{ id: pipelineId }] });

      const result = await repository.delete(orgId, pipelineId, userId);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should prevent deletion of default pipeline', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';
      const userId = 'user-456';

      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(repository.delete(orgId, pipelineId, userId))
        .rejects.toThrow('Cannot delete default pipeline');
    });
  });

  describe('setDefault', () => {
    it('should set pipeline as default', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-002';
      const userId = 'user-456';

      const mockResult = {
        rows: [{
          id: pipelineId,
          is_default: true
        }]
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Clear old default
        .mockResolvedValueOnce(mockResult); // Set new default

      const result = await repository.setDefault(orgId, pipelineId, userId);

      expect(result.is_default).toBe(true);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getDefault', () => {
    it('should retrieve default pipeline', async () => {
      const orgId = 'org-123';

      const mockResult = {
        rows: [{
          id: 'pipeline-001',
          name: 'Default Pipeline',
          is_default: true
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getDefault(orgId);

      expect(result.id).toBe('pipeline-001');
      expect(result.is_default).toBe(true);
    });

    it('should return null when no default pipeline exists', async () => {
      const orgId = 'org-123';

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await repository.getDefault(orgId);

      expect(result).toBeNull();
    });
  });

  describe('Stage Management', () => {
    describe('createStage', () => {
      it('should create a new stage', async () => {
        const orgId = 'org-123';
        const pipelineId = 'pipeline-001';
        const userId = 'user-456';
        const stageData = {
          name: 'New Stage',
          probability: 50,
          color: '#FF5733'
        };

        const mockResult = {
          rows: [{
            id: 'stage-007',
            pipeline_id: pipelineId,
            name: stageData.name,
            probability: stageData.probability,
            color: stageData.color,
            display_order: 7
          }]
        };

        mockDb.query.mockResolvedValue(mockResult);

        const result = await repository.createStage(orgId, pipelineId, stageData, userId);

        expect(result.id).toBe('stage-007');
        expect(result.name).toBe(stageData.name);
        expect(mockLogger.info).toHaveBeenCalled();
      });
    });

    describe('updateStage', () => {
      it('should update stage successfully', async () => {
        const orgId = 'org-123';
        const pipelineId = 'pipeline-001';
        const stageId = 'stage-001';
        const userId = 'user-456';
        const updates = {
          name: 'Updated Stage',
          probability: 75
        };

        const mockResult = {
          rows: [{
            id: stageId,
            name: updates.name,
            probability: updates.probability
          }]
        };

        mockDb.query.mockResolvedValue(mockResult);

        const result = await repository.updateStage(orgId, pipelineId, stageId, updates, userId);

        expect(result.name).toBe(updates.name);
        expect(mockLogger.info).toHaveBeenCalled();
      });
    });

    describe('deleteStage', () => {
      it('should soft delete stage successfully', async () => {
        const orgId = 'org-123';
        const pipelineId = 'pipeline-001';
        const stageId = 'stage-001';
        const userId = 'user-456';

        mockDb.query.mockResolvedValue({ rows: [{ id: stageId }] });

        const result = await repository.deleteStage(orgId, pipelineId, stageId, userId);

        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalled();
      });

      it('should prevent deletion of stage with active deals', async () => {
        const orgId = 'org-123';
        const pipelineId = 'pipeline-001';
        const stageId = 'stage-001';
        const userId = 'user-456';

        mockDb.query.mockResolvedValue({ rows: [] });

        await expect(repository.deleteStage(orgId, pipelineId, stageId, userId))
          .rejects.toThrow('Cannot delete stage with active deals');
      });
    });

    describe('reorderStages', () => {
      it('should reorder stages successfully', async () => {
        const orgId = 'org-123';
        const pipelineId = 'pipeline-001';
        const userId = 'user-456';
        const stageOrder = [
          { id: 'stage-002', display_order: 1 },
          { id: 'stage-001', display_order: 2 },
          { id: 'stage-003', display_order: 3 }
        ];

        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await repository.reorderStages(orgId, pipelineId, stageOrder, userId);

        expect(result).toBe(true);
        expect(mockDb.query).toHaveBeenCalledTimes(3);
        expect(mockLogger.info).toHaveBeenCalled();
      });
    });
  });

  describe('getStatistics', () => {
    it('should retrieve pipeline statistics', async () => {
      const orgId = 'org-123';
      const pipelineId = 'pipeline-001';

      const mockResult = {
        rows: [{
          total_deals: 50,
          open_deals: 30,
          won_deals: 15,
          lost_deals: 5,
          total_value: 500000,
          avg_deal_size: 10000,
          win_rate: 75.0,
          avg_days_to_close: 45
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await repository.getStatistics(orgId, pipelineId);

      expect(result.total_deals).toBe(50);
      expect(result.win_rate).toBe(75.0);
      expect(result.avg_days_to_close).toBe(45);
    });
  });
});
