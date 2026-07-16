const logger = require('../../utils/logger');

/**
 * Base service class providing common CRUD operations
 * All domain services should extend this class
 */
class BaseService {
  /**
   * @param {Object} repository - Repository instance for data access
   * @param {Object} options - Service configuration options
   */
  constructor(repository, options = {}) {
    if (!repository) {
      throw new Error('Repository is required for BaseService');
    }
    
    this.repository = repository;
    this.logger = options.logger || logger;
    this.serviceName = options.serviceName || this.constructor.name;
  }

  /**
   * Find entity by ID
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID for tenant isolation
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findById(id, orgId) {
    this.logger.debug(`${this.serviceName}: Finding by ID`, { id, orgId });
    
    try {
      const entity = await this.repository.findById(id, orgId);
      
      if (!entity) {
        this.logger.debug(`${this.serviceName}: Entity not found`, { id, orgId });
        return null;
      }
      
      return this.enrichEntity(entity);
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error finding by ID`, {
        id,
        orgId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find all entities for an organization
   * @param {number} orgId - Organization ID
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of entities
   */
  async findAll(orgId, filters = {}, pagination = {}) {
    this.logger.debug(`${this.serviceName}: Finding all`, { orgId, filters, pagination });
    
    try {
      const entities = await this.repository.findAll(orgId, filters, pagination);
      return entities.map(entity => this.enrichEntity(entity));
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error finding all`, {
        orgId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<Object>} Created entity
   */
  async create(data, orgId, userId = null) {
    this.logger.info(`${this.serviceName}: Creating entity`, { orgId, userId });
    
    try {
      // Validate data
      this.validateCreate(data);
      
      // Transform data before creation
      const transformedData = this.transformForCreate(data);
      
      // Create entity
      const entity = await this.repository.create(transformedData, orgId, userId);
      
      this.logger.info(`${this.serviceName}: Entity created`, {
        id: entity.id,
        orgId,
        userId,
      });
      
      // Post-creation hook
      await this.afterCreate(entity, orgId, userId);
      
      return this.enrichEntity(entity);
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error creating entity`, {
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param {number} id - Entity ID
   * @param {Object} data - Updated data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<Object|null>} Updated entity or null if not found
   */
  async update(id, data, orgId, userId = null) {
    this.logger.info(`${this.serviceName}: Updating entity`, { id, orgId, userId });
    
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id, orgId);
      if (!existing) {
        this.logger.warn(`${this.serviceName}: Entity not found for update`, { id, orgId });
        return null;
      }
      
      // Validate update data
      this.validateUpdate(data, existing);
      
      // Transform data before update
      const transformedData = this.transformForUpdate(data, existing);
      
      // Update entity
      const entity = await this.repository.update(id, transformedData, orgId, userId);
      
      this.logger.info(`${this.serviceName}: Entity updated`, {
        id,
        orgId,
        userId,
      });
      
      // Post-update hook
      await this.afterUpdate(entity, existing, orgId, userId);
      
      return this.enrichEntity(entity);
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error updating entity`, {
        id,
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, orgId, userId = null) {
    this.logger.info(`${this.serviceName}: Deleting entity`, { id, orgId, userId });
    
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id, orgId);
      if (!existing) {
        this.logger.warn(`${this.serviceName}: Entity not found for deletion`, { id, orgId });
        return false;
      }
      
      // Validate deletion
      this.validateDelete(existing);
      
      // Pre-deletion hook
      await this.beforeDelete(existing, orgId, userId);
      
      // Delete entity
      const deleted = await this.repository.delete(id, orgId);
      
      if (deleted) {
        this.logger.info(`${this.serviceName}: Entity deleted`, {
          id,
          orgId,
          userId,
        });
        
        // Post-deletion hook
        await this.afterDelete(existing, orgId, userId);
      }
      
      return deleted;
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error deleting entity`, {
        id,
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Count entities matching criteria
   * @param {number} orgId - Organization ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of entities
   */
  async count(orgId, filters = {}) {
    this.logger.debug(`${this.serviceName}: Counting entities`, { orgId, filters });
    
    try {
      return await this.repository.count(orgId, filters);
    } catch (error) {
      this.logger.error(`${this.serviceName}: Error counting entities`, {
        orgId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ============================================================================
  // Hooks - Override in subclasses for custom behavior
  // ============================================================================

  /**
   * Enrich entity with computed fields or additional data
   * Override in subclasses to add custom enrichment
   * @param {Object} entity - Raw entity from repository
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    return entity;
  }

  /**
   * Validate data before creation
   * Override in subclasses for custom validation
   * @param {Object} data - Data to validate
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    // Override in subclasses
  }

  /**
   * Validate data before update
   * Override in subclasses for custom validation
   * @param {Object} data - Data to validate
   * @param {Object} existing - Existing entity
   * @throws {Error} If validation fails
   */
  validateUpdate(data, existing) {
    // Override in subclasses
  }

  /**
   * Validate before deletion
   * Override in subclasses for custom validation
   * @param {Object} existing - Entity to delete
   * @throws {Error} If validation fails
   */
  validateDelete(existing) {
    // Override in subclasses
  }

  /**
   * Transform data before creation
   * Override in subclasses for custom transformation
   * @param {Object} data - Data to transform
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    return data;
  }

  /**
   * Transform data before update
   * Override in subclasses for custom transformation
   * @param {Object} data - Data to transform
   * @param {Object} existing - Existing entity
   * @returns {Object} Transformed data
   */
  transformForUpdate(data, existing) {
    return data;
  }

  /**
   * Hook called after entity creation
   * Override in subclasses for post-creation logic
   * @param {Object} entity - Created entity
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   */
  async afterCreate(entity, orgId, userId) {
    // Override in subclasses
  }

  /**
   * Hook called after entity update
   * Override in subclasses for post-update logic
   * @param {Object} entity - Updated entity
   * @param {Object} previous - Previous entity state
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   */
  async afterUpdate(entity, previous, orgId, userId) {
    // Override in subclasses
  }

  /**
   * Hook called before entity deletion
   * Override in subclasses for pre-deletion logic
   * @param {Object} entity - Entity to delete
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   */
  async beforeDelete(entity, orgId, userId) {
    // Override in subclasses
  }

  /**
   * Hook called after entity deletion
   * Override in subclasses for post-deletion logic
   * @param {Object} entity - Deleted entity
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   */
  async afterDelete(entity, orgId, userId) {
    // Override in subclasses
  }
}

module.exports = BaseService;
