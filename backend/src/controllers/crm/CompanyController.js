// backend/src/controllers/crm/CompanyController.js
// Phase 1 Implementation: Company Controller
// Date: 2026-07-16

const CompanyService = require('../../services/crm/CompanyService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Controller for CRM Companies API
 * Handles HTTP requests for company management
 */
class CompanyController {
  constructor() {
    this.companyService = new CompanyService();
  }

  /**
   * List companies
   * GET /api/crm/companies
   */
  async list(req, res, next) {
    try {
      const { orgId } = req.user;
      
      const filters = {
        ownerId: req.query.ownerId,
        industry: req.query.industry,
        companySize: req.query.companySize,
        search: req.query.search,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await this.companyService.list(orgId, filters);

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
   * Search companies by name
   * GET /api/crm/companies/search
   */
  async search(req, res, next) {
    try {
      const { orgId } = req.user;
      const { q, limit } = req.query;

      if (!q) {
        throw new ValidationError('Search query parameter "q" is required');
      }

      const companies = await this.companyService.searchByName(
        orgId,
        q,
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company by ID
   * GET /api/crm/companies/:id
   */
  async getById(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const company = await this.companyService.getById(orgId, id);

      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create company
   * POST /api/crm/companies
   */
  async create(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const companyData = req.body;

      const company = await this.companyService.create(orgId, companyData, userId);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update company
   * PUT /api/crm/companies/:id
   */
  async update(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const updates = req.body;

      const company = await this.companyService.update(orgId, id, updates, userId);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete company
   * DELETE /api/crm/companies/:id
   */
  async delete(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;

      await this.companyService.delete(orgId, id, userId);

      res.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company contacts
   * GET /api/crm/companies/:id/contacts
   */
  async getContacts(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await this.companyService.getContacts(orgId, id, filters);

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
   * Get company deals
   * GET /api/crm/companies/:id/deals
   */
  async getDeals(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await this.companyService.getDeals(orgId, id, filters);

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
   * Get company statistics
   * GET /api/crm/companies/:id/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const statistics = await this.companyService.getStatistics(orgId, id);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company health score
   * GET /api/crm/companies/:id/health-score
   */
  async getHealthScore(req, res, next) {
    try {
      const { orgId } = req.user;
      const { id } = req.params;

      const healthScore = await this.companyService.calculateHealthScore(orgId, id);

      res.json({
        success: true,
        data: healthScore
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Merge companies
   * POST /api/crm/companies/:id/merge
   */
  async merge(req, res, next) {
    try {
      const { orgId, userId } = req.user;
      const { id } = req.params;
      const { targetCompanyId } = req.body;

      if (!targetCompanyId) {
        throw new ValidationError('Target company ID is required');
      }

      const company = await this.companyService.merge(
        orgId,
        id,
        targetCompanyId,
        userId
      );

      res.json({
        success: true,
        message: 'Companies merged successfully',
        data: company
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
module.exports = new CompanyController();
