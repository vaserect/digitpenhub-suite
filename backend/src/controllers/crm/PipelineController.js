// backend/src/controllers/crm/PipelineController.js
// Phase 1 Implementation: Pipeline Controller
// Date: 2026-07-16

const PipelineService = require('../../services/crm/PipelineService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Controller for CRM Pipelines API
 * Handles HTTP requests for pipeline and stage management
 */
class PipelineController {
  constructor(pipelineService) {
    this.pipelineService = pipelineService || new PipelineService();
  }

  /**
   * List pipelines
   * GET /api/crm/pipelines
   */
  async list(req, res, next) {
    try {
      const { orgId } = req.user;

      const pipelines = await this.pipelineService.list(orgId);

      res.json({
        success: true,
        data: pipelines
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get default pipeline
   * GET /api/crm/pipelines/default
   */
  async getDefault(req, res, next) {
    try {
      const { orgId } = req.user;

      const pipeline = await this.pipelineService.getDefault(orgId);

      res.json({
        success: true,
        data: pipeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pipeline by ID
   * GET /api/crm/pipelines/:id
   */
  async getById(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const pipeline = await this.pipelineService.getById(orgId, id);

      res.json({
        success: true,
        data: pipeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create pipeline
   * POST /api/crm/pipelines
   */
  async create(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const pipelineData = req.body;

      const pipeline = await this.pipelineService.create(orgId, pipelineData, userId);

      res.status(201).json({
        success: true,
        message: 'Pipeline created successfully',
        data: pipeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update pipeline
   * PUT /api/crm/pipelines/:id
   */
  async update(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const updates = req.body;

      const pipeline = await this.pipelineService.update(orgId, id, updates, userId);

      res.json({
        success: true,
        message: 'Pipeline updated successfully',
        data: pipeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set pipeline as default
   * PUT /api/crm/pipelines/:id/set-default
   */
  async setDefault(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;

      const pipeline = await this.pipelineService.setDefault(orgId, id, userId);

      res.json({
        success: true,
        message: 'Default pipeline set successfully',
        data: pipeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete pipeline
   * DELETE /api/crm/pipelines/:id
   */
  async delete(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;

      await this.pipelineService.delete(orgId, id, userId);

      res.json({
        success: true,
        message: 'Pipeline deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List stages for pipeline
   * GET /api/crm/pipelines/:id/stages
   */
  async listStages(req, res, next) {
    try {
      const { id } = req.params;

      const stages = await this.pipelineService.listStages(id);

      res.json({
        success: true,
        data: stages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create stage
   * POST /api/crm/pipelines/:id/stages
   */
  async createStage(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const stageData = req.body;

      const stage = await this.pipelineService.createStage(orgId, id, stageData, userId);

      res.status(201).json({
        success: true,
        message: 'Stage created successfully',
        data: stage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stage by ID
   * GET /api/crm/stages/:id
   */
  async getStage(req, res, next) {
    try {
      const { id } = req.params;

      const stage = await this.pipelineService.getStage(id);

      res.json({
        success: true,
        data: stage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update stage
   * PUT /api/crm/stages/:id
   */
  async updateStage(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const updates = req.body;

      const stage = await this.pipelineService.updateStage(orgId, id, updates, userId);

      res.json({
        success: true,
        message: 'Stage updated successfully',
        data: stage
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete stage
   * DELETE /api/crm/stages/:id
   */
  async deleteStage(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;

      await this.pipelineService.deleteStage(orgId, id, userId);

      res.json({
        success: true,
        message: 'Stage deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PipelineController;
