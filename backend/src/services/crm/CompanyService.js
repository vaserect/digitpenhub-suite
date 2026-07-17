// backend/src/services/crm/CompanyService.js
// Phase 1 Implementation: Company Service
// Date: 2026-07-16

const BaseService = require('../base/BaseService');
const CompanyRepository = require('../../repositories/crm/CompanyRepository');
const ActivityService = require('./ActivityService');
const eventBus = require('../../utils/eventBus');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Service for CRM Companies/Accounts
 * Handles business logic for company management
 */
class CompanyService extends BaseService {
  constructor() {
    super(new CompanyRepository());
    this.activityService = new ActivityService();
  }

  /**
   * Create a new company
   * @param {string} orgId - Organization ID
   * @param {Object} companyData - Company data
   * @param {string} userId - User creating the company
   * @returns {Promise<Object>} Created company
   */
  async create(orgId, companyData, userId) {
    // Validate required fields
    this.validateCompanyData(companyData);

    // Check for duplicate company name
    const existing = await this.repository.searchByName(orgId, companyData.name, 1);
    if (existing.length > 0 && existing[0].name.toLowerCase() === companyData.name.toLowerCase()) {
      throw new ValidationError('A company with this name already exists');
    }

    // Create company
    const company = await this.repository.create(orgId, companyData, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'company_created',
      companyId: company.id,
      subject: `Company created: ${company.name}`,
      metadata: {
        companyName: company.name,
        industry: company.industry,
        website: company.website
      }
    }, userId);

    // Emit event for integrations
    eventBus.emit('company.created', {
      company,
      userId,
      orgId
    });

    logger.info('Company created successfully', {
      companyId: company.id,
      companyName: company.name,
      orgId,
      userId
    });

    return company;
  }

  /**
   * Get company by ID
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company with related data
   */
  async getById(orgId, companyId) {
    const company = await this.repository.getById(orgId, companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    return company;
  }

  /**
   * List companies with filters
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Companies list with pagination
   */
  async list(orgId, filters = {}) {
    return this.repository.list(orgId, filters);
  }

  /**
   * Update company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the company
   * @returns {Promise<Object>} Updated company
   */
  async update(orgId, companyId, updates, userId) {
    // Get current company
    const currentCompany = await this.getById(orgId, companyId);

    // Validate name if being updated
    if (updates.name && updates.name !== currentCompany.name) {
      const existing = await this.repository.searchByName(orgId, updates.name, 1);
      if (existing.length > 0 && 
          existing[0].name.toLowerCase() === updates.name.toLowerCase() &&
          existing[0].id !== companyId) {
        throw new ValidationError('A company with this name already exists');
      }
    }

    // Update company
    const updatedCompany = await this.repository.update(orgId, companyId, updates, userId);

    // Log activity for significant changes
    const significantFields = ['name', 'industry', 'companySize', 'annualRevenue', 'ownerId'];
    const changedFields = Object.keys(updates).filter(key => 
      significantFields.includes(key) && updates[key] !== currentCompany[key]
    );

    if (changedFields.length > 0) {
      await this.activityService.create(orgId, {
        type: 'company_updated',
        companyId,
        subject: `Company updated: ${updatedCompany.name}`,
        metadata: {
          changedFields,
          oldValues: changedFields.reduce((acc, field) => {
            acc[field] = currentCompany[field];
            return acc;
          }, {}),
          newValues: changedFields.reduce((acc, field) => {
            acc[field] = updates[field];
            return acc;
          }, {})
        }
      }, userId);
    }

    // Emit event
    eventBus.emit('company.updated', {
      company: updatedCompany,
      previousCompany: currentCompany,
      changedFields,
      userId,
      orgId
    });

    logger.info('Company updated successfully', {
      companyId,
      changedFields,
      orgId,
      userId
    });

    return updatedCompany;
  }

  /**
   * Delete company (soft delete)
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {string} userId - User deleting the company
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, companyId, userId) {
    const company = await this.getById(orgId, companyId);

    // Check if company has active deals
    const stats = await this.repository.getStatistics(orgId, companyId);
    if (stats.open_deals > 0) {
      throw new ValidationError(
        `Cannot delete company with ${stats.open_deals} active deal(s). Close or reassign deals first.`
      );
    }

    const result = await this.repository.delete(orgId, companyId, userId);

    // Log activity
    await this.activityService.create(orgId, {
      type: 'company_deleted',
      companyId,
      subject: `Company deleted: ${company.name}`,
      metadata: {
        companyName: company.name,
        contactCount: stats.contact_count,
        totalDeals: stats.total_deals
      }
    }, userId);

    // Emit event
    eventBus.emit('company.deleted', {
      companyId,
      company,
      userId,
      orgId
    });

    logger.info('Company deleted successfully', {
      companyId,
      companyName: company.name,
      orgId,
      userId
    });

    return result;
  }

  /**
   * Get contacts for company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Contacts list
   */
  async getContacts(orgId, companyId, filters = {}) {
    // Verify company exists
    await this.getById(orgId, companyId);

    return this.repository.getContacts(orgId, companyId, filters);
  }

  /**
   * Get deals for company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Deals list
   */
  async getDeals(orgId, companyId, filters = {}) {
    // Verify company exists
    await this.getById(orgId, companyId);

    return this.repository.getDeals(orgId, companyId, filters);
  }

  /**
   * Get company statistics
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company statistics
   */
  async getStatistics(orgId, companyId) {
    // Verify company exists
    await this.getById(orgId, companyId);

    return this.repository.getStatistics(orgId, companyId);
  }

  /**
   * Search companies by name
   * @param {string} orgId - Organization ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Matching companies
   */
  async searchByName(orgId, searchTerm, limit = 10) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters');
    }

    return this.repository.searchByName(orgId, searchTerm.trim(), limit);
  }

  /**
   * Merge two companies
   * @param {string} orgId - Organization ID
   * @param {string} sourceCompanyId - Source company ID (will be deleted)
   * @param {string} targetCompanyId - Target company ID (will be kept)
   * @param {string} userId - User performing the merge
   * @returns {Promise<Object>} Merged company
   */
  async merge(orgId, sourceCompanyId, targetCompanyId, userId) {
    if (sourceCompanyId === targetCompanyId) {
      throw new ValidationError('Cannot merge a company with itself');
    }

    // Get both companies
    const [sourceCompany, targetCompany] = await Promise.all([
      this.getById(orgId, sourceCompanyId),
      this.getById(orgId, targetCompanyId)
    ]);

    // Start transaction (pseudo-code, actual implementation depends on DB driver)
    try {
      // Move contacts from source to target
      await this.db.query(`
        UPDATE contacts 
        SET company_id = $1, updated_by = $2, updated_at = NOW()
        WHERE company_id = $3 AND org_id = $4
      `, [targetCompanyId, userId, sourceCompanyId, orgId]);

      // Move deals from source to target
      await this.db.query(`
        UPDATE crm_deals 
        SET company_id = $1, updated_by = $2, updated_at = NOW()
        WHERE company_id = $3 AND org_id = $4
      `, [targetCompanyId, userId, sourceCompanyId, orgId]);

      // Merge tags
      const mergedTags = [...new Set([
        ...(targetCompany.tags || []),
        ...(sourceCompany.tags || [])
      ])];

      // Merge custom fields (target takes precedence)
      const mergedCustomFields = {
        ...sourceCompany.customFields,
        ...targetCompany.customFields
      };

      // Update target company with merged data
      await this.repository.update(orgId, targetCompanyId, {
        tags: mergedTags,
        customFields: mergedCustomFields
      }, userId);

      // Delete source company
      await this.repository.delete(orgId, sourceCompanyId, userId);

      // Log activity
      await this.activityService.create(orgId, {
        type: 'company_merged',
        companyId: targetCompanyId,
        subject: `Company merged: ${sourceCompany.name} into ${targetCompany.name}`,
        metadata: {
          sourceCompanyId,
          sourceCompanyName: sourceCompany.name,
          targetCompanyId,
          targetCompanyName: targetCompany.name
        }
      }, userId);

      // Emit event
      eventBus.emit('company.merged', {
        sourceCompanyId,
        targetCompanyId,
        sourceCompany,
        targetCompany,
        userId,
        orgId
      });

      logger.info('Companies merged successfully', {
        sourceCompanyId,
        targetCompanyId,
        orgId,
        userId
      });

      // Return updated target company
      return this.getById(orgId, targetCompanyId);
    } catch (error) {
      logger.error('Error merging companies', {
        error: error.message,
        sourceCompanyId,
        targetCompanyId,
        orgId,
        userId
      });
      throw error;
    }
  }

  /**
   * Calculate company health score
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Health score data
   */
  async calculateHealthScore(orgId, companyId) {
    const [company, stats] = await Promise.all([
      this.getById(orgId, companyId),
      this.repository.getStatistics(orgId, companyId)
    ]);

    let score = 0;
    const factors = [];

    // Factor 1: Contact engagement (0-25 points)
    if (stats.contact_count > 0) {
      const contactScore = Math.min(stats.contact_count * 5, 25);
      score += contactScore;
      factors.push({
        name: 'Contact Engagement',
        score: contactScore,
        maxScore: 25,
        description: `${stats.contact_count} contact(s)`
      });
    }

    // Factor 2: Deal activity (0-30 points)
    if (stats.total_deals > 0) {
      const dealScore = Math.min(stats.total_deals * 3, 30);
      score += dealScore;
      factors.push({
        name: 'Deal Activity',
        score: dealScore,
        maxScore: 30,
        description: `${stats.total_deals} deal(s)`
      });
    }

    // Factor 3: Revenue generation (0-25 points)
    if (stats.total_revenue > 0) {
      const revenueScore = Math.min(Math.floor(stats.total_revenue / 10000), 25);
      score += revenueScore;
      factors.push({
        name: 'Revenue Generation',
        score: revenueScore,
        maxScore: 25,
        description: `$${stats.total_revenue.toLocaleString()} total revenue`
      });
    }

    // Factor 4: Pipeline value (0-20 points)
    if (stats.pipeline_value > 0) {
      const pipelineScore = Math.min(Math.floor(stats.pipeline_value / 5000), 20);
      score += pipelineScore;
      factors.push({
        name: 'Pipeline Value',
        score: pipelineScore,
        maxScore: 20,
        description: `$${stats.pipeline_value.toLocaleString()} in pipeline`
      });
    }

    // Determine health status
    let status = 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';

    return {
      companyId,
      companyName: company.name,
      score,
      maxScore: 100,
      status,
      factors,
      calculatedAt: new Date()
    };
  }

  /**
   * Validate company data
   * @param {Object} companyData - Company data to validate
   * @throws {ValidationError} If validation fails
   */
  validateCompanyData(companyData) {
    if (!companyData.name || companyData.name.trim().length === 0) {
      throw new ValidationError('Company name is required');
    }

    if (companyData.name.length > 255) {
      throw new ValidationError('Company name must be 255 characters or less');
    }

    if (companyData.email && !this.isValidEmail(companyData.email)) {
      throw new ValidationError('Invalid email address');
    }

    if (companyData.website && !this.isValidUrl(companyData.website)) {
      throw new ValidationError('Invalid website URL');
    }

    if (companyData.annualRevenue && companyData.annualRevenue < 0) {
      throw new ValidationError('Annual revenue cannot be negative');
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = CompanyService;
