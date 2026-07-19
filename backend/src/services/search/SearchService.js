/**
 * SearchService - Global Search Service
 * 
 * Provides cross-module search functionality across all entities in the platform.
 * Follows the established service pattern used in CRM, PM, Invoicing modules.
 * 
 * @module services/search/SearchService
 */

const BaseService = require('../base/BaseService');
const SearchRepository = require('../../repositories/search/SearchRepository');
const logger = require('../../utils/logger');

class SearchService extends BaseService {
  constructor() {
    super(new SearchRepository());
  }

  /**
   * Perform a global search across all indexed entities
   */
  async search({ query, entityTypes, orgId, userId, limit = 20, offset = 0, filters = {} }) {
    const startTime = Date.now();
    
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }
      
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const sanitizedQuery = query.trim().substring(0, 500);
      
      const results = await this.repository.search({
        query: sanitizedQuery,
        entityTypes,
        orgId,
        limit: Math.min(limit, 100),
        offset: Math.max(offset, 0),
        filters
      });

      const totalCount = await this.repository.countSearchResults({
        query: sanitizedQuery,
        entityTypes,
        orgId,
        filters
      });

      const responseTime = Date.now() - startTime;

      this._trackSearchHistory({
        userId,
        orgId,
        query: sanitizedQuery,
        filters: { entityTypes, ...filters },
        resultCount: results.length,
        responseTime
      }).catch(err => {
        logger.error('Failed to track search history', { error: err.message });
      });

      return {
        results,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        metadata: {
          query: sanitizedQuery,
          responseTime,
          appliedFilters: {
            entityTypes: entityTypes || 'all',
            ...filters
          }
        }
      };
    } catch (error) {
      logger.error('Search failed', {
        query,
        orgId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getSuggestions({ query, orgId, limit = 5 }) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const sanitizedQuery = query.trim().substring(0, 100);
      
      return await this.repository.getSuggestions({
        query: sanitizedQuery,
        orgId,
        limit: Math.min(limit, 10)
      });
    } catch (error) {
      logger.error('Failed to get search suggestions', {
        query,
        orgId,
        error: error.message
      });
      return [];
    }
  }

  async getRecentSearches(userId, orgId, limit = 10) {
    try {
      return await this.repository.getRecentSearches(userId, orgId, limit);
    } catch (error) {
      logger.error('Failed to get recent searches', {
        userId,
        orgId,
        error: error.message
      });
      return [];
    }
  }

  async indexEntity({ entityType, entityId, title, content, metadata, orgId, createdBy }) {
    try {
      if (!entityType || !entityId || !title || !orgId) {
        throw new Error('entityType, entityId, title, and orgId are required');
      }

      const searchableText = this._buildSearchableText({
        title,
        content,
        metadata
      });

      return await this.repository.indexEntity({
        entityType,
        entityId,
        title: title.substring(0, 500),
        content: content ? content.substring(0, 10000) : null,
        metadata,
        searchableText,
        orgId,
        createdBy
      });
    } catch (error) {
      logger.error('Failed to index entity', {
        entityType,
        entityId,
        orgId,
        error: error.message
      });
      throw error;
    }
  }

  async bulkIndex(entities, orgId) {
    try {
      if (!Array.isArray(entities) || entities.length === 0) {
        return { indexed: 0, failed: 0 };
      }

      const chunkSize = 100;
      let indexed = 0;
      let failed = 0;

      for (let i = 0; i < entities.length; i += chunkSize) {
        const chunk = entities.slice(i, i + chunkSize);
        
        const processedChunk = chunk.map(entity => ({
          ...entity,
          searchableText: this._buildSearchableText(entity),
          orgId
        }));

        try {
          const result = await this.repository.bulkIndex(processedChunk);
          indexed += result.indexed;
          failed += result.failed;
        } catch (error) {
          logger.error('Bulk index chunk failed', {
            chunkStart: i,
            chunkSize: chunk.length,
            error: error.message
          });
          failed += chunk.length;
        }
      }

      logger.info('Bulk indexing completed', {
        total: entities.length,
        indexed,
        failed,
        orgId
      });

      return { indexed, failed, total: entities.length };
    } catch (error) {
      logger.error('Bulk index failed', {
        entityCount: entities.length,
        orgId,
        error: error.message
      });
      throw error;
    }
  }

  async removeFromIndex(entityType, entityId, orgId) {
    try {
      await this.repository.removeFromIndex(entityType, entityId, orgId);
      return true;
    } catch (error) {
      logger.error('Failed to remove from index', {
        entityType,
        entityId,
        orgId,
        error: error.message
      });
      return false;
    }
  }

  async rebuildIndex(orgId) {
    try {
      logger.info('Starting index rebuild', { orgId });
      await this.repository.clearIndex(orgId);
      logger.info('Index rebuild completed', { orgId });

      return {
        success: true,
        message: 'Index cleared. Re-indexing will occur as entities are accessed.',
        orgId
      };
    } catch (error) {
      logger.error('Index rebuild failed', {
        orgId,
        error: error.message
      });
      throw error;
    }
  }

  async _trackSearchHistory({ userId, orgId, query, filters, resultCount, responseTime }) {
    try {
      await this.repository.trackSearchHistory({
        userId,
        orgId,
        query,
        filters,
        resultCount,
        responseTime
      });
    } catch (error) {
      logger.warn('Failed to track search history', {
        userId,
        orgId,
        error: error.message
      });
    }
  }

  _buildSearchableText({ title, content, metadata }) {
    const parts = [title];
    
    if (content) {
      parts.push(content);
    }
    
    if (metadata && typeof metadata === 'object') {
      Object.values(metadata).forEach(value => {
        if (typeof value === 'string' || typeof value === 'number') {
          parts.push(String(value));
        }
      });
    }
    
    return parts.join(' ').substring(0, 65535);
  }
}

module.exports = SearchService;
