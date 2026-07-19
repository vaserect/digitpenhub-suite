const BaseRepository = require('./base/BaseRepository');

/**
 * AmbassadorRepository - Handles all database operations for the Ambassador Program
 * Extends BaseRepository for profile CRUD, and contains custom query logic for missions, submissions, payouts, and conversions.
 */
class AmbassadorRepository extends BaseRepository {
  constructor(db) {
    super(db, 'amb_profiles', {
      primaryKey: 'id',
      timestamps: true
    });
  }

  // ==================== PROFILES ====================

  /**
   * Find all ambassador profiles with search, filter, and pagination
   */
  async findAllProfiles(orgId, filters = {}) {
    try {
      const { status, tier, search, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT ap.*, u.full_name as user_name, u.email as user_email, c.full_name as contact_name
        FROM amb_profiles ap
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN contacts c ON ap.contact_id = c.id
        WHERE ap.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND ap.status = $${paramIdx++}`;
        params.push(status);
      }

      if (tier) {
        query += ` AND ap.tier = $${paramIdx++}`;
        params.push(tier);
      }

      if (search) {
        query += ` AND (u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR ap.referral_code ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      query += ` ORDER BY ap.total_referrals DESC, ap.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding all profiles', { orgId, filters, error: error.message });
      throw error;
    }
  }

  /**
   * Find ambassador profile by user_id
   */
  async findByUserId(userId, orgId) {
    try {
      const { rows } = await this.db.query(
        `SELECT ap.*, u.full_name as user_name, u.email as user_email
         FROM amb_profiles ap
         JOIN users u ON ap.user_id = u.id
         WHERE ap.user_id = $1 AND ap.org_id = $2`,
        [userId, orgId]
      );
      return rows[0] || null;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding profile by userId', { userId, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Find ambassador profile by referral_code
   */
  async findByReferralCode(referralCode) {
    try {
      const { rows } = await this.db.query(
        `SELECT ap.*, u.full_name as user_name, u.email as user_email
         FROM amb_profiles ap
         JOIN users u ON ap.user_id = u.id
         WHERE ap.referral_code = $1 AND ap.status = 'active'`,
        [referralCode]
      );
      return rows[0] || null;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding profile by referralCode', { referralCode, error: error.message });
      throw error;
    }
  }

  // ==================== MISSIONS ====================

  /**
   * Find all missions with filtering
   */
  async findMissions(orgId, filters = {}) {
    try {
      const { status, missionType, limit = 50, offset = 0 } = filters;
      let query = `SELECT * FROM amb_missions WHERE org_id = $1`;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND status = $${paramIdx++}`;
        params.push(status);
      }

      if (missionType) {
        query += ` AND mission_type = $${paramIdx++}`;
        params.push(missionType);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding missions', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findMissionById(id, orgId) {
    const { rows } = await this.db.query(`SELECT * FROM amb_missions WHERE id = $1 AND org_id = $2`, [id, orgId]);
    return rows[0] || null;
  }

  async createMission(missionData, orgId) {
    const query = `
      INSERT INTO amb_missions (
        org_id, title, description, mission_type, reward_type, reward_value, points_reward, status, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `;
    const params = [
      orgId,
      missionData.title,
      missionData.description || null,
      missionData.mission_type || 'social_post',
      missionData.reward_type || 'points',
      missionData.reward_value || 0,
      missionData.points_reward || 0,
      missionData.status || 'draft',
      missionData.start_date || null,
      missionData.end_date || null
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateMission(id, missionData, orgId) {
    const query = `
      UPDATE amb_missions 
      SET title = $1, description = $2, mission_type = $3, reward_type = $4,
          reward_value = $5, points_reward = $6, status = $7, start_date = $8, end_date = $9, updated_at = now()
      WHERE id = $10 AND org_id = $11 RETURNING *
    `;
    const params = [
      missionData.title,
      missionData.description || null,
      missionData.mission_type,
      missionData.reward_type,
      missionData.reward_value,
      missionData.points_reward,
      missionData.status,
      missionData.start_date || null,
      missionData.end_date || null,
      id,
      orgId
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0] || null;
  }

  async deleteMission(id, orgId) {
    const { rows } = await this.db.query(`DELETE FROM amb_missions WHERE id = $1 AND org_id = $2 RETURNING *`, [id, orgId]);
    return rows[0] || null;
  }

  // ==================== SUBMISSIONS ====================

  /**
   * Find submissions
   */
  async findSubmissions(orgId, filters = {}) {
    try {
      const { status, ambassadorId, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT s.*, ap.referral_code, u.full_name as user_name, u.email as user_email, m.title as mission_title
        FROM amb_submissions s
        JOIN amb_profiles ap ON s.ambassador_id = ap.id
        JOIN users u ON ap.user_id = u.id
        JOIN amb_missions m ON s.mission_id = m.id
        WHERE s.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND s.status = $${paramIdx++}`;
        params.push(status);
      }

      if (ambassadorId) {
        query += ` AND s.ambassador_id = $${paramIdx++}`;
        params.push(ambassadorId);
      }

      query += ` ORDER BY s.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding submissions', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async findSubmissionById(id, orgId) {
    const { rows } = await this.db.query(
      `SELECT s.*, ap.referral_code, u.full_name as user_name, m.title as mission_title, m.reward_type, m.reward_value, m.points_reward
       FROM amb_submissions s
       JOIN amb_profiles ap ON s.ambassador_id = ap.id
       JOIN users u ON ap.user_id = u.id
       JOIN amb_missions m ON s.mission_id = m.id
       WHERE s.id = $1 AND s.org_id = $2`,
      [id, orgId]
    );
    return rows[0] || null;
  }

  async createSubmission(submissionData, orgId) {
    const query = `
      INSERT INTO amb_submissions (
        org_id, ambassador_id, mission_id, submission_url, notes, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *
    `;
    const params = [
      orgId,
      submissionData.ambassador_id,
      submissionData.mission_id,
      submissionData.submission_url || null,
      submissionData.notes || null
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async updateSubmissionStatus(id, status, adminNotes, orgId) {
    const query = `
      UPDATE amb_submissions 
      SET status = $1, admin_notes = $2, rewarded_at = CASE WHEN $1 = 'approved' THEN now() ELSE rewarded_at END, updated_at = now()
      WHERE id = $3 AND org_id = $4 RETURNING *
    `;
    const { rows } = await this.db.query(query, [status, adminNotes || null, id, orgId]);
    return rows[0] || null;
  }

  // ==================== CLICKS & CONVERSIONS ====================

  async trackClick(ambassadorId, ipAddress, userAgent, referer) {
    await this.db.query(
      `INSERT INTO amb_clicks (ambassador_id, ip_address, user_agent, referer) VALUES ($1, $2, $3, $4)`,
      [ambassadorId, ipAddress || null, userAgent || null, referer || null]
    );
    await this.db.query(
      `UPDATE amb_profiles SET referred_visits_count = referred_visits_count + 1 WHERE id = $1`,
      [ambassadorId]
    );
  }

  async createConversion(data, orgId) {
    const query = `
      INSERT INTO amb_conversions (
        org_id, ambassador_id, referral_code, contact_id, amount, commission_status, commission_amount
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
    `;
    const params = [
      orgId,
      data.ambassador_id,
      data.referral_code,
      data.contact_id || null,
      data.amount || 0,
      data.commission_amount || 0
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async findConversions(orgId, filters = {}) {
    try {
      const { status, ambassadorId, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT c.*, ap.referral_code, u.full_name as user_name, co.full_name as contact_name
        FROM amb_conversions c
        JOIN amb_profiles ap ON c.ambassador_id = ap.id
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN contacts co ON c.contact_id = co.id
        WHERE c.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND c.commission_status = $${paramIdx++}`;
        params.push(status);
      }

      if (ambassadorId) {
        query += ` AND c.ambassador_id = $${paramIdx++}`;
        params.push(ambassadorId);
      }

      query += ` ORDER BY c.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding conversions', { orgId, filters, error: error.message });
      throw error;
    }
  }

  // ==================== PAYOUTS ====================

  async createPayout(payoutData, orgId) {
    const query = `
      INSERT INTO amb_payouts (
        org_id, ambassador_id, amount, payout_method, status
      ) VALUES ($1, $2, $3, $4, 'pending') RETURNING *
    `;
    const params = [
      orgId,
      payoutData.ambassador_id,
      payoutData.amount,
      payoutData.payout_method || 'bank_transfer'
    ];
    const { rows } = await this.db.query(query, params);
    return rows[0];
  }

  async findPayouts(orgId, filters = {}) {
    try {
      const { status, ambassadorId, limit = 50, offset = 0 } = filters;
      let query = `
        SELECT p.*, ap.referral_code, u.full_name as user_name
        FROM amb_payouts p
        JOIN amb_profiles ap ON p.ambassador_id = ap.id
        JOIN users u ON ap.user_id = u.id
        WHERE p.org_id = $1
      `;
      const params = [orgId];
      let paramIdx = 2;

      if (status) {
        query += ` AND p.status = $${paramIdx++}`;
        params.push(status);
      }

      if (ambassadorId) {
        query += ` AND p.ambassador_id = $${paramIdx++}`;
        params.push(ambassadorId);
      }

      query += ` ORDER BY p.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error finding payouts', { orgId, filters, error: error.message });
      throw error;
    }
  }

  async updatePayoutStatus(id, status, orgId) {
    const query = `
      UPDATE amb_payouts 
      SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN now() ELSE paid_at END
      WHERE id = $2 AND org_id = $3 RETURNING *
    `;
    const { rows } = await this.db.query(query, [status, id, orgId]);
    return rows[0] || null;
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(orgId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT ap.id) as total_ambassadors,
          COALESCE(SUM(ap.referred_visits_count), 0) as total_clicks,
          (SELECT COUNT(*) FROM amb_conversions WHERE org_id = $1 AND created_at >= $2 AND created_at <= $3) as total_conversions,
          (SELECT COALESCE(SUM(amount), 0) FROM amb_conversions WHERE org_id = $1 AND created_at >= $2 AND created_at <= $3) as total_revenue,
          (SELECT COALESCE(SUM(commission_amount), 0) FROM amb_conversions WHERE org_id = $1 AND commission_status = 'approved' AND created_at >= $2 AND created_at <= $3) as total_commissions,
          (SELECT COALESCE(SUM(amount), 0) FROM amb_payouts WHERE org_id = $1 AND status = 'paid' AND created_at >= $2 AND created_at <= $3) as total_paid_out
        FROM amb_profiles ap
        WHERE ap.org_id = $1 AND ap.status = 'active'
      `;
      const { rows } = await this.db.query(query, [orgId, startDate || '1970-01-01', endDate || '9999-12-31']);
      return rows[0];
    } catch (error) {
      this.logger.error('AmbassadorRepository: Error getting analytics', { orgId, error: error.message });
      throw error;
    }
  }
}

module.exports = AmbassadorRepository;
