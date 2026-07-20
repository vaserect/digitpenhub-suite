// backend/src/controllers/crm/DealController.js
// Phase 1 Implementation: Deal Controller
// Date: 2026-07-16

const DealService = require('../../services/crm/DealService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Controller for CRM Deals API
 * Handles HTTP requests for deal management
 */
class DealController {
  constructor(dealService) {
    this.dealService = dealService || new DealService();
  }

  /**
   * List deals
   * GET /api/crm/deals
   */
  async list(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      
      const filters = {
        pipelineId: req.query.pipelineId,
        stageId: req.query.stageId,
        ownerId: req.query.ownerId,
        status: req.query.status || undefined,
        search: req.query.search,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await this.dealService.list(orgId, filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get deal by ID
   * GET /api/crm/deals/:id
   */
  async getById(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const deal = await this.dealService.getById(orgId, id);

      res.json({
        success: true,
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create deal
   * POST /api/crm/deals
   */
  async create(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const dealData = req.body;

      const deal = await this.dealService.create(orgId, dealData, userId);

      res.status(201).json({
        success: true,
        message: 'Deal created successfully',
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update deal
   * PUT /api/crm/deals/:id
   */
  async update(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const updates = req.body;

      const deal = await this.dealService.update(orgId, id, updates, userId);

      res.json({
        success: true,
        message: 'Deal updated successfully',
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update deal stage
   * PUT /api/crm/deals/:id/stage
   */
  async updateStage(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const { stageId } = req.body;

      if (!stageId) {
        throw new ValidationError('Stage ID is required');
      }

      const deal = await this.dealService.updateStage(orgId, id, stageId, userId);

      res.json({
        success: true,
        message: 'Deal stage updated successfully',
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete deal
   * DELETE /api/crm/deals/:id
   */
  async delete(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;

      await this.dealService.delete(orgId, id, userId);

      res.json({
        success: true,
        message: 'Deal deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get deal products
   * GET /api/crm/deals/:id/products
   */
  async getProducts(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const products = await this.dealService.getProducts(orgId, id);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add product to deal
   * POST /api/crm/deals/:id/products
   */
  async addProduct(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const productData = req.body;

      const product = await this.dealService.addProduct(orgId, id, productData, userId);

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove product from deal
   * DELETE /api/crm/deals/:id/products/:productId
   */
  async removeProduct(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id, productId } = req.params;

      await this.dealService.removeProduct(orgId, id, productId, userId);

      res.json({
        success: true,
        message: 'Product removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pipeline metrics
   * GET /api/crm/deals/metrics/pipeline
   */
  async getPipelineMetrics(req, res, next) {
    try {
      const { orgId } = req.user;
      const { pipelineId } = req.query;

      const metrics = await this.dealService.getPipelineMetrics(orgId, pipelineId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get forecast
   * GET /api/crm/deals/forecast
   */
  async getForecast(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { startDate, endDate, ownerId } = req.query;

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const targetUserId = ownerId || userId;

      const forecast = await this.dealService.calculateForecast(
        orgId,
        targetUserId,
        start,
        end
      );

      res.json({
        success: true,
        data: forecast
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DealController;
