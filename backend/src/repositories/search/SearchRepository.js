/**
 * SearchRepository - Data access layer for Global Search
 * PostgreSQL implementation with full-text search
 */

const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');

class SearchRepository extends BaseRepository {
  constructor() {
    super(db, 'search_index');
  }

  /**
   * Enhanced search with relevance scoring, fuzzy matching, and synonym expansion
   * Phase 5: Search Quality improvements
   */
  async search({ query, entityTypes, orgId, limit, offset, filters }) {
    try {
      // Get synonyms for query expansion
      const synonyms = await this.getSynonyms(query, orgId);
      const expandedTerms = [query, ...synonyms];
      const expandedQuery = expandedTerms.map(t => t.replace(/\s+/g, ' & ')).join(' | ');

      let sql = `
        WITH fuzzy_matches AS (
          SELECT
            id, entity_type, entity_id, title, content, metadata,
            created_by, created_at, updated_at,
            (
              CASE WHEN title ILIKE '%' || $1 || '%' THEN 10.0 ELSE 0.0 END +
              ts_rank(
                to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,'')),
                to_tsquery('english', $3)
              ) * 5.0 +
              similarity(title, $1) * 3.0 +
              similarity(coalesce(content, ''), $1) * 1.0
            ) as relevance
          FROM search_index
          WHERE org_id = $2
            AND (
              to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,''))
              @@ to_tsquery('english', $3)
              OR similarity(title, $1) > 0.3
              OR similarity(coalesce(content, ''), $1) > 0.2
            )
        )
        SELECT * FROM fuzzy_matches WHERE relevance > 0.1
      `;

      const params = [query, orgId, expandedQuery];
      let paramIndex = 4;

      if (entityTypes && Array.isArray(entityTypes) && entityTypes.length > 0) {
        sql += ` AND entity_type = ANY($${paramIndex})`;
        params.push(entityTypes);
        paramIndex++;
      }

      if (filters.createdBy) {
        sql += ` AND created_by = $${paramIndex}`;
        params.push(filters.createdBy);
        paramIndex++;
      }

      if (filters.dateFrom) {
        sql += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }

      if (filters.dateTo) {
        sql += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }

      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        sql += ` AND metadata->>'status' = ANY($${paramIndex})`;
        params.push(filters.status);
        paramIndex++;
      }

      let orderBy = 'relevance DESC, updated_at DESC';
      if (filters.sortBy === 'date') {
        orderBy = 'created_at DESC, relevance DESC';
      } else if (filters.sortBy === 'name') {
        orderBy = 'title ASC, relevance DESC';
      }

      sql += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(sql, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Enhanced search query failed: ${error.message}`);
    }
  }

  /**
   * Get synonyms for a search term to expand query coverage
   */
  async getSynonyms(term, orgId) {
    try {
      const sql = `
        SELECT DISTINCT synonym
        FROM search_synonyms
        WHERE LOWER(term) = LOWER($1)
          AND (org_id = $2 OR org_id IS NULL)
        LIMIT 10
      `;
      const result = await db.query(sql, [term, orgId]);
      return result.rows.map(row => row.synonym);
    } catch (error) {
      console.error('Failed to get synonyms:', error);
      return [];
    }
  }

  async countSearchResults({ query, entityTypes, orgId, filters }) {
    try {
      let sql = `
        SELECT COUNT(*) as total
        FROM search_index
        WHERE org_id = $1
          AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,''))
              @@ plainto_tsquery('english', $2)
      `;
      
      const params = [orgId, query];
      let paramIndex = 3;

      if (entityTypes && Array.isArray(entityTypes) && entityTypes.length > 0) {
        sql += ` AND entity_type = ANY($${paramIndex})`;
        params.push(entityTypes);
        paramIndex++;
      }

      if (filters.createdBy) {
        sql += ` AND created_by = $${paramIndex}`;
        params.push(filters.createdBy);
        paramIndex++;
      }

      if (filters.dateFrom) {
        sql += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }

      if (filters.dateTo) {
        sql += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }

      const result = await db.query(sql, params);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Count search results failed: ${error.message}`);
    }
  }

  async getSuggestions({ query, orgId, limit }) {
    try {
      const sql = `
        SELECT DISTINCT entity_type, entity_id, title,
          ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,'')),
                  plainto_tsquery('english', $1)) as relevance
        FROM search_index
        WHERE org_id = $2
          AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,''))
              @@ plainto_tsquery('english', $1)
        ORDER BY relevance DESC, updated_at DESC
        LIMIT $3
      `;
      
      const result = await db.query(sql, [query, orgId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Get suggestions failed: ${error.message}`);
    }
  }

  async indexEntity({ entityType, entityId, title, content, metadata, searchableText, orgId, createdBy }) {
    try {
      const sql = `
        INSERT INTO search_index (
          entity_type, entity_id, title, content, metadata, 
          searchable_text, org_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (entity_type, entity_id, org_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          searchable_text = EXCLUDED.searchable_text,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const result = await db.query(sql, [
        entityType, entityId, title, content,
        metadata, searchableText, orgId, createdBy
      ]);
      
      return { success: true, id: result.rows[0].id };
    } catch (error) {
      throw new Error(`Index entity failed: ${error.message}`);
    }
  }

  async bulkIndex(entities) {
    try {
      if (entities.length === 0) {
        return { indexed: 0, failed: 0 };
      }

      const values = entities.map((e, i) => {
        const base = i * 8;
        return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7}, $${base+8})`;
      }).join(',');

      const sql = `
        INSERT INTO search_index (
          entity_type, entity_id, title, content, metadata, 
          searchable_text, org_id, created_by
        ) VALUES ${values}
        ON CONFLICT (entity_type, entity_id, org_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          searchable_text = EXCLUDED.searchable_text,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const params = entities.flatMap(e => [
        e.entityType, e.entityId, e.title, e.content,
        e.metadata, e.searchableText, e.orgId, e.createdBy
      ]);
      
      const result = await db.query(sql, params);
      return { indexed: result.rowCount, failed: 0 };
    } catch (error) {
      throw new Error(`Bulk index failed: ${error.message}`);
    }
  }

  async removeFromIndex(entityType, entityId, orgId) {
    try {
      await db.query(
        'DELETE FROM search_index WHERE entity_type = $1 AND entity_id = $2 AND org_id = $3',
        [entityType, entityId, orgId]
      );
      return true;
    } catch (error) {
      throw new Error(`Remove from index failed: ${error.message}`);
    }
  }

  async clearIndex(orgId) {
    try {
      await db.query('DELETE FROM search_index WHERE org_id = $1', [orgId]);
      return true;
    } catch (error) {
      throw new Error(`Clear index failed: ${error.message}`);
    }
  }

  async trackSearchHistory({ userId, orgId, query, filters, resultCount, responseTime }) {
    try {
      await db.query(
        `INSERT INTO search_history (user_id, org_id, query, filters, result_count, response_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, orgId, query, filters, resultCount, responseTime]
      );
      return true;
    } catch (error) {
      throw new Error(`Track search history failed: ${error.message}`);
    }
  }

  async getRecentSearches(userId, orgId, limit) {
    try {
      const result = await db.query(
        `SELECT DISTINCT query, filters, created_at
         FROM search_history
         WHERE user_id = $1 AND org_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [userId, orgId, limit]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Get recent searches failed: ${error.message}`);
    }
  }

  async getSavedSearches(userId, orgId) {
    try {
      const result = await db.query(
        `SELECT id, name, query, filters, is_shared, use_count, last_used_at, created_at
         FROM saved_searches
         WHERE (user_id = $1 OR is_shared = TRUE) AND org_id = $2
         ORDER BY use_count DESC, last_used_at DESC`,
        [userId, orgId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Get saved searches failed: ${error.message}`);
    }
  }

  async saveSearch({ userId, orgId, name, query, filters, isShared }) {
    try {
      const result = await db.query(
        `INSERT INTO saved_searches (user_id, org_id, name, query, filters, is_shared)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, query`,
        [userId, orgId, name, query, filters, isShared]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Save search failed: ${error.message}`);
    }
  }

  async deleteSavedSearch(searchId, userId, orgId) {
    try {
      const result = await db.query(
        'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 AND org_id = $3',
        [searchId, userId, orgId]
      );
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Delete saved search failed: ${error.message}`);
    }
  }
}

module.exports = SearchRepository;
