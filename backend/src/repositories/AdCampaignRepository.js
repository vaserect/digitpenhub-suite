const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * Repository for managing all database interactions for the Ad Campaign Manager
 */
class AdCampaignRepository extends BaseRepository {
  constructor() {
    super(db, 'ad_campaigns', {
      primaryKey: 'id',
      timestamps: true,
    });
  }

  // ==========================================================================
  // Ad Accounts
  // ==========================================================================

  async findAccounts(orgId, status = null) {
    let query = 'SELECT * FROM ad_accounts WHERE org_id = $1';
    const params = [orgId];
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY account_name ASC';
    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findAccountById(id, orgId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ad_accounts WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createAccount(data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('org_id');
    values.push(orgId);
    
    const placeholders = values.map((_, i) => `$${i + 1}`);
    const query = `
      INSERT INTO ad_accounts (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async updateAccount(id, data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    columns.push('updated_at');
    values.push(new Date());

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    values.push(id, orgId);

    const query = `
      UPDATE ad_accounts
      SET ${setClause}
      WHERE id = $${values.length - 1} AND org_id = $${values.length}
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async deleteAccount(id, orgId) {
    const { rowCount } = await this.db.query(
      'DELETE FROM ad_accounts WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rowCount > 0;
  }

  // ==========================================================================
  // Ad Groups
  // ==========================================================================

  async findAdGroups(orgId, campaignId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ad_groups WHERE org_id = $1 AND campaign_id = $2 ORDER BY created_at DESC',
      [orgId, campaignId]
    );
    return rows;
  }

  async findAdGroupById(id, orgId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ad_groups WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createAdGroup(data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('org_id');
    values.push(orgId);

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const query = `
      INSERT INTO ad_groups (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async updateAdGroup(id, data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('updated_at');
    values.push(new Date());

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    values.push(id, orgId);

    const query = `
      UPDATE ad_groups
      SET ${setClause}
      WHERE id = $${values.length - 1} AND org_id = $${values.length}
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async deleteAdGroup(id, orgId) {
    const { rowCount } = await this.db.query(
      'DELETE FROM ad_groups WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rowCount > 0;
  }

  // ==========================================================================
  // Ads (Creative variations & details)
  // ==========================================================================

  async findAds(orgId, adGroupId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ads WHERE org_id = $1 AND ad_group_id = $2 ORDER BY created_at DESC',
      [orgId, adGroupId]
    );
    return rows;
  }

  async findAdById(id, orgId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ads WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createAd(data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('org_id');
    values.push(orgId);

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const query = `
      INSERT INTO ads (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async updateAd(id, data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('updated_at');
    values.push(new Date());

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    values.push(id, orgId);

    const query = `
      UPDATE ads
      SET ${setClause}
      WHERE id = $${values.length - 1} AND org_id = $${values.length}
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async deleteAd(id, orgId) {
    const { rowCount } = await this.db.query(
      'DELETE FROM ads WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rowCount > 0;
  }

  // ==========================================================================
  // Custom Audiences
  // ==========================================================================

  async findCustomAudiences(orgId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ad_custom_audiences WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return rows;
  }

  async createCustomAudience(data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('org_id');
    values.push(orgId);

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const query = `
      INSERT INTO ad_custom_audiences (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async deleteCustomAudience(id, orgId) {
    const { rowCount } = await this.db.query(
      'DELETE FROM ad_custom_audiences WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rowCount > 0;
  }

  // ==========================================================================
  // Optimization Rules
  // ==========================================================================

  async findRules(orgId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ad_optimization_rules WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return rows;
  }

  async createRule(data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('org_id');
    values.push(orgId);

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const query = `
      INSERT INTO ad_optimization_rules (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async updateRule(id, data, orgId) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    columns.push('updated_at');
    values.push(new Date());

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    values.push(id, orgId);

    const query = `
      UPDATE ad_optimization_rules
      SET ${setClause}
      WHERE id = $${values.length - 1} AND org_id = $${values.length}
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async deleteRule(id, orgId) {
    const { rowCount } = await this.db.query(
      'DELETE FROM ad_optimization_rules WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return rowCount > 0;
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getPerformanceDaily(orgId, startDate, endDate, campaignId = null) {
    let query = `
      SELECT 
        date,
        SUM(impressions)::int AS impressions,
        SUM(clicks)::int AS clicks,
        SUM(spend)::numeric AS spend,
        SUM(conversions)::int AS conversions,
        SUM(revenue)::numeric AS revenue
      FROM ad_analytics_daily
      WHERE org_id = $1 AND date >= $2 AND date <= $3
    `;
    const params = [orgId, startDate, endDate];
    if (campaignId) {
      query += ' AND campaign_id = $4';
      params.push(campaignId);
    }
    query += ' GROUP BY date ORDER BY date ASC';
    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async getSummary(orgId, startDate, endDate, campaignId = null) {
    let query = `
      SELECT 
        COALESCE(SUM(impressions), 0)::int AS impressions,
        COALESCE(SUM(clicks), 0)::int AS clicks,
        COALESCE(SUM(spend), 0)::numeric AS spend,
        COALESCE(SUM(conversions), 0)::int AS conversions,
        COALESCE(SUM(revenue), 0)::numeric AS revenue
      FROM ad_analytics_daily
      WHERE org_id = $1 AND date >= $2 AND date <= $3
    `;
    const params = [orgId, startDate, endDate];
    if (campaignId) {
      query += ' AND campaign_id = $4';
      params.push(campaignId);
    }
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async seedPerformance(analyticsData) {
    const columns = Object.keys(analyticsData[0]);
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    analyticsData.forEach(row => {
      const rowPlaceholders = [];
      columns.forEach(col => {
        values.push(row[col]);
        rowPlaceholders.push(`$${paramIndex++}`);
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO ad_analytics_daily (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    const { rows } = await this.db.query(query, values);
    return rows;
  }
}

module.exports = AdCampaignRepository;
