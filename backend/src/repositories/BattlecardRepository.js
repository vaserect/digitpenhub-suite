const BaseRepository = require('./base/BaseRepository');

/**
 * BattlecardRepository - Handles database operations for competitive battlecards
 */
class BattlecardRepository extends BaseRepository {
  constructor(db) {
    super(db, 'battlecards', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  /**
   * Find all battlecards with filters
   */
  async findAll(orgId, filters = {}) {
    try {
      const { status, search, limit = 50, offset = 0 } = filters;
      
      let query = `
        SELECT b.*, 
               u.full_name as creator_name,
               COUNT(DISTINCT cv.id) as view_count,
               COUNT(DISTINCT cf.id) as favorite_count,
               COALESCE(AVG(cr.rating), 0) as avg_rating
        FROM battlecards b
        LEFT JOIN users u ON b.created_by = u.id
        LEFT JOIN content_views cv ON cv.content_type = 'battlecard' AND cv.content_id = b.id
        LEFT JOIN content_favorites cf ON cf.content_type = 'battlecard' AND cf.content_id = b.id
        LEFT JOIN content_ratings cr ON cr.content_type = 'battlecard' AND cr.content_id = b.id
        WHERE b.org_id = $1
      `;
      
      const params = [orgId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (search) {
        query += ` AND (b.competitor_name ILIKE $${paramIndex} OR b.overview ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      query += `
        GROUP BY b.id, u.full_name
        ORDER BY b.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('BattlecardRepository: Error finding all', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Find battlecard by ID with details
   */
  async findByIdWithDetails(id, orgId) {
    try {
      const query = `
        SELECT b.*,
               u.full_name as creator_name,
               COUNT(DISTINCT cv.id) as view_count,
               COUNT(DISTINCT cf.id) as favorite_count,
               COALESCE(AVG(cr.rating), 0) as avg_rating,
               json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
                 FILTER (WHERE t.id IS NOT NULL) as tags
        FROM battlecards b
        LEFT JOIN users u ON b.created_by = u.id
        LEFT JOIN content_views cv ON cv.content_type = 'battlecard' AND cv.content_id = b.id
        LEFT JOIN content_favorites cf ON cf.content_type = 'battlecard' AND cf.content_id = b.id
        LEFT JOIN content_ratings cr ON cr.content_type = 'battlecard' AND cr.content_id = b.id
        LEFT JOIN battlecard_tags bt ON bt.battlecard_id = b.id
        LEFT JOIN content_tags t ON bt.tag_id = t.id
        WHERE b.id = $1 AND b.org_id = $2
        GROUP BY b.id, u.full_name
      `;
      
      const { rows } = await this.db.query(query, [id, orgId]);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('BattlecardRepository: Error finding by ID with details', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Find by competitor name
   */
  async findByCompetitor(competitorName, orgId) {
    try {
      const query = `
        SELECT b.*, u.full_name as creator_name
        FROM battlecards b
        LEFT JOIN users u ON b.created_by = u.id
        WHERE b.competitor_name ILIKE $1 AND b.org_id = $2
        ORDER BY b.updated_at DESC
      `;
      
      const { rows } = await this.db.query(query, [`%${competitorName}%`, orgId]);
      return rows;
    } catch (error) {
      this.logger.error('BattlecardRepository: Error finding by competitor', { competitorName, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Create battlecard
   */
  async create(data, orgId, userId) {
    try {
      const query = `
        INSERT INTO battlecards (
          org_id, competitor_name, competitor_logo, overview, strengths, weaknesses,
          differentiators, pricing_comparison, feature_comparison, win_strategies,
          objection_handling, market_position, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const params = [
        orgId,
        data.competitor_name,
        data.competitor_logo || null,
        data.overview || null,
        JSON.stringify(data.strengths || []),
        JSON.stringify(data.weaknesses || []),
        JSON.stringify(data.differentiators || []),
        JSON.stringify(data.pricing_comparison || {}),
        JSON.stringify(data.feature_comparison || {}),
        JSON.stringify(data.win_strategies || []),
        JSON.stringify(data.objection_handling || []),
        data.market_position || null,
        data.status || 'draft',
        userId
      ];
      
      const { rows } = await this.db.query(query, params);
      return rows[0];
    } catch (error) {
      this.logger.error('BattlecardRepository: Error creating', { data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Update battlecard
   */
  async update(id, data, orgId) {
    try {
      const fields = [];
      const params = [];
      let paramIndex = 1;
      
      const allowedFields = [
        'competitor_name', 'competitor_logo', 'overview', 'strengths', 'weaknesses',
        'differentiators', 'pricing_comparison', 'feature_comparison', 'win_strategies',
        'objection_handling', 'market_position', 'status'
      ];
      
      const jsonFields = [
        'strengths', 'weaknesses', 'differentiators', 'pricing_comparison',
        'feature_comparison', 'win_strategies', 'objection_handling'
      ];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          params.push(
            jsonFields.includes(field) && typeof data[field] === 'object'
              ? JSON.stringify(data[field])
              : data[field]
          );
          paramIndex++;
        }
      }
      
      if (fields.length === 0) {
        return this.findById(id, orgId);
      }
      
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id, orgId);
      
      const query = `
        UPDATE battlecards
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const { rows } = await this.db.query(query, params);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('BattlecardRepository: Error updating', { id, data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(orgId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_battlecards,
          COUNT(*) FILTER (WHERE status = 'published') as published_count,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
          COUNT(DISTINCT cv.user_id) as total_viewers,
          COUNT(cv.id) as total_views
        FROM battlecards b
        LEFT JOIN content_views cv ON cv.content_type = 'battlecard' AND cv.content_id = b.id
        WHERE b.org_id = $1
      `;
      
      const { rows } = await this.db.query(query, [orgId]);
      return rows[0];
    } catch (error) {
      this.logger.error('BattlecardRepository: Error getting statistics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = BattlecardRepository;
