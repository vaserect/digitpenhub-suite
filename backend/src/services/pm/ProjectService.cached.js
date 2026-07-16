const projectService = require('./ProjectService');
const { createCacheHelper } = require('../../cache/cacheDecorators');
const cacheConfig = require('../../config/cache.config');

/**
 * ProjectServiceCached - ProjectService with caching layer
 * 
 * Wraps ProjectService methods with intelligent caching:
 * - Caches read operations with different TTLs for stats vs regular data
 * - Invalidates cache on write operations
 * - Cascades invalidation to related task caches
 */
class ProjectServiceCached {
  constructor() {
    this.service = projectService;
    this.cacheConfig = cacheConfig.entities.project;
    this.logger = projectService.logger;
    this.repository = projectService.repository;
  }

  /**
   * Get cache helper for organization
   */
  getCacheHelper(orgId) {
    return createCacheHelper(this.cacheConfig.namespace, orgId);
  }

  /**
   * Find project by ID with caching
   */
  async findById(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    const cached = await cache.get('findById', id);
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for findById', { id, orgId });
      return cached;
    }

    const project = await this.service.findById(id, orgId);
    
    if (project) {
      await cache.set('findById', project, this.cacheConfig.ttl.findById, id);
      this.logger.debug('ProjectService: Cached findById result', { id, orgId });
    }

    return project;
  }

  /**
   * Find project by ID with stats (shorter TTL due to dynamic data)
   */
  async findByIdWithStats(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    const cached = await cache.get('findByIdWithStats', id);
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for findByIdWithStats', { id, orgId });
      return cached;
    }

    const project = await this.service.findByIdWithStats(id, orgId);
    
    if (project) {
      await cache.set('findByIdWithStats', project, this.cacheConfig.ttl.findByIdWithStats, id);
      this.logger.debug('ProjectService: Cached findByIdWithStats result', { id, orgId });
    }

    return project;
  }

  /**
   * Find all projects with caching
   */
  async findAll(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    const cached = await cache.get('findAll', cacheKey);
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for findAll', { orgId });
      return cached;
    }

    const projects = await this.service.findAll(orgId, options);
    
    await cache.set('findAll', projects, this.cacheConfig.ttl.findAll, cacheKey);
    this.logger.debug('ProjectService: Cached findAll result', { orgId, count: projects.length });

    return projects;
  }

  /**
   * Find all projects with stats
   */
  async findAllWithStats(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    const cached = await cache.get('findAllWithStats', cacheKey);
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for findAllWithStats', { orgId });
      return cached;
    }

    const projects = await this.service.findAllWithStats(orgId, options);
    
    await cache.set('findAllWithStats', projects, this.cacheConfig.ttl.findAllWithStats, cacheKey);
    this.logger.debug('ProjectService: Cached findAllWithStats result', { orgId, count: projects.length });

    return projects;
  }

  /**
   * Search projects with caching
   */
  async search(query, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    
    const cached = await cache.get('search', cacheKey);
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for search', { query, orgId });
      return cached;
    }

    const projects = await this.service.search(query, orgId, options);
    
    await cache.set('search', projects, this.cacheConfig.ttl.search, cacheKey);
    this.logger.debug('ProjectService: Cached search result', { query, orgId, count: projects.length });

    return projects;
  }

  /**
   * Get statistics with caching
   */
  async getStatistics(orgId) {
    const cache = this.getCacheHelper(orgId);
    
    const cached = await cache.get('stats');
    if (cached !== null) {
      this.logger.debug('ProjectService: Cache hit for stats', { orgId });
      return cached;
    }

    const stats = await this.service.getStatistics(orgId);
    
    await cache.set('stats', stats, this.cacheConfig.ttl.stats);
    this.logger.debug('ProjectService: Cached stats result', { orgId });

    return stats;
  }

  /**
   * Create project and invalidate cache
   */
  async create(data, orgId, userId) {
    const project = await this.service.create(data, orgId, userId);
    await this.invalidateCache(orgId);
    return project;
  }

  /**
   * Update project and invalidate cache
   */
  async update(id, data, orgId, userId) {
    const project = await this.service.update(id, data, orgId, userId);
    await this.invalidateCache(orgId, id);
    return project;
  }

  /**
   * Delete project and invalidate cache
   */
  async delete(id, orgId, userId) {
    const result = await this.service.delete(id, orgId, userId);
    await this.invalidateCache(orgId, id);
    return result;
  }

  /**
   * Bulk create projects and invalidate cache
   */
  async bulkCreate(projectsData, orgId, userId) {
    const result = await this.service.bulkCreate(projectsData, orgId, userId);
    await this.invalidateCache(orgId);
    return result;
  }

  /**
   * Invalidate cache for organization
   */
  async invalidateCache(orgId, entityId = null) {
    const cache = this.getCacheHelper(orgId);
    
    if (entityId) {
      await cache.invalidateEntity(entityId);
    } else {
      await cache.invalidateLists();
    }
    
    // Also invalidate stats
    await cache.delete('stats');
    
    this.logger.debug('ProjectService: Cache invalidated', { orgId, entityId });
  }
}

module.exports = new ProjectServiceCached();
