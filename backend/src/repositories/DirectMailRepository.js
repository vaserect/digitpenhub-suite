const BaseRepository = require('./base/BaseRepository');

/**
 * DirectMailRepository - Handles database interactions for Direct Mail Automation (Postcard/Letter)
 */
class DirectMailRepository extends BaseRepository {
  constructor(db) {
    // Primary base table is dm_templates
    super(db, 'dm_templates', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  // ==================== TEMPLATES ====================

  async findTemplates(orgId, filters = {}) {
    try {
      const { type, limit = 50, offset = 0 } = filters;
      let query = `SELECT * FROM dm_templates WHERE org_id = $1`;
      const params = [orgId];
      let paramIdx = 2;

      if (type) {
        query += ` AND type = $${paramIdx++}`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('DirectMailRepository: Error finding templates', { orgId, filters, error: error.message });
      throw error;
    }
  }

  // ==================== CAMPAIGNS ====================

  async findCampaigns(orgId, filters = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT c.*, t.name as template_name, t.type as template_type, t.size as template_size
        FROM dm_campaigns c
        LEFT JOIN dm_templates t ON c.template_id = t.id
        WHERE c.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND c.status = $${paramIdx++}`;
        params.push(status);
      }

      query += ` ORDER BY c.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('DirectMailRepository: Error finding campaigns', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findCampaignById(id, orgId) {
    const { rows } = await this.db.query(
      `SELECT c.*, t.name as template_name, t.type as template_type
       FROM dm_campaigns c
       LEFT JOIN dm_templates t ON c.template_id = t.id
       WHERE c.id = $1 AND c.org_id = $2`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createCampaign(data, orgId) {
    const query = `
      INSERT INTO dm_campaigns (
        org_id, name, description, template_id, status, schedule_type, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const params = [
      orgId,
      data.name,
      data.description || null,
      data.template_id || null,
      data.status || 'draft',
      data.schedule_type || 'immediate',
      data.scheduled_at || null
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateCampaign(id, data, orgId) {
    const query = `
      UPDATE dm_campaigns
      SET name = $1, description = $2, template_id = $3, status = $4,
          schedule_type = $5, scheduled_at = $6, updated_at = now()
      WHERE id = $7 AND org_id = $8 RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.template_id || null,
      data.status,
      data.schedule_type,
      data.scheduled_at || null,
      id,
      orgId
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0] || null;
  }

  async deleteCampaign(id, orgId) {
    const { rows } = await this.db.query(`DELETE FROM dm_campaigns WHERE id = $1 AND org_id = $2 RETURNING *`, [id, orgId]);
    return rows[0] || null;
  }

  // ==================== MAIL SENDS ====================

  async findSends(orgId, filters = {}) {
    try {
      const { campaignId, status, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT s.*, c.name as campaign_name, t.name as template_name, co.full_name as contact_name
        FROM dm_sends s
        LEFT JOIN dm_campaigns c ON s.campaign_id = c.id
        LEFT JOIN dm_templates t ON s.template_id = t.id
        LEFT JOIN contacts co ON s.contact_id = co.id
        WHERE s.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (campaignId) {
        query += ` AND s.campaign_id = $${paramIdx++}`;
        params.push(campaignId);
      }

      if (status) {
        query += ` AND s.status = $${paramIdx++}`;
        params.push(status);
      }

      query += ` ORDER BY s.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('DirectMailRepository: Error finding sends', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findSendById(id, orgId) {
    const { rows } = await this.db.query(
      `SELECT s.*, c.name as campaign_name, t.name as template_name
       FROM dm_sends s
       LEFT JOIN dm_campaigns c ON s.campaign_id = c.id
       LEFT JOIN dm_templates t ON s.template_id = t.id
       WHERE s.id = $1 AND s.org_id = $2`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createSend(data, orgId) {
    const query = `
      INSERT INTO dm_sends (
        org_id, campaign_id, contact_id, template_id, to_name,
        to_address_line1, to_address_line2, to_city, to_state, to_postal_code, to_country,
        status, status_details, api_provider, provider_job_id, estimated_delivery_date, cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *
    `;
    const params = [
      orgId,
      data.campaign_id || null,
      data.contact_id || null,
      data.template_id || null,
      data.to_name,
      data.to_address_line1,
      data.to_address_line2 || null,
      data.to_city,
      data.to_state,
      data.to_postal_code,
      data.to_country || 'US',
      data.status || 'created',
      data.status_details || null,
      data.api_provider || 'mock_lob',
      data.provider_job_id || null,
      data.estimated_delivery_date || null,
      data.cost || 0.00
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateSendStatus(id, status, details, orgId) {
    const query = `
      UPDATE dm_sends
      SET status = $1, status_details = $2, 
          actual_delivery_date = CASE WHEN $1 = 'delivered' THEN now() ELSE actual_delivery_date END,
          updated_at = now()
      WHERE id = $3 AND org_id = $4 RETURNING *
    `;
    const { rows } = await this.db.query(query, [status, details || null, id, orgId]);
    return rows[0] || null;
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(orgId, startDate, endDate) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_sends,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered,
          COUNT(CASE WHEN status = 'returned' THEN 1 END) as total_returned,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
          COALESCE(SUM(cost), 0.00) as total_cost
        FROM dm_sends
        WHERE org_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const { rows } = await this.db.query(query, [orgId, startDate || '1970-01-01', endDate || '9999-12-31']);
      return rows[0];
    } catch (error) {
      this.logger.error('DirectMailRepository: Error getting analytics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = DirectMailRepository;
