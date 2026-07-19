const BaseRepository = require('./base/BaseRepository');

/**
 * PlaybookRepository - Handles database operations for sales playbooks
 */
class PlaybookRepository extends BaseRepository {
  constructor(db) {
    super(db, 'playbooks', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  /**
   * Find all playbooks with filters
   */
  async findAll(orgId, filters = {}) {
    try {
      const { status, category, search, limit = 50, offset = 0 } = filters;
      
      let query = `
        SELECT p.*, 
               u.full_name as creator_name,
               COUNT(DISTINCT cv.id) as view_count,
               COUNT(DISTINCT cf.id) as favorite_count,
               COALESCE(AVG(cr.rating), 0) as avg_rating
        FROM playbooks p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN content_views cv ON cv.content_type = 'playbook' AND cv.content_id = p.id
        LEFT JOIN content_favorites cf ON cf.content_type = 'playbook' AND cf.content_id = p.id
        LEFT JOIN content_ratings cr ON cr.content_type = 'playbook' AND cr.content_id = p.id
        WHERE p.org_id = $1
      `;
      
      const params = [orgId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (category) {
        query += ` AND p.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }
      
      if (search) {
        query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      query += `
        GROUP BY p.id, u.full_name
        ORDER BY p.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('PlaybookRepository: Error finding all', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Find playbook by ID with details
   */
  async findByIdWithDetails(id, orgId) {
    try {
      const query = `
        SELECT p.*,
               u.full_name as creator_name,
               COUNT(DISTINCT cv.id) as view_count,
               COUNT(DISTINCT cf.id) as favorite_count,
               COALESCE(AVG(cr.rating), 0) as avg_rating,
               json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
                 FILTER (WHERE t.id IS NOT NULL) as tags
        FROM playbooks p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN content_views cv ON cv.content_type = 'playbook' AND cv.content_id = p.id
        LEFT JOIN content_favorites cf ON cf.content_type = 'playbook' AND cf.content_id = p.id
        LEFT JOIN content_ratings cr ON cr.content_type = 'playbook' AND cr.content_id = p.id
        LEFT JOIN playbook_tags pt ON pt.playbook_id = p.id
        LEFT JOIN content_tags t ON pt.tag_id = t.id
        WHERE p.id = $1 AND p.org_id = $2
        GROUP BY p.id, u.full_name
      `;
      
      const { rows } = await this.db.query(query, [id, orgId]);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('PlaybookRepository: Error finding by ID with details', { id, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Create playbook
   */
  async create(data, orgId, userId) {
    try {
      const query = `
        INSERT INTO playbooks (
          org_id, title, description, category, status, content, metadata, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const params = [
        orgId,
        data.title,
        data.description || null,
        data.category || null,
        data.status || 'draft',
        JSON.stringify(data.content || {}),
        JSON.stringify(data.metadata || {}),
        userId
      ];
      
      const { rows } = await this.db.query(query, params);
      return rows[0];
    } catch (error) {
      this.logger.error('PlaybookRepository: Error creating', { data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Update playbook
   */
  async update(id, data, orgId, userId) {
    try {
      const fields = [];
      const params = [];
      let paramIndex = 1;
      
      const allowedFields = ['title', 'description', 'category', 'status', 'content', 'metadata'];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          params.push(
            (field === 'content' || field === 'metadata') && typeof data[field] === 'object'
              ? JSON.stringify(data[field])
              : data[field]
          );
          paramIndex++;
        }
      }
      
      if (fields.length === 0) {
        return this.findById(id, orgId);
      }
      
      fields.push(`updated_by = $${paramIndex}`, `updated_at = CURRENT_TIMESTAMP`);
      params.push(userId, id, orgId);
      
      const query = `
        UPDATE playbooks
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex + 1} AND org_id = $${paramIndex + 2}
        RETURNING *
      `;
      
      const { rows } = await this.db.query(query, params);
      return rows[0] || null;
    } catch (error) {
      this.logger.error('PlaybookRepository: Error updating', { id, data, orgId, error: error.message });
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
          COUNT(*) as total_playbooks,
          COUNT(*) FILTER (WHERE status = 'published') as published_count,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
          COUNT(DISTINCT cv.user_id) as total_viewers,
          COUNT(cv.id) as total_views
        FROM playbooks p
        LEFT JOIN content_views cv ON cv.content_type = 'playbook' AND cv.content_id = p.id
        WHERE p.org_id = $1
      `;
      
      const { rows } = await this.db.query(query, [orgId]);
      return rows[0];
    } catch (error) {
      this.logger.error('PlaybookRepository: Error getting statistics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = PlaybookRepository;
