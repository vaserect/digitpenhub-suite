const invoiceService = require('./InvoiceService');
const { createCacheHelper } = require('../../cache/cacheDecorators');
const cacheConfig = require('../../config/cache.config');

/**
 * InvoiceServiceCached - InvoiceService with caching layer
 * 
 * Wraps InvoiceService methods with intelligent caching:
 * - Caches read operations (findById, findAll, search)
 * - Invalidates cache on write operations (create, update, delete)
 * - Supports multi-tenancy with org-specific cache keys
 */
class InvoiceServiceCached {
  constructor() {
    this.service = invoiceService;
    this.cacheConfig = cacheConfig.entities.invoice;
    this.logger = invoiceService.logger;
    this.repository = invoiceService.repository;
  }

  /**
   * Get cache helper for organization
   */
  getCacheHelper(orgId) {
    return createCacheHelper(this.cacheConfig.namespace, orgId);
  }

  /**
   * Find invoice by ID with caching
   */
  async findById(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    // Try cache first
    const cached = await cache.get('findById', id);
    if (cached !== null) {
      this.logger.debug('InvoiceService: Cache hit for findById', { id, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const invoice = await this.service.findById(id, orgId);
    
    // Cache the result
    if (invoice) {
      await cache.set('findById', invoice, this.cacheConfig.ttl.findById, id);
      this.logger.debug('InvoiceService: Cached findById result', { id, orgId });
    }

    return invoice;
  }

  /**
   * Find all invoices with caching
   */
  async findAll(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    // Try cache first
    const cached = await cache.get('findAll', cacheKey);
    if (cached !== null) {
      this.logger.debug('InvoiceService: Cache hit for findAll', { orgId, options });
      return cached;
    }

    // Cache miss - fetch from database
    const invoices = await this.service.findAll(orgId, options);
    
    // Cache the result
    await cache.set('findAll', invoices, this.cacheConfig.ttl.findAll, cacheKey);
    this.logger.debug('InvoiceService: Cached findAll result', { orgId, count: invoices.length });

    return invoices;
  }

  /**
   * Search invoices with caching
   */
  async search(query, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await cache.get('search', cacheKey);
    if (cached !== null) {
      this.logger.debug('InvoiceService: Cache hit for search', { query, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const invoices = await this.service.search(query, orgId, options);
    
    // Cache the result
    await cache.set('search', invoices, this.cacheConfig.ttl.search, cacheKey);
    this.logger.debug('InvoiceService: Cached search result', { query, orgId, count: invoices.length });

    return invoices;
  }

  /**
   * Count invoices with caching
   */
  async count(orgId, filters = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(filters);
    
    // Try cache first
    const cached = await cache.get('count', cacheKey);
    if (cached !== null) {
      this.logger.debug('InvoiceService: Cache hit for count', { orgId, filters });
      return cached;
    }

    // Cache miss - fetch from database
    const count = await this.service.count(orgId, filters);
    
    // Cache the result
    await cache.set('count', count, this.cacheConfig.ttl.count, cacheKey);
    this.logger.debug('InvoiceService: Cached count result', { orgId, count });

    return count;
  }

  /**
   * Get invoice statistics with caching
   */
  async getStatistics(orgId) {
    const cache = this.getCacheHelper(orgId);
    
    // Try cache first
    const cached = await cache.get('stats');
    if (cached !== null) {
      this.logger.debug('InvoiceService: Cache hit for stats', { orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const stats = await this.service.getStatistics(orgId);
    
    // Cache the result
    await cache.set('stats', stats, this.cacheConfig.ttl.stats);
    this.logger.debug('InvoiceService: Cached stats result', { orgId });

    return stats;
  }

  /**
   * Create invoice and invalidate cache
   */
  async create(data, orgId, userId) {
    const invoice = await this.service.create(data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return invoice;
  }

  /**
   * Update invoice and invalidate cache
   */
  async update(id, data, orgId, userId) {
    const invoice = await this.service.update(id, data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return invoice;
  }

  /**
   * Delete invoice and invalidate cache
   */
  async delete(id, orgId, userId) {
    const result = await this.service.delete(id, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return result;
  }

  /**
   * Bulk create invoices and invalidate cache
   */
  async bulkCreate(invoicesData, orgId, userId) {
    const result = await this.service.bulkCreate(invoicesData, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk update invoices and invalidate cache
   */
  async bulkUpdate(updates, orgId, userId) {
    const result = await this.service.bulkUpdate(updates, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk delete invoices and invalidate cache
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
    
    this.logger.debug('InvoiceService: Cache invalidated', { orgId, entityId });
  }
}

module.exports = new InvoiceServiceCached();
