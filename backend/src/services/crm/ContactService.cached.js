const contactService = require('./ContactService');
const { createCacheHelper } = require('../../cache/cacheDecorators');
const cacheConfig = require('../../config/cache.config');

/**
 * ContactServiceCached - ContactService with caching layer
 * 
 * Wraps ContactService methods with intelligent caching:
 * - Caches read operations (findById, findAll, search)
 * - Invalidates cache on write operations (create, update, delete)
 * - Supports multi-tenancy with org-specific cache keys
 */
class ContactServiceCached {
  constructor() {
    this.service = contactService;
    this.cacheConfig = cacheConfig.entities.contact;
    this.logger = contactService.logger;
    this.repository = contactService.repository;
  }

  /**
   * Get cache helper for organization
   */
  getCacheHelper(orgId) {
    return createCacheHelper(this.cacheConfig.namespace, orgId);
  }

  /**
   * Find contact by ID with caching
   */
  async findById(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    // Try cache first
    const cached = await cache.get('findById', id);
    if (cached !== null) {
      this.logger.debug('ContactService: Cache hit for findById', { id, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const contact = await this.service.findById(id, orgId);
    
    // Cache the result
    if (contact) {
      await cache.set('findById', contact, this.cacheConfig.ttl.findById, id);
      this.logger.debug('ContactService: Cached findById result', { id, orgId });
    }

    return contact;
  }

  /**
   * Find all contacts with caching
   */
  async findAll(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    // Try cache first
    const cached = await cache.get('findAll', cacheKey);
    if (cached !== null) {
      this.logger.debug('ContactService: Cache hit for findAll', { orgId, options });
      return cached;
    }

    // Cache miss - fetch from database
    const contacts = await this.service.findAll(orgId, options);
    
    // Cache the result
    await cache.set('findAll', contacts, this.cacheConfig.ttl.findAll, cacheKey);
    this.logger.debug('ContactService: Cached findAll result', { orgId, count: contacts.length });

    return contacts;
  }

  /**
   * Search contacts with caching
   */
  async search(query, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await cache.get('search', cacheKey);
    if (cached !== null) {
      this.logger.debug('ContactService: Cache hit for search', { query, orgId });
      return cached;
    }

    // Cache miss - fetch from database
    const contacts = await this.service.search(query, orgId, options);
    
    // Cache the result
    await cache.set('search', contacts, this.cacheConfig.ttl.search, cacheKey);
    this.logger.debug('ContactService: Cached search result', { query, orgId, count: contacts.length });

    return contacts;
  }

  /**
   * Count contacts with caching
   */
  async count(orgId, filters = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(filters);
    
    // Try cache first
    const cached = await cache.get('count', cacheKey);
    if (cached !== null) {
      this.logger.debug('ContactService: Cache hit for count', { orgId, filters });
      return cached;
    }

    // Cache miss - fetch from database
    const count = await this.service.count(orgId, filters);
    
    // Cache the result
    await cache.set('count', count, this.cacheConfig.ttl.count, cacheKey);
    this.logger.debug('ContactService: Cached count result', { orgId, count });

    return count;
  }

  /**
   * Create contact and invalidate cache
   */
  async create(data, orgId, userId) {
    const contact = await this.service.create(data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return contact;
  }

  /**
   * Update contact and invalidate cache
   */
  async update(id, data, orgId, userId) {
    const contact = await this.service.update(id, data, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return contact;
  }

  /**
   * Delete contact and invalidate cache
   */
  async delete(id, orgId, userId) {
    const result = await this.service.delete(id, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId, id);
    
    return result;
  }

  /**
   * Bulk create contacts and invalidate cache
   */
  async bulkCreate(contactsData, orgId, userId) {
    const result = await this.service.bulkCreate(contactsData, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk update contacts and invalidate cache
   */
  async bulkUpdate(updates, orgId, userId) {
    const result = await this.service.bulkUpdate(updates, orgId, userId);
    
    // Invalidate cache
    await this.invalidateCache(orgId);
    
    return result;
  }

  /**
   * Bulk delete contacts and invalidate cache
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
    
    this.logger.debug('ContactService: Cache invalidated', { orgId, entityId });
  }
}

module.exports = new ContactServiceCached();
