// backend/src/services/crm/PipelineService.js
// Phase 1 Implementation: Pipeline Service
// Date: 2026-07-16

const BaseService = require('../base/BaseService');
const PipelineRepository = require('../../repositories/crm/PipelineRepository');
const ActivityService = require('./ActivityService');
const eventBus = require('../../utils/eventBus');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Service for CRM Pipelines
 * Handles business logic for pipeline and stage management
 */
class PipelineService extends BaseService {
  constructor() {
    super(PipelineRepository);
    this.activityService = new ActivityService();
  }

  /**
   * Create a new pipeline
   * @param {string} orgId - Organization ID
   * @param {Object} pipelineData - Pipeline data
   * @param {string} userId - User creating the pipeline
   * @returns {Promise<Object>} Created pipeline with stages
   */
  async create(orgId, pipelineData, userId) {
    // Validate required fields
    this.validatePipelineData(pipelineData);

    // If this is the first pipeline, make it default
    const existingPipelines = await this.repository.list(orgId);
    if (existingPipelines.length === 0) {
      pipelineData.isDefault = true;
    }

    // Create pipeline
    const pipeline = await this.repository.create(orgId, pipelineData, userId);

    // Create default stages if provided
    if (pipelineData.stages && pipelineData.stages.length > 0) {
      const stages = [];
      for (let i = 0; i < pipelineData.stages.length; i++) {
        const stageData = {
          ...pipelineData.stages[i],
          displayOrder: i
        };
        const stage = await this.repository.createStage(pipeline.id, stageData, userId);
        stages.push(stage);
      }
      pipeline.stages = stages;
    } else {
      // Create default stages
      pipeline.stages = await this.createDefaultStages(pipeline.id, userId);
    }

    // Log activity
    await this.activityService.create(orgId, {
      type: 'pipeline_created',
      subject: `Pipeline created: ${pipeline.name}`,
      metadata: {
        pipelineName: pipeline.name,
        stageCount: pipeline.stages.length
      }
    }, userId);

    // Emit event
    eventBus.emit('pipeline.created', {
      pipeline,
      userId,
      orgId
    });

    logger.info('Pipeline created successfully', {
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      orgId,
      userId
    });

    return pipeline;
  }

  /**
   * Create default stages for a pipeline
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - User creating stages
   * @returns {Promise<Array>} Created stages
   */
  async createDefaultStages(pipelineId, userId) {
    const defaultStages = [
      { name: 'Lead', probability: 10, color: '#94A3B8', displayOrder: 0 },
      { name: 'Qualified', probability: 25, color: '#60A5FA', displayOrder: 1 },
      { name: 'Proposal', probability: 50, color: '#FBBF24', displayOrder: 2 },
      { name: 'Negotiation', probability: 75, color: '#F59E0B', displayOrder: 3 },
      { name: 'Closed Won', probability: 100, color: '#10B981', displayOrder: 4, isClosedWon: true },
      { name: 'Closed Lost', probability: 0, color: '#EF4444', displayOrder: 5, isClosedLost: true }
    ];

    const stages = [];
    for (const stageData of defaultStages) {
      const stage = await this.repository.createStage(pipelineId, stageData, userId);
      stages.push(stage);
    }

    return stages;
  }

  /**
   * Get pipeline by ID
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Object>} Pipeline with stages
   */
  async getById(orgId, pipelineId) {
    const pipeline = await this.repository.getById(orgId, pipelineId);
    if (!pipeline) {
      throw new NotFoundError('Pipeline not found');
    }

    // Get stages
    pipeline.stages = await this.repository.listStages(pipelineId);

    return pipeline;
  }

  /**
   * List pipelines
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Pipelines list
   */
  async list(orgId) {
    const pipelines = await this.repository.list(orgId);

    // Get stages for each pipeline
    for (const pipeline of pipelines) {
      pipeline.stages = await this.repository.listStages(pipeline.id);
    }

    return pipelines;
  }

  /**
   * Update pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the pipeline
   * @returns {Promise<Object>} Updated pipeline
   */
  async update(orgId, pipelineId, updates, userId) {
    // Get current pipeline
    const currentPipeline = await this.getById(orgId, pipelineId);

    // If setting as default, handle it separately
    if (updates.isDefault === true && !currentPipeline.isDefault) {
      return this.setDefault(orgId, pipelineId, userId);
    }

    // Update pipeline
    const updatedPipeline = await this.repository.update(orgId, pipelineId, updates, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'pipeline_updated',
      subject: `Pipeline updated: ${updatedPipeline.name}`,
      metadata: {
        pipelineName: updatedPipeline.name,
        updates: Object.keys(updates)
      }
    }, userId);

    // Emit event
    eventBus.emit('pipeline.updated', {
      pipeline: updatedPipeline,
      previousPipeline: currentPipeline,
      userId,
      orgId
    });

    logger.info('Pipeline updated successfully', {
      pipelineId,
      updates: Object.keys(updates),
      orgId,
      userId
    });

    return updatedPipeline;
  }

  /**
   * Delete pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - User deleting the pipeline
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, pipelineId, userId) {
    const pipeline = await this.getById(orgId, pipelineId);

    // Cannot delete default pipeline
    if (pipeline.isDefault) {
      throw new ValidationError('Cannot delete the default pipeline');
    }

    // Check if pipeline has active deals
    if (pipeline.deal_count > 0) {
      throw new ValidationError(
        `Cannot delete pipeline with ${pipeline.deal_count} active deal(s). Move or close deals first.`
      );
    }

    const result = await this.repository.delete(orgId, pipelineId, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'pipeline_deleted',
      subject: `Pipeline deleted: ${pipeline.name}`,
      metadata: {
        pipelineName: pipeline.name,
        stageCount: pipeline.stage_count
      }
    }, userId);

    // Emit event
    eventBus.emit('pipeline.deleted', {
      pipelineId,
      pipeline,
      userId,
      orgId
    });

    logger.info('Pipeline deleted successfully', {
      pipelineId,
      pipelineName: pipeline.name,
      orgId,
      userId
    });

    return result;
  }

  /**
   * Get default pipeline
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Default pipeline
   */
  async getDefault(orgId) {
    const pipeline = await this.repository.getDefault(orgId);
    if (!pipeline) {
      throw new NotFoundError('No default pipeline found');
    }

    pipeline.stages = await this.repository.listStages(pipeline.id);
    return pipeline;
  }

  /**
   * Set pipeline as default
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - User setting default
   * @returns {Promise<Object>} Updated pipeline
   */
  async setDefault(orgId, pipelineId, userId) {
    // Verify pipeline exists
    await this.getById(orgId, pipelineId);

    const pipeline = await this.repository.setDefault(orgId, pipelineId, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'pipeline_default_changed',
      subject: `Default pipeline changed to: ${pipeline.name}`,
      metadata: {
        pipelineName: pipeline.name
      }
    }, userId);

    // Emit event
    eventBus.emit('pipeline.default_changed', {
      pipeline,
      userId,
      orgId
    });

    logger.info('Default pipeline set', {
      pipelineId,
      pipelineName: pipeline.name,
      orgId,
      userId
    });

    return pipeline;
  }

  /**
   * Create a stage
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} stageData - Stage data
   * @param {string} userId - User creating the stage
   * @returns {Promise<Object>} Created stage
   */
  async createStage(orgId, pipelineId, stageData, userId) {
    // Verify pipeline exists
    await this.getById(orgId, pipelineId);

    // Validate stage data
    this.validateStageData(stageData);

    // Create stage
    const stage = await this.repository.createStage(pipelineId, stageData, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'stage_created',
      subject: `Stage created: ${stage.name}`,
      metadata: {
        stageName: stage.name,
        pipelineId
      }
    }, userId);

    // Emit event
    eventBus.emit('stage.created', {
      stage,
      pipelineId,
      userId,
      orgId
    });

    logger.info('Stage created successfully', {
      stageId: stage.id,
      stageName: stage.name,
      pipelineId,
      orgId,
      userId
    });

    return stage;
  }

  /**
   * Get stage by ID
   * @param {string} stageId - Stage ID
   * @returns {Promise<Object>} Stage data
   */
  async getStage(stageId) {
    const stage = await this.repository.getStage(stageId);
    if (!stage) {
      throw new NotFoundError('Stage not found');
    }
    return stage;
  }

  /**
   * List stages for pipeline
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Array>} Stages list
   */
  async listStages(pipelineId) {
    return this.repository.listStages(pipelineId);
  }

  /**
   * Update stage
   * @param {string} orgId - Organization ID
   * @param {string} stageId - Stage ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the stage
   * @returns {Promise<Object>} Updated stage
   */
  async updateStage(orgId, stageId, updates, userId) {
    // Get current stage
    const currentStage = await this.getStage(stageId);

    // Validate updates
    if (updates.probability !== undefined) {
      if (updates.probability < 0 || updates.probability > 100) {
        throw new ValidationError('Probability must be between 0 and 100');
      }
    }

    // Update stage
    const updatedStage = await this.repository.updateStage(stageId, updates, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'stage_updated',
      subject: `Stage updated: ${updatedStage.name}`,
      metadata: {
        stageName: updatedStage.name,
        updates: Object.keys(updates)
      }
    }, userId);

    // Emit event
    eventBus.emit('stage.updated', {
      stage: updatedStage,
      previousStage: currentStage,
      userId,
      orgId
    });

    logger.info('Stage updated successfully', {
      stageId,
      updates: Object.keys(updates),
      orgId,
      userId
    });

    return updatedStage;
  }

  /**
   * Delete stage
   * @param {string} orgId - Organization ID
   * @param {string} stageId - Stage ID
   * @param {string} userId - User deleting the stage
   * @returns {Promise<boolean>} Success status
   */
  async deleteStage(orgId, stageId, userId) {
    const stage = await this.getStage(stageId);

    // Check if stage has active deals
    if (stage.deal_count > 0) {
      throw new ValidationError(
        `Cannot delete stage with ${stage.deal_count} active deal(s). Move deals first.`
      );
    }

    const result = await this.repository.deleteStage(stageId, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'stage_deleted',
      subject: `Stage deleted: ${stage.name}`,
      metadata: {
        stageName: stage.name,
        pipelineId: stage.pipelineId
      }
    }, userId);

    // Emit event
    eventBus.emit('stage.deleted', {
      stageId,
      stage,
      userId,
      orgId
    });

    logger.info('Stage deleted successfully', {
      stageId,
      stageName: stage.name,
      orgId,
      userId
    });

    return result;
  }

  /**
   * Validate pipeline data
   * @param {Object} pipelineData - Pipeline data to validate
   * @throws {ValidationError} If validation fails
   */
  validatePipelineData(pipelineData) {
    if (!pipelineData.name || pipelineData.name.trim().length === 0) {
      throw new ValidationError('Pipeline name is required');
    }

    if (pipelineData.name.length > 255) {
      throw new ValidationError('Pipeline name must be 255 characters or less');
    }
  }

  /**
   * Validate stage data
   * @param {Object} stageData - Stage data to validate
   * @throws {ValidationError} If validation fails
   */
  validateStageData(stageData) {
    if (!stageData.name || stageData.name.trim().length === 0) {
      throw new ValidationError('Stage name is required');
    }

    if (stageData.name.length > 255) {
      throw new ValidationError('Stage name must be 255 characters or less');
    }

    if (stageData.probability !== undefined) {
      if (stageData.probability < 0 || stageData.probability > 100) {
        throw new ValidationError('Probability must be between 0 and 100');
      }
    }
  }
}

module.exports = PipelineService;
