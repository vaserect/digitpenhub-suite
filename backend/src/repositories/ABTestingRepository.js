const BaseRepository = require('./base/BaseRepository');

/**
 * ABTestingRepository - Manages database operations for Creative A/B Testing Studio (VWO/Optimizely benchmark)
 */
class ABTestingRepository extends BaseRepository {
  constructor(db) {
    // Base table is ab_experiments
    super(db, 'ab_experiments', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  // ==================== EXPERIMENTS ====================

  async findExperiments(orgId, filters = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      let query = `SELECT * FROM ab_experiments WHERE org_id = $1`;
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
      this.logger.error('ABTestingRepository: Error finding experiments', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findExperimentById(id, orgId) {
    const { rows } = await this.db.query(
      `SELECT * FROM ab_experiments WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createExperiment(data, orgId) {
    const query = `
      INSERT INTO ab_experiments (
        org_id, name, description, status, target_type, target_url, goal_type, traffic_split
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const params = [
      orgId,
      data.name,
      data.description || null,
      data.status || 'draft',
      data.target_type || 'custom',
      data.target_url || null,
      data.goal_type || 'click',
      data.traffic_split !== undefined ? data.traffic_split : 50
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateExperiment(id, data, orgId) {
    const query = `
      UPDATE ab_experiments
      SET name = $1, description = $2, status = $3, target_type = $4,
          target_url = $5, goal_type = $6, traffic_split = $7, champion_variation_id = $8,
          updated_at = now()
      WHERE id = $9 AND org_id = $10 RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.status,
      data.target_type,
      data.target_url || null,
      data.goal_type,
      data.traffic_split,
      data.champion_variation_id || null,
      id,
      orgId
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0] || null;
  }

  // ==================== VARIATIONS ====================

  async findVariations(experimentId) {
    const { rows } = await this.db.query(
      `SELECT * FROM ab_variations WHERE experiment_id = $1 ORDER BY created_at ASC`,
      [experimentId]
    );
    return rows;
  }

  async findVariationById(id, experimentId) {
    const { rows } = await this.db.query(
      `SELECT * FROM ab_variations WHERE id = $1 AND experiment_id = $2`,
      [id, experimentId]
    );
    return rows[0] || null;
  }

  async createVariation(data) {
    const query = `
      INSERT INTO ab_variations (
        experiment_id, name, content_changes, traffic_weight
      ) VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const params = [
      data.experiment_id,
      data.name,
      data.content_changes || '{}',
      data.traffic_weight !== undefined ? data.traffic_weight : 50
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateVariation(id, data) {
    const query = `
      UPDATE ab_variations
      SET name = $1, content_changes = $2, traffic_weight = $3, updated_at = now()
      WHERE id = $4 RETURNING *
    `;
    const params = [
      data.name,
      data.content_changes || '{}',
      data.traffic_weight,
      id
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0] || null;
  }

  async deleteVariation(id) {
    const { rows } = await this.db.query(`DELETE FROM ab_variations WHERE id = $1 RETURNING *`, [id]);
    return rows[0] || null;
  }

  // ==================== LOGGING EVENTS ====================

  async incrementViews(experimentId, variationId) {
    // Increment general views
    await this.db.query(
      `UPDATE ab_variations SET views = views + 1 WHERE id = $1 AND experiment_id = $2`,
      [variationId, experimentId]
    );

    // Aggregate daily stats
    const today = new Date().toISOString().split('T')[0];
    await this.db.query(
      `INSERT INTO ab_events_daily (experiment_id, variation_id, date, views)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (experiment_id, variation_id, date)
       DO UPDATE SET views = ab_events_daily.views + 1`,
      [experimentId, variationId, today]
    );
  }

  async incrementConversions(experimentId, variationId) {
    // Increment general conversions
    await this.db.query(
      `UPDATE ab_variations SET conversions = conversions + 1 WHERE id = $1 AND experiment_id = $2`,
      [variationId, experimentId]
    );

    // Aggregate daily stats
    const today = new Date().toISOString().split('T')[0];
    await this.db.query(
      `INSERT INTO ab_events_daily (experiment_id, variation_id, date, conversions)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (experiment_id, variation_id, date)
       DO UPDATE SET conversions = ab_events_daily.conversions + 1`,
      [experimentId, variationId, today]
    );
  }

  // ==================== STATS TIMELINE ====================

  async getTimeline(experimentId) {
    const { rows } = await this.db.query(
      `SELECT d.*, v.name as variation_name
       FROM ab_events_daily d
       JOIN ab_variations v ON d.variation_id = v.id
       WHERE d.experiment_id = $1
       ORDER BY d.date ASC`,
      [experimentId]
    );
    return rows;
  }
}

module.exports = ABTestingRepository;
