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

  async search({ query, entityTypes, orgId, limit, offset, filters }) {
    try {
      let sql = `
        SELECT 
          id, entity_type, entity_id, title, content, metadata,
          created_by, created_at, updated_at,
          ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,'')), 
                  plainto_tsquery('english', $1)) as relevance
        FROM search_index
        WHERE org_id = $2
          AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,''))
              @@ plainto_tsquery('english', $1)
      `;
      
      const params = [query, orgId];
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

      // Status filter (for entities that have status field)
      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        sql += ` AND metadata->'status' = ANY($${paramIndex})`;
        params.push(filters.status);
        paramIndex++;
      }

      // Sort logic
      let orderBy = 'relevance DESC, updated_at DESC';
      if (filters.sortBy === 'date') {
        orderBy = 'created_at DESC, relevance DESC';
      } else if (filters.sortBy === 'name') {
        orderBy = 'title ASC, relevance DESC';
      }

      sql += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);


      // Status filter (for entities that have status field)
      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        sql += ` AND metadata->'status' = ANY($${paramIndex})`;
        params.push(filters.status);
        paramIndex++;
      }
      const result = await db.query(sql, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Search query failed: ${error.message}`);
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

