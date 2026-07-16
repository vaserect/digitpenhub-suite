const BaseService = require('../base/BaseService');
const CompanyRepository = require('../../repositories/CompanyRepository');
const logger = require('../../utils/logger');

/**
 * CompanyService - Business logic for CRM companies
 * Handles company management, validation, and enrichment
 */
class CompanyService extends BaseService {
  constructor() {
    const repository = new CompanyRepository();
    super(repository, {
      serviceName: 'CompanyService',
      logger,
    });

    // Valid company sizes
    this.VALID_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  }

  /**
   * Validate data before creating a company
   * @param {Object} data - Company data
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Company name is required');
    }

    if (data.name.trim().length < 2) {
      throw new Error('Company name must be at least 2 characters');
    }

    if (data.name.trim().length > 200) {
      throw new Error('Company name must not exceed 200 characters');
    }

    // Validate website format if provided
    if (data.website && !this.isValidWebsite(data.website)) {
      throw new Error('Invalid website URL format');
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format if provided
    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Validate size if provided
    if (data.size && !this.VALID_SIZES.includes(data.size)) {
      throw new Error(`Company size must be one of: ${this.VALID_SIZES.join(', ')}`);
    }
  }

  /**
   * Validate data before updating a company
   * @param {Object} data - Company data
   * @throws {Error} If validation fails
   */
  validateUpdate(data) {
    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Company name cannot be empty');
      }

      if (data.name.trim().length < 2) {
        throw new Error('Company name must be at least 2 characters');
      }

      if (data.name.trim().length > 200) {
        throw new Error('Company name must not exceed 200 characters');
      }
    }

    // Validate website format if provided
    if (data.website !== undefined && data.website && !this.isValidWebsite(data.website)) {
      throw new Error('Invalid website URL format');
    }

    // Validate email format if provided
    if (data.email !== undefined && data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format if provided
    if (data.phone !== undefined && data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Validate size if provided
    if (data.size !== undefined && data.size && !this.VALID_SIZES.includes(data.size)) {
      throw new Error(`Company size must be one of: ${this.VALID_SIZES.join(', ')}`);
    }
  }

  /**
   * Transform data before creating a company
   * @param {Object} data - Raw company data
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    const transformed = {
      name: data.name.trim(),
      website: data.website ? this.normalizeWebsite(data.website) : null,
      industry: data.industry ? data.industry.trim() : null,
      size: data.size || null,
      phone: data.phone ? this.normalizePhone(data.phone) : null,
      email: data.email ? data.email.toLowerCase().trim() : null,
      address: data.address ? data.address.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
    };

    return transformed;
  }

  /**
   * Transform data before updating a company
   * @param {Object} data - Raw company data
   * @returns {Object} Transformed data
   */
  transformForUpdate(data) {
    const transformed = {};

    if (data.name !== undefined) {
      transformed.name = data.name.trim();
    }

    if (data.website !== undefined) {
      transformed.website = data.website ? this.normalizeWebsite(data.website) : null;
    }

    if (data.industry !== undefined) {
      transformed.industry = data.industry ? data.industry.trim() : null;
    }

    if (data.size !== undefined) {
      transformed.size = data.size || null;
    }

    if (data.phone !== undefined) {
      transformed.phone = data.phone ? this.normalizePhone(data.phone) : null;
    }

    if (data.email !== undefined) {
      transformed.email = data.email ? data.email.toLowerCase().trim() : null;
    }

    if (data.address !== undefined) {
      transformed.address = data.address ? data.address.trim() : null;
    }

    if (data.notes !== undefined) {
      transformed.notes = data.notes ? data.notes.trim() : null;
    }

    return transformed;
  }

  /**
   * Enrich company entity with computed fields
   * @param {Object} entity - Company entity
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    return {
      ...entity,
      display_name: entity.name,
      has_website: !!entity.website,
      has_contacts: entity.contact_count > 0,
    };
  }

  /**
   * Search companies by query
   * @param {string} orgId - Organization ID
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching companies
   */
  async search(orgId, query, filters = {}) {
    this.logger.info(`Searching companies in org ${orgId} with query: ${query}`);

    try {
      const companies = await this.repository.search(orgId, query, filters);
      return companies.map(company => this.enrichEntity(company));
    } catch (error) {
      this.logger.error('Error searching companies:', error);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Get all companies with contact counts
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Companies with contact counts
   */
  async findAllWithContactCount(orgId, options = {}) {
    this.logger.info(`Getting companies with contact count for org ${orgId}`);

    try {
      const companies = await this.repository.findAllWithContactCount(orgId, options);
      return companies.map(company => this.enrichEntity(company));
    } catch (error) {
      this.logger.error('Error getting companies with contact count:', error);
      throw new Error('Failed to get companies');
    }
  }

  /**
   * Get company with all related contacts
   * @param {string} companyId - Company ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Company with contacts
   */
  async findByIdWithContacts(companyId, orgId) {
    this.logger.info(`Getting company ${companyId} with contacts for org ${orgId}`);

    try {
      const company = await this.repository.findByIdWithContacts(companyId, orgId);
      return company ? this.enrichEntity(company) : null;
    } catch (error) {
      this.logger.error('Error getting company with contacts:', error);
      throw new Error('Failed to get company');
    }
  }

  /**
   * Get statistics grouped by industry
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Industry statistics
   */
  async getStatsByIndustry(orgId) {
    this.logger.info(`Getting industry statistics for org ${orgId}`);

    try {
      const stats = await this.repository.getStatsByIndustry(orgId);
      
      return {
        industries: stats,
        total_industries: stats.length,
        total_companies: stats.reduce((sum, s) => sum + parseInt(s.count, 10), 0),
        total_contacts: stats.reduce((sum, s) => sum + parseInt(s.total_contacts, 10), 0),
      };
    } catch (error) {
      this.logger.error('Error getting industry statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Get statistics grouped by company size
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Size statistics
   */
  async getStatsBySize(orgId) {
    this.logger.info(`Getting size statistics for org ${orgId}`);

    try {
      const stats = await this.repository.getStatsBySize(orgId);
      
      return {
        sizes: stats,
        total_companies: stats.reduce((sum, s) => sum + parseInt(s.count, 10), 0),
        total_contacts: stats.reduce((sum, s) => sum + parseInt(s.total_contacts, 10), 0),
      };
    } catch (error) {
      this.logger.error('Error getting size statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Check if company name already exists
   * @param {string} name - Company name
   * @param {string} orgId - Organization ID
   * @param {string} excludeId - Company ID to exclude (for updates)
   * @returns {Promise<boolean>} True if exists
   */
  async existsByName(name, orgId, excludeId = null) {
    try {
      return await this.repository.existsByName(name, orgId, excludeId);
    } catch (error) {
      this.logger.error('Error checking company name existence:', error);
      throw new Error('Failed to check company name');
    }
  }

  /**
   * Create a new company with duplicate check
   * @param {Object} data - Company data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created company
   */
  async create(data, orgId, userId) {
    // Check for duplicate name
    const exists = await this.existsByName(data.name, orgId);
    if (exists) {
      throw new Error('A company with this name already exists');
    }

    return super.create(data, orgId, userId);
  }

  /**
   * Update a company with duplicate check
   * @param {string} id - Company ID
   * @param {Object} data - Update data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated company
   */
  async update(id, data, orgId, userId) {
    // Check for duplicate name if name is being updated
    if (data.name) {
      const exists = await this.existsByName(data.name, orgId, id);
      if (exists) {
        throw new Error('A company with this name already exists');
      }
    }

    return super.update(id, data, orgId, userId);
  }

  /**
   * Bulk create companies with validation and duplicate detection
   * @param {Array<Object>} companies - Array of company data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with created companies and errors
   */
  async bulkCreate(companies, orgId, userId) {
    this.logger.info(`Bulk creating ${companies.length} companies for org ${orgId}`);

    const result = {
      created: [],
      errors: [],
    };

    // Get existing company names for duplicate detection
    const existingCompanies = await this.repository.findAll(orgId);
    const existingNames = new Set(
      existingCompanies.map(c => c.name.toLowerCase())
    );

    // Track names in current batch
    const batchNames = new Set();

    for (let i = 0; i < companies.length; i++) {
      const companyData = companies[i];

      try {
        // Validate
        this.validateCreate(companyData);

        // Check for duplicates
        const normalizedName = companyData.name.trim().toLowerCase();
        if (existingNames.has(normalizedName) || batchNames.has(normalizedName)) {
          result.errors.push({
            index: i,
            data: companyData,
            error: 'Duplicate company name',
          });
          continue;
        }

        // Create company
        const company = await this.create(companyData, orgId, userId);
        result.created.push(company);
        batchNames.add(normalizedName);
      } catch (error) {
        result.errors.push({
          index: i,
          data: companyData,
          error: error.message,
        });
      }
    }

    this.logger.info(
      `Bulk create completed: ${result.created.length} created, ${result.errors.length} errors`
    );

    return result;
  }

  /**
   * Validate website URL format
   * @param {string} website - Website URL
   * @returns {boolean} True if valid
   */
  isValidWebsite(website) {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(website);
  }

  /**
   * Normalize website URL (add https:// if missing)
   * @param {string} website - Website URL
   * @returns {string} Normalized URL
   */
  normalizeWebsite(website) {
    const trimmed = website.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate phone format
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    // Allow various phone formats
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    return phonePattern.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Normalize phone number (remove formatting)
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone
   */
  normalizePhone(phone) {
    return phone.trim();
  }
}

// Export singleton instance
module.exports = new CompanyService();
