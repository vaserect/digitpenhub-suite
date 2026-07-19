const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');

/**
 * AmbassadorRepository - Data access layer for Ambassador Program
 */
class AmbassadorRepository extends BaseRepository {
  constructor() {
    super(db, 'ambassadors');
  }

  // ============================================================================
  // Program Operations
  // ============================================================================

  async createProgram(data) {
    const query = `
      INSERT INTO ambassador_programs (
        org_id, name, slug, description, status,
        application_enabled, auto_approve, application_questions,
        min_age, min_followers, allowed_countries, required_platforms,
        logo_url, banner_url, primary_color, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      data.org_id, data.name, data.slug, data.description, data.status || 'active',
      data.application_enabled, data.auto_approve, data.application_questions,
      data.min_age, data.min_followers, data.allowed_countries, data.required_platforms,
      data.logo_url, data.banner_url, data.primary_color, data.created_by
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getPrograms(orgId, filters = {}) {
    let query = 'SELECT * FROM ambassador_programs WHERE org_id = $1';
    const values = [orgId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getProgramById(programId) {
    const query = 'SELECT * FROM ambassador_programs WHERE id = $1';
    const result = await this.db.query(query, [programId]);
    return result.rows[0];
  }

  async updateProgram(programId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(programId);

    const query = `
      UPDATE ambassador_programs 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async deleteProgram(programId) {
    const query = 'DELETE FROM ambassador_programs WHERE id = $1';
    await this.db.query(query, [programId]);
    return true;
  }

  // ============================================================================
  // Tier Operations
  // ============================================================================

  async createTier(data) {
    const query = `
      INSERT INTO ambassador_tiers (
        program_id, name, slug, level,
        min_referrals, min_revenue, min_content_pieces,
        commission_rate, bonus_per_referral, exclusive_perks,
        welcome_bonus, monthly_bonus,
        badge_icon, badge_color, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      data.program_id, data.name, data.slug, data.level,
      data.min_referrals || 0, data.min_revenue || 0, data.min_content_pieces || 0,
      data.commission_rate || 0, data.bonus_per_referral || 0, data.exclusive_perks,
      data.welcome_bonus || 0, data.monthly_bonus || 0,
      data.badge_icon, data.badge_color, data.description
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getTiers(programId) {
    const query = 'SELECT * FROM ambassador_tiers WHERE program_id = $1 ORDER BY level ASC';
    const result = await this.db.query(query, [programId]);
    return result.rows;
  }

  async getTierById(tierId) {
    const query = 'SELECT * FROM ambassador_tiers WHERE id = $1';
    const result = await this.db.query(query, [tierId]);
    return result.rows[0];
  }

  async updateTier(tierId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(tierId);

    const query = `
      UPDATE ambassador_tiers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Application Operations
  // ============================================================================

  async createApplication(data) {
    const query = `
      INSERT INTO ambassador_applications (
        org_id, program_id, user_id, answers, social_profiles, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.org_id, data.program_id, data.user_id,
      data.answers, data.social_profiles, data.status
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getApplicationByUser(orgId, programId, userId) {
    const query = `
      SELECT * FROM ambassador_applications 
      WHERE org_id = $1 AND program_id = $2 AND user_id = $3
    `;
    const result = await this.db.query(query, [orgId, programId, userId]);
    return result.rows[0];
  }

  async getApplications(orgId, programId, filters = {}) {
    let query = `
      SELECT a.*, u.full_name, u.email 
      FROM ambassador_applications a
      JOIN users u ON u.id = a.user_id
      WHERE a.org_id = $1 AND a.program_id = $2
    `;
    const values = [orgId, programId];
    let paramCount = 2;

    if (filters.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY a.submitted_at DESC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getApplicationById(applicationId) {
    const query = 'SELECT * FROM ambassador_applications WHERE id = $1';
    const result = await this.db.query(query, [applicationId]);
    return result.rows[0];
  }

  async updateApplication(applicationId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(applicationId);

    const query = `
      UPDATE ambassador_applications 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Ambassador Operations
  // ============================================================================

  async createAmbassador(data) {
    const query = `
      INSERT INTO ambassadors (
        org_id, program_id, user_id, tier_id, status, referral_code,
        instagram_handle, tiktok_handle, youtube_channel, twitter_handle, facebook_profile,
        country, city, timezone, applied_at, approved_at, notes, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      data.org_id, data.program_id, data.user_id, data.tier_id, data.status, data.referral_code,
      data.instagram_handle, data.tiktok_handle, data.youtube_channel, data.twitter_handle, data.facebook_profile,
      data.country, data.city, data.timezone, data.applied_at, data.approved_at, data.notes, data.tags
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getAmbassadors(orgId, filters = {}) {
    let query = `
      SELECT a.*, u.full_name, u.email, t.name as tier_name, t.badge_color, p.name as program_name
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN ambassador_tiers t ON t.id = a.tier_id
      JOIN ambassador_programs p ON p.id = a.program_id
      WHERE a.org_id = $1
    `;
    const values = [orgId];
    let paramCount = 1;

    if (filters.program_id) {
      paramCount++;
      query += ` AND a.program_id = $${paramCount}`;
      values.push(filters.program_id);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.tier_id) {
      paramCount++;
      query += ` AND a.tier_id = $${paramCount}`;
      values.push(filters.tier_id);
    }

    query += ' ORDER BY a.total_referrals DESC, a.joined_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getAmbassadorById(ambassadorId) {
    const query = `
      SELECT a.*, u.full_name, u.email, t.name as tier_name, t.badge_color, p.name as program_name
      FROM ambassadors a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN ambassador_tiers t ON t.id = a.tier_id
      JOIN ambassador_programs p ON p.id = a.program_id
      WHERE a.id = $1
    `;
    const result = await this.db.query(query, [ambassadorId]);
    return result.rows[0];
  }

  async getAmbassadorByUserId(orgId, programId, userId) {
    const query = `
      SELECT * FROM ambassadors 
      WHERE org_id = $1 AND program_id = $2 AND user_id = $3
    `;
    const result = await this.db.query(query, [orgId, programId, userId]);
    return result.rows[0];
  }

  async updateAmbassador(ambassadorId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(ambassadorId);

    const query = `
      UPDATE ambassadors 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async incrementAmbassadorPoints(ambassadorId, points) {
    const query = `
      UPDATE ambassadors 
      SET points_balance = points_balance + $1,
          lifetime_points = lifetime_points + $1
      WHERE id = $2
    `;
    await this.db.query(query, [points, ambassadorId]);
  }

  async incrementAmbassadorRewards(ambassadorId, amount) {
    const query = `
      UPDATE ambassadors 
      SET rewards_earned = rewards_earned + $1,
          pending_payout = pending_payout + $1
      WHERE id = $2
    `;
    await this.db.query(query, [amount, ambassadorId]);
  }

  async incrementAmbassadorContent(ambassadorId) {
    const query = `
      UPDATE ambassadors 
      SET total_content_pieces = total_content_pieces + 1
      WHERE id = $1
    `;
    await this.db.query(query, [ambassadorId]);
  }

  // ============================================================================
  // Activity Operations
  // ============================================================================

  async createActivity(data) {
    const query = `
      INSERT INTO ambassador_activities (
        org_id, ambassador_id, activity_type, activity_data,
        points_earned, reward_amount, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.org_id, data.ambassador_id, data.activity_type, data.activity_data,
      data.points_earned, data.reward_amount, data.ip_address, data.user_agent
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getActivities(orgId, ambassadorId, filters = {}) {
    let query = `
      SELECT * FROM ambassador_activities 
      WHERE org_id = $1 AND ambassador_id = $2
    `;
    const values = [orgId, ambassadorId];
    let paramCount = 2;

    if (filters.activity_type) {
      paramCount++;
      query += ` AND activity_type = $${paramCount}`;
      values.push(filters.activity_type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  // ============================================================================
  // Reward Operations
  // ============================================================================

  async createReward(data) {
    const query = `
      INSERT INTO ambassador_rewards (
        org_id, ambassador_id, reward_type, description,
        points, cash_amount, status, activity_id, campaign_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.org_id, data.ambassador_id, data.reward_type, data.description,
      data.points, data.cash_amount, data.status, data.activity_id, data.campaign_id
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getRewards(orgId, ambassadorId, filters = {}) {
    let query = `
      SELECT * FROM ambassador_rewards 
      WHERE org_id = $1 AND ambassador_id = $2
    `;
    const values = [orgId, ambassadorId];
    let paramCount = 2;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.reward_type) {
      paramCount++;
      query += ` AND reward_type = $${paramCount}`;
      values.push(filters.reward_type);
    }

    query += ' ORDER BY earned_at DESC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getRewardById(rewardId) {
    const query = 'SELECT * FROM ambassador_rewards WHERE id = $1';
    const result = await this.db.query(query, [rewardId]);
    return result.rows[0];
  }

  async updateReward(rewardId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(rewardId);

    const query = `
      UPDATE ambassador_rewards 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Content Operations
  // ============================================================================

  async createContent(data) {
    const query = `
      INSERT INTO ambassador_content (
        org_id, ambassador_id, campaign_id, content_type,
        title, description, media_url, thumbnail_url, external_url,
        status, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.org_id, data.ambassador_id, data.campaign_id, data.content_type,
      data.title, data.description, data.media_url, data.thumbnail_url, data.external_url,
      data.status, data.tags
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getContent(orgId, filters = {}) {
    let query = `
      SELECT c.*, a.referral_code, u.full_name as ambassador_name
      FROM ambassador_content c
      JOIN ambassadors a ON a.id = c.ambassador_id
      JOIN users u ON u.id = a.user_id
      WHERE c.org_id = $1
    `;
    const values = [orgId];
    let paramCount = 1;

    if (filters.ambassador_id) {
      paramCount++;
      query += ` AND c.ambassador_id = $${paramCount}`;
      values.push(filters.ambassador_id);
    }

    if (filters.campaign_id) {
      paramCount++;
      query += ` AND c.campaign_id = $${paramCount}`;
      values.push(filters.campaign_id);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.content_type) {
      paramCount++;
      query += ` AND c.content_type = $${paramCount}`;
      values.push(filters.content_type);
    }

    query += ' ORDER BY c.submitted_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getContentById(contentId) {
    const query = 'SELECT * FROM ambassador_content WHERE id = $1';
    const result = await this.db.query(query, [contentId]);
    return result.rows[0];
  }

  async updateContent(contentId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(contentId);

    const query = `
      UPDATE ambassador_content 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Campaign Operations
  // ============================================================================

  async createCampaign(data) {
    const query = `
      INSERT INTO ambassador_campaigns (
        org_id, program_id, name, slug, description, brief,
        required_content_type, min_content_pieces, hashtags, mentions,
        reward_per_piece, bonus_for_completion, points_per_piece,
        start_date, end_date, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      data.org_id, data.program_id, data.name, data.slug, data.description, data.brief,
      data.required_content_type, data.min_content_pieces, data.hashtags, data.mentions,
      data.reward_per_piece, data.bonus_for_completion, data.points_per_piece,
      data.start_date, data.end_date, data.status, data.created_by
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getCampaigns(orgId, filters = {}) {
    let query = `
      SELECT c.*, p.name as program_name,
        (SELECT COUNT(*) FROM ambassador_campaign_participants WHERE campaign_id = c.id) as participant_count
      FROM ambassador_campaigns c
      JOIN ambassador_programs p ON p.id = c.program_id
      WHERE c.org_id = $1
    `;
    const values = [orgId];
    let paramCount = 1;

    if (filters.program_id) {
      paramCount++;
      query += ` AND c.program_id = $${paramCount}`;
      values.push(filters.program_id);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getCampaignById(campaignId) {
    const query = 'SELECT * FROM ambassador_campaigns WHERE id = $1';
    const result = await this.db.query(query, [campaignId]);
    return result.rows[0];
  }

  async updateCampaign(campaignId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(campaignId);

    const query = `
      UPDATE ambassador_campaigns 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async createCampaignParticipant(data) {
    const query = `
      INSERT INTO ambassador_campaign_participants (
        campaign_id, ambassador_id, status
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [data.campaign_id, data.ambassador_id, data.status];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async updateCampaignParticipant(campaignId, ambassadorId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(campaignId);
    paramCount++;
    values.push(ambassadorId);

    const query = `
      UPDATE ambassador_campaign_participants 
      SET ${fields.join(', ')}
      WHERE campaign_id = $${paramCount - 1} AND ambassador_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Payout Operations
  // ============================================================================

  async createPayout(data) {
    const query = `
      INSERT INTO ambassador_payouts (
        org_id, ambassador_id, amount, currency, payment_method,
        payment_details, status, reward_ids, tax_form_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.org_id, data.ambassador_id, data.amount, data.currency || 'USD',
      data.payment_method, data.payment_details, data.status,
      data.reward_ids, data.tax_form_required || false
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getPayoutById(payoutId) {
    const query = 'SELECT * FROM ambassador_payouts WHERE id = $1';
    const result = await this.db.query(query, [payoutId]);
    return result.rows[0];
  }

  async updatePayout(payoutId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
    });

    paramCount++;
    values.push(payoutId);

    const query = `
      UPDATE ambassador_payouts 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Analytics Operations
  // ============================================================================

  async getProgramAnalytics(orgId, programId, startDate, endDate) {
    const query = `
      SELECT 
        date,
        SUM(new_referrals) as new_referrals,
        SUM(successful_referrals) as successful_referrals,
        SUM(revenue_generated) as revenue_generated,
        SUM(content_submitted) as content_submitted,
        SUM(content_approved) as content_approved,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        AVG(conversion_rate) as avg_conversion_rate,
        SUM(points_earned) as points_earned,
        SUM(rewards_earned) as rewards_earned
      FROM ambassador_analytics_daily
      WHERE org_id = $1 AND program_id = $2 AND date BETWEEN $3 AND $4
      GROUP BY date
      ORDER BY date DESC
    `;

    const result = await this.db.query(query, [orgId, programId, startDate, endDate]);
    return result.rows;
  }

  async getAmbassadorAnalytics(orgId, ambassadorId, startDate, endDate) {
    const query = `
      SELECT * FROM ambassador_analytics_daily
      WHERE org_id = $1 AND ambassador_id = $2 AND date BETWEEN $3 AND $4
      ORDER BY date DESC
    `;

    const result = await this.db.query(query, [orgId, ambassadorId, startDate, endDate]);
    return result.rows;
  }

  async upsertDailyAnalytics(data) {
    const query = `
      INSERT INTO ambassador_analytics_daily (
        org_id, program_id, ambassador_id, date,
        new_referrals, successful_referrals, revenue_generated,
        content_submitted, content_approved, clicks, conversions,
        conversion_rate, points_earned, rewards_earned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (org_id, program_id, ambassador_id, date)
      DO UPDATE SET
        new_referrals = ambassador_analytics_daily.new_referrals + EXCLUDED.new_referrals,
        successful_referrals = ambassador_analytics_daily.successful_referrals + EXCLUDED.successful_referrals,
        revenue_generated = ambassador_analytics_daily.revenue_generated + EXCLUDED.revenue_generated,
        content_submitted = ambassador_analytics_daily.content_submitted + EXCLUDED.content_submitted,
        content_approved = ambassador_analytics_daily.content_approved + EXCLUDED.content_approved,
        clicks = ambassador_analytics_daily.clicks + EXCLUDED.clicks,
        conversions = ambassador_analytics_daily.conversions + EXCLUDED.conversions,
        conversion_rate = EXCLUDED.conversion_rate,
        points_earned = ambassador_analytics_daily.points_earned + EXCLUDED.points_earned,
        rewards_earned = ambassador_analytics_daily.rewards_earned + EXCLUDED.rewards_earned
      RETURNING *
    `;

    const values = [
      data.org_id, data.program_id, data.ambassador_id, data.date,
      data.new_referrals || 0, data.successful_referrals || 0, data.revenue_generated || 0,
      data.content_submitted || 0, data.content_approved || 0, data.clicks || 0, data.conversions || 0,
      data.conversion_rate || 0, data.points_earned || 0, data.rewards_earned || 0
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // Training Operations
  // ============================================================================

  async createTraining(data) {
    const query = `
      INSERT INTO ambassador_training (
        org_id, program_id, title, slug, description, content,
        training_type, media_url, duration_minutes, required, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.org_id, data.program_id, data.title, data.slug, data.description, data.content,
      data.training_type, data.media_url, data.duration_minutes, data.required, data.status
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getTraining(orgId, programId, filters = {}) {
    let query = `
      SELECT * FROM ambassador_training 
      WHERE org_id = $1 AND program_id = $2
    `;
    const values = [orgId, programId];
    let paramCount = 2;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY order_index ASC, created_at DESC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async upsertTrainingProgress(data) {
    const query = `
      INSERT INTO ambassador_training_progress (
        ambassador_id, training_id, status, progress_percentage,
        quiz_score, quiz_passed, started_at, completed_at, last_accessed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (ambassador_id, training_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        quiz_score = EXCLUDED.quiz_score,
        quiz_passed = EXCLUDED.quiz_passed,
        completed_at = EXCLUDED.completed_at,
        last_accessed_at = EXCLUDED.last_accessed_at
      RETURNING *
    `;

    const values = [
      data.ambassador_id, data.training_id, data.status, data.progress_percentage,
      data.quiz_score, data.quiz_passed, data.started_at, data.completed_at, data.last_accessed_at
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

module.exports = AmbassadorRepository;
