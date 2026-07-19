const BaseRepository = require('./base/BaseRepository');

/**
 * UGCAggregatorRepository - Manages database interactions for UGC/Creator Content Aggregator (Taggbox/Flowbox benchmark)
 */
class UGCAggregatorRepository extends BaseRepository {
  constructor(db) {
    // Base table is ugc_feeds
    super(db, 'ugc_feeds', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  // ==================== FEEDS ====================

  async findFeeds(orgId, filters = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      let query = `SELECT * FROM ugc_feeds WHERE org_id = $1`;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND status = $${paramIdx++}`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('UGCAggregatorRepository: Error finding feeds', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findFeedById(id, orgId) {
    const { rows } = await this.db.query(`SELECT * FROM ugc_feeds WHERE id = $1 AND org_id = $2`, [id, orgId]);
    return rows[0] || null;
  }

  async createFeed(data, orgId) {
    const query = `
      INSERT INTO ugc_feeds (org_id, name, source_platform, query_type, query_value, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const params = [
      orgId,
      data.name,
      data.source_platform,
      data.query_type,
      data.query_value,
      data.status || 'active'
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateFeed(id, data, orgId) {
    const query = `
      UPDATE ugc_feeds
      SET name = $1, source_platform = $2, query_type = $3, query_value = $4, status = $5, updated_at = now()
      WHERE id = $6 AND org_id = $7 RETURNING *
    `;
    const params = [
      data.name,
      data.source_platform,
      data.query_type,
      data.query_value,
      data.status,
      id,
      orgId
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0] || null;
  }

  async deleteFeed(id, orgId) {
    const { rows } = await this.db.query(`DELETE FROM ugc_feeds WHERE id = $1 AND org_id = $2 RETURNING *`, [id, orgId]);
    return rows[0] || null;
  }

  // ==================== POSTS ====================

  async findPosts(orgId, filters = {}) {
    try {
      const { feedId, moderationStatus, pinnedOnly, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT p.*, f.name as feed_name, f.source_platform
        FROM ugc_posts p
        JOIN ugc_feeds f ON p.feed_id = f.id
        WHERE p.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (feedId) {
        query += ` AND p.feed_id = $${paramIdx++}`;
        params.push(feedId);
      }

      if (moderationStatus) {
        query += ` AND p.moderation_status = $${paramIdx++}`;
        params.push(moderationStatus);
      }

      if (pinnedOnly === 'true' || pinnedOnly === true) {
        query += ` AND p.pinned = true`;
      }

      query += ` ORDER BY p.pinned DESC, p.published_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('UGCAggregatorRepository: Error finding posts', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findPostById(id, orgId) {
    const { rows } = await this.db.query(`SELECT * FROM ugc_posts WHERE id = $1 AND org_id = $2`, [id, orgId]);
    return rows[0] || null;
  }

  async createPost(data, orgId) {
    const query = `
      INSERT INTO ugc_posts (
        feed_id, org_id, creator_name, creator_handle, creator_avatar,
        media_type, media_url, caption, likes_count, comments_count,
        published_at, moderation_status, shoppable_product_id, pinned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *
    `;
    const params = [
      data.feed_id,
      orgId,
      data.creator_name,
      data.creator_handle,
      data.creator_avatar || null,
      data.media_type || 'image',
      data.media_url,
      data.caption || null,
      data.likes_count || 0,
      data.comments_count || 0,
      data.published_at || new Date(),
      data.moderation_status || 'pending',
      data.shoppable_product_id || null,
      data.pinned || false
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updatePostModeration(id, status, orgId) {
    const { rows } = await this.db.query(
      `UPDATE ugc_posts SET moderation_status = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING *`,
      [status, id, orgId]
    );
    return rows[0] || null;
  }

  async linkProductToPost(id, productId, orgId) {
    const { rows } = await this.db.query(
      `UPDATE ugc_posts SET shoppable_product_id = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING *`,
      [productId || null, id, orgId]
    );
    return rows[0] || null;
  }

  async togglePin(id, pinned, orgId) {
    const { rows } = await this.db.query(
      `UPDATE ugc_posts SET pinned = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING *`,
      [pinned, id, orgId]
    );
    return rows[0] || null;
  }

  async deletePost(id, orgId) {
    const { rows } = await this.db.query(`DELETE FROM ugc_posts WHERE id = $1 AND org_id = $2 RETURNING *`, [id, orgId]);
    return rows[0] || null;
  }

  // ==================== WIDGET TELEMETRY ANALYTICS ====================

  async recordWidgetTelemetry(orgId, type) {
    const today = new Date().toISOString().split('T')[0];
    let query = '';
    
    if (type === 'impression') {
      query = `INSERT INTO ugc_widget_stats (org_id, date, impressions) VALUES ($1, $2, 1)
               ON CONFLICT (org_id, date) DO UPDATE SET impressions = ugc_widget_stats.impressions + 1`;
    } else if (type === 'click') {
      query = `INSERT INTO ugc_widget_stats (org_id, date, clicks) VALUES ($1, $2, 1)
               ON CONFLICT (org_id, date) DO UPDATE SET clicks = ugc_widget_stats.clicks + 1`;
    } else if (type === 'shoppable_click') {
      query = `INSERT INTO ugc_widget_stats (org_id, date, shoppable_clicks) VALUES ($1, $2, 1)
               ON CONFLICT (org_id, date) DO UPDATE SET shoppable_clicks = ugc_widget_stats.shoppable_clicks + 1`;
    }

    if (query) {
      await this.db.query(query, [orgId, today]);
    }
  }

  async getAnalytics(orgId, startDate, endDate) {
    try {
      const query = `
        SELECT
          COALESCE(SUM(impressions), 0) as total_impressions,
          COALESCE(SUM(clicks), 0) as total_clicks,
          COALESCE(SUM(shoppable_clicks), 0) as total_shoppable_clicks
        FROM ugc_widget_stats
        WHERE org_id = $1 AND date >= $2 AND date <= $3
      `;
      const { rows } = await this.db.query(query, [orgId, startDate || '1970-01-01', endDate || '9999-12-31']);
      return rows[0];
    } catch (error) {
      this.logger.error('UGCAggregatorRepository: Error getting analytics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = UGCAggregatorRepository;
