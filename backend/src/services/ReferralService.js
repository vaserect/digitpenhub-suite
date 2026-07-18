const db = require('../db');
const crypto = require('crypto');

/**
 * ReferralService - Enterprise-grade referral program management
 * 
 * Features:
 * - Multi-tier reward programs
 * - Tracking link generation
 * - Click and conversion tracking
 * - Automated reward processing
 * - Fraud detection
 * - Performance analytics
 * - Referrer profile management
 */
class ReferralService {
  
  // ============================================================================
  // REFERRAL PROGRAMS
  // ============================================================================
  
  /**
   * Create a new referral program
   */
  async createProgram(orgId, data) {
    const {
      name,
      description,
      rewardType = 'cash',
      rewardValue = 0,
      referrerRewardType,
      referrerRewardValue,
      refereeRewardType,
      refereeRewardValue,
      status = 'active',
      isActive = true,
      startDate,
      endDate,
      maxReferralsPerUser,
      minPurchaseAmountNgn = 0,
      rewardDelayDays = 0,
      autoApproveConversions = false,
      trackingCookieDays = 30,
      termsUrl,
      shareMessage,
      totalBudgetNgn
    } = data;

    const { rows } = await db.query(
      `INSERT INTO referral_programs (
        org_id, name, description, reward_type, reward_value,
        referrer_reward_type, referrer_reward_value,
        referee_reward_type, referee_reward_value,
        status, is_active, start_date, end_date,
        max_referrals_per_user, min_purchase_amount_ngn,
        reward_delay_days, auto_approve_conversions,
        tracking_cookie_days, terms_url, share_message, total_budget_ngn
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [
        orgId, name, description, rewardType, rewardValue,
        referrerRewardType || rewardType, referrerRewardValue || rewardValue,
        refereeRewardType, refereeRewardValue,
        status, isActive, startDate, endDate,
        maxReferralsPerUser, minPurchaseAmountNgn,
        rewardDelayDays, autoApproveConversions,
        trackingCookieDays, termsUrl, shareMessage, totalBudgetNgn
      ]
    );

    return rows[0];
  }

  /**
   * Get program with performance stats
   */
  async getProgram(orgId, programId) {
    const { rows } = await db.query(
      `SELECT * FROM referral_program_performance 
       WHERE org_id = $1 AND id = $2`,
      [orgId, programId]
    );

    return rows[0] || null;
  }

  /**
   * List all programs with filters
   */
  async listPrograms(orgId, filters = {}) {
    const { status, isActive } = filters;
    
    let query = `SELECT * FROM referral_program_performance WHERE org_id = $1`;
    const params = [orgId];
    let paramCount = 1;

    if (status) {
      params.push(status);
      query += ` AND status = $${++paramCount}`;
    }

    if (isActive !== undefined) {
      params.push(isActive);
      query += ` AND is_active = $${++paramCount}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Update program
   */
  async updateProgram(orgId, programId, data) {
    const updates = [];
    const values = [];
    let paramCount = 0;

    const fields = [
      'name', 'description', 'reward_type', 'reward_value',
      'referrer_reward_type', 'referrer_reward_value',
      'referee_reward_type', 'referee_reward_value',
      'status', 'is_active', 'start_date', 'end_date',
      'max_referrals_per_user', 'min_purchase_amount_ngn',
      'reward_delay_days', 'auto_approve_conversions',
      'tracking_cookie_days', 'terms_url', 'share_message', 'total_budget_ngn'
    ];

    fields.forEach(field => {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        updates.push(`${field} = $${++paramCount}`);
        values.push(data[camelField]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(programId, orgId);
    const { rows } = await db.query(
      `UPDATE referral_programs SET ${updates.join(', ')} 
       WHERE id = $${++paramCount} AND org_id = $${++paramCount}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  /**
   * Delete program
   */
  async deleteProgram(orgId, programId) {
    await db.query(
      `DELETE FROM referral_programs WHERE id = $1 AND org_id = $2`,
      [programId, orgId]
    );
  }

  // ============================================================================
  // TRACKING LINKS
  // ============================================================================

  /**
   * Generate unique tracking link for referrer
   */
  async generateTrackingLink(orgId, programId, referrerEmail, referrerName, destinationUrl) {
    // Generate unique link code
    const linkCode = this._generateLinkCode();

    const { rows } = await db.query(
      `INSERT INTO referral_tracking_links (
        org_id, program_id, referrer_email, referrer_name, link_code, destination_url
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [orgId, programId, referrerEmail, referrerName, linkCode, destinationUrl]
    );

    return rows[0];
  }

  /**
   * Get tracking link by code
   */
  async getTrackingLinkByCode(linkCode) {
    const { rows } = await db.query(
      `SELECT * FROM referral_tracking_links WHERE link_code = $1 AND is_active = true`,
      [linkCode]
    );

    return rows[0] || null;
  }

  /**
   * List tracking links for referrer
   */
  async listTrackingLinks(orgId, referrerEmail, programId = null) {
    let query = `
      SELECT * FROM referral_tracking_links 
      WHERE org_id = $1 AND referrer_email = $2
    `;
    const params = [orgId, referrerEmail];

    if (programId) {
      params.push(programId);
      query += ` AND program_id = $3`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Update tracking link
   */
  async updateTrackingLink(orgId, linkId, data) {
    const { destinationUrl, isActive } = data;
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (destinationUrl !== undefined) {
      updates.push(`destination_url = $${++paramCount}`);
      values.push(destinationUrl);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${++paramCount}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(linkId, orgId);
    const { rows } = await db.query(
      `UPDATE referral_tracking_links SET ${updates.join(', ')}
       WHERE id = $${++paramCount} AND org_id = $${++paramCount}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  // ============================================================================
  // CLICK TRACKING
  // ============================================================================

  /**
   * Track click on referral link
   */
  async trackClick(linkCode, metadata = {}) {
    const link = await this.getTrackingLinkByCode(linkCode);
    if (!link) {
      throw new Error('Invalid tracking link');
    }

    const {
      ipAddress,
      userAgent,
      referrerUrl,
      countryCode,
      city,
      deviceType = 'unknown',
      browser,
      os
    } = metadata;

    const { rows } = await db.query(
      `INSERT INTO referral_clicks (
        org_id, link_id, program_id, ip_address, user_agent,
        referrer_url, country_code, city, device_type, browser, os
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        link.org_id, link.id, link.program_id, ipAddress, userAgent,
        referrerUrl, countryCode, city, deviceType, browser, os
      ]
    );

    return {
      click: rows[0],
      destinationUrl: link.destination_url
    };
  }

  /**
   * Get click analytics
   */
  async getClickAnalytics(orgId, filters = {}) {
    const { programId, linkId, startDate, endDate } = filters;
    
    let query = `
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_clicks,
        COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_clicks,
        COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_clicks,
        COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_clicks
      FROM referral_clicks
      WHERE org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (programId) {
      params.push(programId);
      query += ` AND program_id = $${++paramCount}`;
    }

    if (linkId) {
      params.push(linkId);
      query += ` AND link_id = $${++paramCount}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND clicked_at >= $${++paramCount}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND clicked_at <= $${++paramCount}`;
    }

    query += ` GROUP BY DATE(clicked_at) ORDER BY date DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  // ============================================================================
  // REFERRALS
  // ============================================================================

  /**
   * Create referral (manual or automated)
   */
  async createReferral(orgId, data) {
    const {
      programId,
      referrerName,
      referrerEmail,
      referralCode,
      refereeName,
      refereeEmail,
      refereePhone,
      trackingLinkId,
      clickId,
      orderId,
      customerId,
      source = 'manual',
      notes,
      metadata
    } = data;

    const { rows } = await db.query(
      `INSERT INTO referrals (
        org_id, program_id, referrer_name, referrer_email, referral_code,
        referee_name, referee_email, referee_phone,
        tracking_link_id, click_id, order_id, customer_id,
        source, notes, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        orgId, programId, referrerName, referrerEmail, referralCode,
        refereeName, refereeEmail, refereePhone,
        trackingLinkId, clickId, orderId, customerId,
        source, notes, metadata ? JSON.stringify(metadata) : null
      ]
    );

    return rows[0];
  }

  /**
   * Track conversion for referral
   */
  async trackConversion(orgId, referralId, conversionData) {
    const {
      conversionAmountNgn,
      orderId,
      customerId,
      autoApprove = false
    } = conversionData;

    // Get referral and program details
    const { rows: referralRows } = await db.query(
      `SELECT r.*, rp.auto_approve_conversions, rp.min_purchase_amount_ngn,
              rp.referrer_reward_type, rp.referrer_reward_value,
              rp.referee_reward_type, rp.referee_reward_value
       FROM referrals r
       LEFT JOIN referral_programs rp ON rp.id = r.program_id
       WHERE r.id = $1 AND r.org_id = $2`,
      [referralId, orgId]
    );

    if (referralRows.length === 0) {
      throw new Error('Referral not found');
    }

    const referral = referralRows[0];
    const program = referralRows[0];

    // Check minimum purchase amount
    if (program.min_purchase_amount_ngn && conversionAmountNgn < program.min_purchase_amount_ngn) {
      throw new Error(`Conversion amount must be at least ₦${program.min_purchase_amount_ngn / 100}`);
    }

    // Calculate rewards
    const referrerRewardAmountNgn = this._calculateRewardAmount(
      program.referrer_reward_type,
      program.referrer_reward_value,
      conversionAmountNgn
    );

    const refereeRewardAmountNgn = program.referee_reward_type ? this._calculateRewardAmount(
      program.referee_reward_type,
      program.referee_reward_value,
      conversionAmountNgn
    ) : 0;

    // Update referral
    const newStatus = (autoApprove || program.auto_approve_conversions) ? 'converted' : 'contacted';
    
    const { rows } = await db.query(
      `UPDATE referrals SET
        status = $1,
        conversion_date = now(),
        conversion_amount_ngn = $2,
        referrer_reward_amount_ngn = $3,
        referee_reward_amount_ngn = $4,
        order_id = $5,
        customer_id = $6
       WHERE id = $7 AND org_id = $8
       RETURNING *`,
      [
        newStatus, conversionAmountNgn, referrerRewardAmountNgn,
        refereeRewardAmountNgn, orderId, customerId, referralId, orgId
      ]
    );

    // Create reward records if auto-approved
    if (newStatus === 'converted') {
      await this._createRewardRecords(orgId, rows[0]);
    }

    return rows[0];
  }

  /**
   * Approve referral conversion
   */
  async approveConversion(orgId, referralId, userId) {
    const { rows } = await db.query(
      `UPDATE referrals SET
        status = 'converted',
        approved_at = now(),
        approved_by = $1
       WHERE id = $2 AND org_id = $3 AND status != 'converted'
       RETURNING *`,
      [userId, referralId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Referral not found or already approved');
    }

    // Create reward records
    await this._createRewardRecords(orgId, rows[0]);

    return rows[0];
  }

  /**
   * Reject referral
   */
  async rejectReferral(orgId, referralId, userId, reason) {
    const { rows } = await db.query(
      `UPDATE referrals SET
        status = 'rejected',
        rejected_at = now(),
        rejected_by = $1,
        rejection_reason = $2
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [userId, reason, referralId, orgId]
    );

    return rows[0] || null;
  }

  /**
   * List referrals with filters
   */
  async listReferrals(orgId, filters = {}) {
    const { programId, status, referrerEmail, startDate, endDate, limit = 100, offset = 0 } = filters;
    
    let query = `
      SELECT r.*, rp.name as program_name
      FROM referrals r
      LEFT JOIN referral_programs rp ON rp.id = r.program_id
      WHERE r.org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (programId) {
      params.push(programId);
      query += ` AND r.program_id = $${++paramCount}`;
    }

    if (status) {
      params.push(status);
      query += ` AND r.status = $${++paramCount}`;
    }

    if (referrerEmail) {
      params.push(referrerEmail);
      query += ` AND r.referrer_email = $${++paramCount}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND r.created_at >= $${++paramCount}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND r.created_at <= $${++paramCount}`;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  // ============================================================================
  // REWARDS
  // ============================================================================

  /**
   * List rewards with filters
   */
  async listRewards(orgId, filters = {}) {
    const { programId, recipientEmail, status, recipientType } = filters;
    
    let query = `SELECT * FROM referral_rewards WHERE org_id = $1`;
    const params = [orgId];
    let paramCount = 1;

    if (programId) {
      params.push(programId);
      query += ` AND program_id = $${++paramCount}`;
    }

    if (recipientEmail) {
      params.push(recipientEmail);
      query += ` AND recipient_email = $${++paramCount}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${++paramCount}`;
    }

    if (recipientType) {
      params.push(recipientType);
      query += ` AND recipient_type = $${++paramCount}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Approve reward for payment
   */
  async approveReward(orgId, rewardId, userId) {
    const { rows } = await db.query(
      `UPDATE referral_rewards SET
        status = 'approved',
        approved_at = now(),
        approved_by = $1
       WHERE id = $2 AND org_id = $3 AND status = 'pending'
       RETURNING *`,
      [userId, rewardId, orgId]
    );

    return rows[0] || null;
  }

  /**
   * Mark reward as paid
   */
  async markRewardPaid(orgId, rewardId, paymentMethod, paymentReference) {
    const { rows } = await db.query(
      `UPDATE referral_rewards SET
        status = 'paid',
        payment_method = $1,
        payment_reference = $2,
        paid_at = now()
       WHERE id = $3 AND org_id = $4 AND status = 'approved'
       RETURNING *`,
      [paymentMethod, paymentReference, rewardId, orgId]
    );

    return rows[0] || null;
  }

  /**
   * Process batch rewards payment
   */
  async processBatchRewards(orgId, rewardIds, paymentMethod, paymentReference) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE referral_rewards SET
          status = 'paid',
          payment_method = $1,
          payment_reference = $2,
          paid_at = now()
         WHERE id = ANY($3) AND org_id = $4 AND status = 'approved'
         RETURNING *`,
        [paymentMethod, paymentReference, rewardIds, orgId]
      );

      await client.query('COMMIT');
      return rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // REFERRER PROFILES
  // ============================================================================

  /**
   * Get referrer profile
   */
  async getReferrerProfile(orgId, email) {
    const { rows } = await db.query(
      `SELECT rp.*, rt.tier_name as current_tier_name
       FROM referrer_profiles rp
       LEFT JOIN referral_tiers rt ON rt.id = rp.current_tier_id
       WHERE rp.org_id = $1 AND rp.email = $2`,
      [orgId, email]
    );

    return rows[0] || null;
  }

  /**
   * Get or create referrer profile
   */
  async getOrCreateReferrerProfile(orgId, email, name = null) {
    let profile = await this.getReferrerProfile(orgId, email);
    
    if (!profile) {
      const referralCode = this._generateReferralCode(email);
      
      const { rows } = await db.query(
        `INSERT INTO referrer_profiles (org_id, email, name, referral_code)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [orgId, email, name, referralCode]
      );
      
      profile = rows[0];
    }

    return profile;
  }

  /**
   * List top referrers
   */
  async getTopReferrers(orgId, limit = 10, metric = 'conversions') {
    const orderBy = metric === 'revenue' ? 'total_revenue_ngn' : 'total_conversions';
    
    const { rows } = await db.query(
      `SELECT * FROM top_referrers 
       WHERE org_id = $1 
       ORDER BY ${orderBy} DESC 
       LIMIT $2`,
      [orgId, limit]
    );

    return rows;
  }

  /**
   * Update referrer profile
   */
  async updateReferrerProfile(orgId, email, data) {
    const { name, phone, status, paymentMethod, paymentDetails, notes } = data;
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(name);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${++paramCount}`);
      values.push(phone);
    }

    if (status !== undefined) {
      updates.push(`status = $${++paramCount}`);
      values.push(status);
    }

    if (paymentMethod !== undefined) {
      updates.push(`payment_method = $${++paramCount}`);
      values.push(paymentMethod);
    }

    if (paymentDetails !== undefined) {
      updates.push(`payment_details = $${++paramCount}`);
      values.push(JSON.stringify(paymentDetails));
    }

    if (notes !== undefined) {
      updates.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(email, orgId);
    const { rows } = await db.query(
      `UPDATE referrer_profiles SET ${updates.join(', ')}
       WHERE email = $${++paramCount} AND org_id = $${++paramCount}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================

  /**
   * Run fraud detection checks
   */
  async detectFraud(orgId, referralId = null) {
    const alerts = [];

    // Check for self-referrals
    const selfReferrals = await this._detectSelfReferrals(orgId, referralId);
    alerts.push(...selfReferrals);

    // Check for suspicious click patterns
    const suspiciousClicks = await this._detectSuspiciousClicks(orgId, referralId);
    alerts.push(...suspiciousClicks);

    // Check for duplicate conversions
    const duplicateConversions = await this._detectDuplicateConversions(orgId, referralId);
    alerts.push(...duplicateConversions);

    // Check for high velocity referrals
    const highVelocity = await this._detectHighVelocity(orgId, referralId);
    alerts.push(...highVelocity);

    // Save alerts to database
    for (const alert of alerts) {
      await db.query(
        `INSERT INTO referral_fraud_alerts (
          org_id, referral_id, referrer_email, alert_type, severity, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orgId, alert.referralId, alert.referrerEmail, alert.alertType,
          alert.severity, alert.description, JSON.stringify(alert.metadata || {})
        ]
      );
    }

    return alerts;
  }

  /**
   * Get fraud alerts
   */
  async getFraudAlerts(orgId, filters = {}) {
    const { isResolved, severity, referrerEmail } = filters;
    
    let query = `SELECT * FROM referral_fraud_alerts WHERE org_id = $1`;
    const params = [orgId];
    let paramCount = 1;

    if (isResolved !== undefined) {
      params.push(isResolved);
      query += ` AND is_resolved = $${++paramCount}`;
    }

    if (severity) {
      params.push(severity);
      query += ` AND severity = $${++paramCount}`;
    }

    if (referrerEmail) {
      params.push(referrerEmail);
      query += ` AND referrer_email = $${++paramCount}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Resolve fraud alert
   */
  async resolveAlert(orgId, alertId, userId, resolutionNotes) {
    const { rows } = await db.query(
      `UPDATE referral_fraud_alerts SET
        is_resolved = true,
        resolved_by = $1,
        resolved_at = now(),
        resolution_notes = $2
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [userId, resolutionNotes, alertId, orgId]
    );

    return rows[0] || null;
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get referral analytics
   */
  async getAnalytics(orgId, filters = {}) {
    const { programId, startDate, endDate } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE status = 'converted') as total_conversions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_referrals,
        COALESCE(SUM(conversion_amount_ngn) FILTER (WHERE status = 'converted'), 0) as total_revenue_ngn,
        COALESCE(SUM(referrer_reward_amount_ngn) FILTER (WHERE status = 'converted'), 0) as total_rewards_ngn,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*)) * 100, 2)
          ELSE 0 
        END as conversion_rate,
        COUNT(DISTINCT referrer_email) as unique_referrers
      FROM referrals
      WHERE org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (programId) {
      params.push(programId);
      query += ` AND program_id = $${++paramCount}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${++paramCount}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${++paramCount}`;
    }

    const { rows } = await db.query(query, params);
    return rows[0];
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(orgId, programId = null, days = 30) {
    const { rows } = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as referrals,
        COUNT(*) FILTER (WHERE status = 'converted') as conversions,
        COALESCE(SUM(conversion_amount_ngn) FILTER (WHERE status = 'converted'), 0) as revenue_ngn
       FROM referrals
       WHERE org_id = $1 
         AND ($2::uuid IS NULL OR program_id = $2)
         AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [orgId, programId]
    );

    return rows;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate unique link code
   */
  _generateLinkCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Generate referral code from email
   */
  _generateReferralCode(email) {
    const prefix = email.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${suffix}`;
  }

  /**
   * Calculate reward amount based on type
   */
  _calculateRewardAmount(rewardType, rewardValue, conversionAmountNgn) {
    if (rewardType === 'percentage' || rewardType === 'discount') {
      return Math.round((conversionAmountNgn * rewardValue) / 100);
    }
    // For cash, credit, points - return value as-is (already in kobo/smallest unit)
    return Math.round(rewardValue * 100);
  }

  /**
   * Create reward records for approved referral
   */
  async _createRewardRecords(orgId, referral) {
    const rewards = [];

    // Referrer reward
    if (referral.referrer_reward_amount_ngn > 0) {
      const { rows: referrerRows } = await db.query(
        `INSERT INTO referral_rewards (
          org_id, referral_id, program_id, recipient_type, recipient_email, recipient_name,
          reward_type, reward_value, reward_amount_ngn, status
        ) VALUES ($1, $2, $3, 'referrer', $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          orgId, referral.id, referral.program_id, referral.referrer_email, referral.referrer_name,
          'cash', referral.referrer_reward_amount_ngn / 100, referral.referrer_reward_amount_ngn
        ]
      );
      rewards.push(referrerRows[0]);
    }

    // Referee reward
    if (referral.referee_reward_amount_ngn > 0) {
      const { rows: refereeRows } = await db.query(
        `INSERT INTO referral_rewards (
          org_id, referral_id, program_id, recipient_type, recipient_email, recipient_name,
          reward_type, reward_value, reward_amount_ngn, status
        ) VALUES ($1, $2, $3, 'referee', $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          orgId, referral.id, referral.program_id, referral.referee_email, referral.referee_name,
          'cash', referral.referee_reward_amount_ngn / 100, referral.referee_reward_amount_ngn
        ]
      );
      rewards.push(refereeRows[0]);
    }

    return rewards;
  }

  /**
   * Detect self-referrals (same email for referrer and referee)
   */
  async _detectSelfReferrals(orgId, referralId = null) {
    let query = `
      SELECT id, referrer_email, referee_email
      FROM referrals
      WHERE org_id = $1 
        AND LOWER(referrer_email) = LOWER(referee_email)
        AND referrer_email IS NOT NULL
        AND referee_email IS NOT NULL
    `;
    const params = [orgId];

    if (referralId) {
      params.push(referralId);
      query += ` AND id = $2`;
    }

    const { rows } = await db.query(query, params);

    return rows.map(r => ({
      referralId: r.id,
      referrerEmail: r.referrer_email,
      alertType: 'self_referral',
      severity: 'high',
      description: 'Referrer and referee have the same email address',
      metadata: { referrerEmail: r.referrer_email, refereeEmail: r.referee_email }
    }));
  }

  /**
   * Detect suspicious click patterns
   */
  async _detectSuspiciousClicks(orgId, referralId = null) {
    // Check for multiple clicks from same IP in short time
    const { rows } = await db.query(
      `SELECT link_id, ip_address, COUNT(*) as click_count
       FROM referral_clicks
       WHERE org_id = $1 
         AND clicked_at >= NOW() - INTERVAL '1 hour'
       GROUP BY link_id, ip_address
       HAVING COUNT(*) > 10`,
      [orgId]
    );

    return rows.map(r => ({
      referralId: null,
      referrerEmail: null,
      alertType: 'suspicious_clicks',
      severity: 'medium',
      description: `${r.click_count} clicks from same IP in 1 hour`,
      metadata: { linkId: r.link_id, ipAddress: r.ip_address, clickCount: r.click_count }
    }));
  }

  /**
   * Detect duplicate conversions
   */
  async _detectDuplicateConversions(orgId, referralId = null) {
    const { rows } = await db.query(
      `SELECT referee_email, COUNT(*) as conversion_count
       FROM referrals
       WHERE org_id = $1 
         AND status = 'converted'
         AND referee_email IS NOT NULL
       GROUP BY referee_email
       HAVING COUNT(*) > 1`,
      [orgId]
    );

    return rows.map(r => ({
      referralId: null,
      referrerEmail: null,
      alertType: 'duplicate_conversion',
      severity: 'high',
      description: `Referee ${r.referee_email} has ${r.conversion_count} conversions`,
      metadata: { refereeEmail: r.referee_email, conversionCount: r.conversion_count }
    }));
  }

  /**
   * Detect high velocity referrals
   */
  async _detectHighVelocity(orgId, referralId = null) {
    const { rows } = await db.query(
      `SELECT referrer_email, COUNT(*) as referral_count
       FROM referrals
       WHERE org_id = $1 
         AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY referrer_email
       HAVING COUNT(*) > 20`,
      [orgId]
    );

    return rows.map(r => ({
      referralId: null,
      referrerEmail: r.referrer_email,
      alertType: 'high_velocity',
      severity: 'medium',
      description: `${r.referral_count} referrals in 24 hours`,
      metadata: { referrerEmail: r.referrer_email, referralCount: r.referral_count }
    }));
  }
}

module.exports = new ReferralService();
