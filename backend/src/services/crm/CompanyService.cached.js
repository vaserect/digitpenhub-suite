const companyService = require('./CompanyService');
const { createCacheHelper } = require('../../cache/cacheDecorators');
const cacheConfig = require('../../config/cache.config');

/**
 * CompanyServiceCached - CompanyService with caching layer
 * 
 * Wraps CompanyService methods with intelligent caching:
 * - Caches read operations (findById, findAll, search)
 * - Invalidates cache on write operations (create, update, delete)
 * - Supports multi-tenancy with org-specific cache keys
 */
class CompanyServiceCached {
  constructor() {
    this.service = companyService;
    this.cacheConfig = cacheConfig.entities.company;
    this.logger = companyService.logger;
    this.repository = companyService.repository;
  }

  /**
   * Get cache helper for organization
   */
  getCacheHelper(orgId) {
    return createCacheHelper(this.cacheConfig.namespace, orgId);
  }

  /**
   * Find company by ID with caching
   */
  async findById(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    // Try cache first
    const cached = await cache.get('findById', id);
    if (cached !== null) {
      this.logger.debug('CompanyService: Cache hit for findById', { id, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const company = await this.service.findById(id, orgId);
    
    // Cache the result
    if (company) {
      await cache.set('findById', company, this.cacheConfig.ttl.findById, id);
      this.logger.debug('CompanyService: Cached findById result', { id, orgId });
    }

    return company;
  }

  /**
   * Find all companies with caching
   */
  async findAll(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    // Try cache first
    const cached = await cache.get('findAll', cacheKey);
    if (cached !== null) {
      this.logger.debug('CompanyService: Cache hit for findAll', { orgId, options });
      return cached;
    }

    // Cache miss - fetch from database
    const companies = await this.service.findAll(orgId, options);
    
    // Cache the result
    await cache.set('findAll', companies, this.cacheConfig.ttl.findAll, cacheKey);
    this.logger.debug('CompanyService: Cached findAll result', { orgId, count: companies.length });

    return companies;
  }

  /**
   * Search companies with caching
   */
  async search(query, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await cache.get('search', cacheKey);
    if (cached !== null) {
      this.logger.debug('CompanyService: Cache hit for search', { query, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const companies = await this.service.search(query, orgId, options);
    
    // Cache the result
    await cache.set('search', companies, this.cacheConfig.ttl.search, cacheKey);
    this.logger.debug('CompanyService: Cached search result', { query, orgId, count: companies.length });

    return companies;
  }

  /**
   * Count companies with caching
   */
  async count(orgId, filters = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(filters);
    
    // Try cache first
    const cached = await cache.get('count', cacheKey);
    if (cached !== null) {
      this.logger.debug('CompanyService: Cache hit for count', { orgId, filters });
      return cached;
    }

    // Cache miss - fetch from database
    const count = await this.service.count(orgId, filters);
    
    // Cache the result
    await cache.set('count', count, this.cacheConfig.ttl.count, cacheKey);
    this.logger.debug('CompanyService: Cached count result', { orgId, count });

    return count;
  }

  /**
   * Get company statistics with caching
   */
  async getStatistics(orgId) {
    const cache = this.getCacheHelper(orgId);
    
    // Try cache first
    const cached = await cache.get('stats');
    if (cached !== null) {
      this.logger.debug('CompanyService: Cache hit for stats', { orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const stats = await this.service.getStatistics(orgId);
    
    // Cache the result
    await cache.set('stats', stats, this.cacheConfig.ttl.stats);
    this.logger.debug('CompanyService: Cached stats result', { orgId });

    return stats;
  }

  /**
   * Create company and invalidate cache
   */
  async create(data, orgId, userId) {
    const company = await this.service.create(data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return company;
  }

  /**
   * Update company and invalidate cache
   */
  async update(id, data, orgId, userId) {
    const company = await this.service.update(id, data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return company;
  }

  /**
   * Delete company and invalidate cache
   */
  async delete(id, orgId, userId) {
    const result = await this.service.delete(id, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return result;
  }

  /**
   * Bulk create companies and invalidate cache
   */
  async bulkCreate(companiesData, orgId, userId) {
    const result = await this.service.bulkCreate(companiesData, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk update companies and invalidate cache
   */
  async bulkUpdate(updates, orgId, userId) {
    const result = await this.service.bulkUpdate(updates, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk delete companies and invalidate cache
   */
  async bulkDelete(ids, orgId, userId) {
    const result = await this.service.bulkDelete(ids, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Invalidate cache for organization
   */
  async invalidateCache(orgId, entityId = null) {
    const cache = this.getCacheHelper(orgId);
    
    if (entityId) {
      // Invalidate specific entity
      await cache.invalidateEntity(entityId);
    } else {
      // Invalidate all lists
      await cache.invalidateLists();
    }
    
    // Also invalidate stats
    await cache.delete('stats');
    
    this.logger.debug('CompanyService: Cache invalidated', { orgId, entityId });
  }
}

module.exports = new CompanyServiceCached();
