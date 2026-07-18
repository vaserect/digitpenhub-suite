// backend/src/services/crm/DealService.js
// Phase 1 Implementation: Deal Service
// Date: 2026-07-16

const BaseService = require('../base/BaseService');
const DealRepository = require('../../repositories/crm/DealRepository');
const PipelineService = require('./PipelineService');
const ActivityService = require('./ActivityService');
const eventBus = require('../../utils/eventBus');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Service for CRM Deals/Opportunities
 * Handles business logic for deal management
 */
class DealService extends BaseService {
  constructor() {
    super(DealRepository);
    this.pipelineService = new PipelineService();
    this.activityService = new ActivityService();
  }

  /**
   * Create a new deal
   * @param {string} orgId - Organization ID
   * @param {Object} dealData - Deal data
   * @param {string} userId - User creating the deal
   * @returns {Promise<Object>} Created deal
   */
  async create(orgId, dealData, userId) {
    // Validate required fields
    this.validateDealData(dealData);

    // Validate pipeline and stage
    const pipeline = await this.pipelineService.getById(orgId, dealData.pipelineId);
    if (!pipeline) {
      throw new NotFoundError('Pipeline not found');
    }

    const stage = await this.pipelineService.getStage(dealData.stageId);
    if (!stage || stage.pipelineId !== dealData.pipelineId) {
      throw new ValidationError('Invalid stage for pipeline');
    }

    // Set probability from stage if not provided
    if (!dealData.probability) {
      dealData.probability = stage.probability;
    }

    // Create deal
    const deal = await this.repository.create(orgId, dealData, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'deal_created',
      dealId: deal.id,
      subject: `Deal created: ${deal.name}`,
      metadata: {
        dealName: deal.name,
        amount: deal.amount,
        pipelineName: pipeline.name,
        stageName: stage.name
      }
    }, userId);

    // Emit event for integrations
    eventBus.emit('deal.created', {
      deal,
      userId,
      orgId
    });

    logger.info('Deal created successfully', {
      dealId: deal.id,
      dealName: deal.name,
      orgId,
      userId
    });

    return deal;
  }

  /**
   * Get deal by ID
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @returns {Promise<Object>} Deal with related data
   */
  async getById(orgId, dealId) {
    const deal = await this.repository.getById(orgId, dealId);
    if (!deal) {
      throw new NotFoundError('Deal not found');
    }
    return deal;
  }

  /**
   * List deals with filters
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Deals list with pagination
   */
  async list(orgId, filters = {}) {
    return this.repository.list(orgId, filters);
  }

  /**
   * Update deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the deal
   * @returns {Promise<Object>} Updated deal
   */
  async update(orgId, dealId, updates, userId) {
    // Get current deal
    const currentDeal = await this.getById(orgId, dealId);

    // Validate stage change if applicable
    if (updates.stageId && updates.stageId !== currentDeal.stageId) {
      const newStage = await this.pipelineService.getStage(updates.stageId);
      if (!newStage || newStage.pipelineId !== currentDeal.pipelineId) {
        throw new ValidationError('Invalid stage for pipeline');
      }

      // Update probability from stage
      updates.probability = newStage.probability;

      // Auto-update status if moved to closed stage
      if (newStage.isClosedWon) {
        updates.status = 'won';
        updates.actualCloseDate = new Date();
      } else if (newStage.isClosedLost) {
        updates.status = 'lost';
        updates.actualCloseDate = new Date();
      }
    }

    // Update deal
    const updatedDeal = await this.repository.update(orgId, dealId, updates, userId);

    // Log activity for stage change
    if (updates.stageId && updates.stageId !== currentDeal.stageId) {
      await this.activityService.create(orgId, {
        type: 'deal_stage_changed',
        dealId,
        subject: `Deal moved to ${updatedDeal.stageName}`,
        metadata: {
          oldStageId: currentDeal.stageId,
          oldStageName: currentDeal.stageName,
          newStageId: updates.stageId,
          newStageName: updatedDeal.stageName
        }
      }, userId);

      // Emit stage change event
      eventBus.emit('deal.stage_changed', {
        deal: updatedDeal,
        oldStageId: currentDeal.stageId,
        newStageId: updates.stageId,
        userId,
        orgId
      });

      // Check if deal won/lost
      if (updatedDeal.status === 'won') {
        eventBus.emit('deal.won', {
          deal: updatedDeal,
          userId,
          orgId
        });
      } else if (updatedDeal.status === 'lost') {
        eventBus.emit('deal.lost', {
          deal: updatedDeal,
          userId,
          orgId
        });
      }
    }

    logger.info('Deal updated successfully', {
      dealId,
      updates: Object.keys(updates),
      orgId,
      userId
    });

    return updatedDeal;
  }

  /**
   * Update deal stage (convenience method)
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {string} newStageId - New stage ID
   * @param {string} userId - User updating the deal
   * @returns {Promise<Object>} Updated deal
   */
  async updateStage(orgId, dealId, newStageId, userId) {
    return this.update(orgId, dealId, { stageId: newStageId }, userId);
  }

  /**
   * Delete deal (soft delete)
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {string} userId - User deleting the deal
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, dealId, userId) {
    const deal = await this.getById(orgId, dealId);

    const result = await this.repository.delete(orgId, dealId, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'deal_deleted',
      dealId,
      subject: `Deal deleted: ${deal.name}`,
      metadata: {
        dealName: deal.name,
        amount: deal.amount
      }
    }, userId);

    // Emit event
    eventBus.emit('deal.deleted', {
      dealId,
      deal,
      userId,
      orgId
    });

    logger.info('Deal deleted successfully', {
      dealId,
      dealName: deal.name,
      orgId,
      userId
    });

    return result;
  }

  /**
   * Add product to deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {Object} productData - Product data
   * @param {string} userId - User adding the product
   * @returns {Promise<Object>} Created product
   */
  async addProduct(orgId, dealId, productData, userId) {
    // Verify deal exists
    await this.getById(orgId, dealId);

    // Validate product data
    this.validateProductData(productData);

    // Calculate total price if not provided
    if (!productData.totalPrice) {
      const subtotal = productData.quantity * productData.unitPrice;
      const discount = productData.discountAmount || 
                      (subtotal * (productData.discountPercent || 0) / 100);
      const taxableAmount = subtotal - discount;
      const tax = productData.taxAmount || 
                 (taxableAmount * (productData.taxPercent || 0) / 100);
      productData.totalPrice = taxableAmount + tax;
    }

    const product = await this.repository.addProduct(dealId, productData);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'deal_product_added',
      dealId,
      subject: `Product added: ${product.name}`,
      metadata: {
        productName: product.name,
        quantity: product.quantity,
        totalPrice: product.totalPrice
      }
    }, userId);

    // Emit event
    eventBus.emit('deal.product_added', {
      dealId,
      product,
      userId,
      orgId
    });

    logger.info('Product added to deal', {
      dealId,
      productId: product.id,
      productName: product.name,
      orgId,
      userId
    });

    return product;
  }

  /**
   * Get products for deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @returns {Promise<Array>} Deal products
   */
  async getProducts(orgId, dealId) {
    // Verify deal exists
    await this.getById(orgId, dealId);

    return this.repository.getProducts(dealId);
  }

  /**
   * Remove product from deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {string} productId - Product ID
   * @param {string} userId - User removing the product
   * @returns {Promise<boolean>} Success status
   */
  async removeProduct(orgId, dealId, productId, userId) {
    // Verify deal exists
    await this.getById(orgId, dealId);

    const result = await this.repository.removeProduct(dealId, productId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'deal_product_removed',
      dealId,
      subject: 'Product removed from deal',
      metadata: {
        productId
      }
    }, userId);

    // Emit event
    eventBus.emit('deal.product_removed', {
      dealId,
      productId,
      userId,
      orgId
    });

    logger.info('Product removed from deal', {
      dealId,
      productId,
      orgId,
      userId
    });

    return result;
  }

  /**
   * Get deals by pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Deals in pipeline
   */
  async getByPipeline(orgId, pipelineId, filters = {}) {
    // Verify pipeline exists
    await this.pipelineService.getById(orgId, pipelineId);

    return this.repository.getByPipeline(orgId, pipelineId, filters);
  }

  /**
   * Get deals by stage
   * @param {string} orgId - Organization ID
   * @param {string} stageId - Stage ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Deals in stage
   */
  async getByStage(orgId, stageId, filters = {}) {
    // Verify stage exists
    await this.pipelineService.getStage(stageId);

    return this.repository.getByStage(orgId, stageId, filters);
  }

  /**
   * Get pipeline metrics
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID (optional)
   * @returns {Promise<Array>} Pipeline metrics
   */
  async getPipelineMetrics(orgId, pipelineId = null) {
    if (pipelineId) {
      // Verify pipeline exists
      await this.pipelineService.getById(orgId, pipelineId);
    }

    return this.repository.getPipelineMetrics(orgId, pipelineId);
  }

  /**
   * Calculate forecast for user
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Forecast data
   */
  async calculateForecast(orgId, userId, startDate, endDate) {
    const deals = await this.repository.list(orgId, {
      ownerId: userId,
      status: 'open',
      limit: 1000
    });

    const forecast = {
      committed: 0,
      bestCase: 0,
      pipeline: 0,
      closed: 0
    };

    deals.data.forEach(deal => {
      const amount = deal.amount || 0;
      const probability = deal.probability || 0;

      // Committed: High probability deals (>75%)
      if (probability >= 75) {
        forecast.committed += amount;
      }

      // Best case: All open deals
      forecast.bestCase += amount;

      // Pipeline: Weighted by probability
      forecast.pipeline += amount * (probability / 100);
    });

    // Get closed won deals in period
    const closedDeals = await this.repository.list(orgId, {
      ownerId: userId,
      status: 'won',
      limit: 1000
    });

    closedDeals.data.forEach(deal => {
      if (deal.actualCloseDate >= startDate && deal.actualCloseDate <= endDate) {
        forecast.closed += deal.amount || 0;
      }
    });

    return forecast;
  }

  /**
   * Validate deal data
   * @param {Object} dealData - Deal data to validate
   * @throws {ValidationError} If validation fails
   */
  validateDealData(dealData) {
    if (!dealData.name || dealData.name.trim().length === 0) {
      throw new ValidationError('Deal name is required');
    }

    if (!dealData.pipelineId) {
      throw new ValidationError('Pipeline ID is required');
    }

    if (!dealData.stageId) {
      throw new ValidationError('Stage ID is required');
    }

    if (dealData.amount && dealData.amount < 0) {
      throw new ValidationError('Deal amount cannot be negative');
    }

    if (dealData.probability && (dealData.probability < 0 || dealData.probability > 100)) {
      throw new ValidationError('Probability must be between 0 and 100');
    }
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data to validate
   * @throws {ValidationError} If validation fails
   */
  validateProductData(productData) {
    if (!productData.name || productData.name.trim().length === 0) {
      throw new ValidationError('Product name is required');
    }

    if (!productData.unitPrice || productData.unitPrice < 0) {
      throw new ValidationError('Valid unit price is required');
    }

    if (!productData.quantity || productData.quantity < 1) {
      throw new ValidationError('Quantity must be at least 1');
    }

    if (productData.discountPercent && 
        (productData.discountPercent < 0 || productData.discountPercent > 100)) {
      throw new ValidationError('Discount percent must be between 0 and 100');
    }

    if (productData.taxPercent && 
        (productData.taxPercent < 0 || productData.taxPercent > 100)) {
      throw new ValidationError('Tax percent must be between 0 and 100');
    }
  }
}

module.exports = DealService;
