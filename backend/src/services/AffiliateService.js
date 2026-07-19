const pool = require('../db');
const crypto = require('crypto');

class AffiliateService {
  // ============================================================================
  // AFFILIATE MANAGEMENT
  // ============================================================================

  /**
   * Create a new affiliate
   */
  async createAffiliate(orgId, data) {
    const {
      name,
      email,
      phone,
      promo_code,
      commission_type = 'percentage',
      commission_value = 10,
      status = 'pending',
      payment_method,
      payment_details,
      tax_id,
      cookie_duration_days = 30,
      notes
    } = data;

    const query = `
      INSERT INTO affiliates (
        org_id, name, email, phone, promo_code, commission_type, 
        commission_value, status, payment_method, payment_details, 
        tax_id, cookie_duration_days, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      orgId, name, email, phone, promo_code, commission_type,
      commission_value, status, payment_method, 
      payment_details ? JSON.stringify(payment_details) : null,
      tax_id, cookie_duration_days, notes
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update affiliate details
   */
  async updateAffiliate(orgId, affiliateId, data) {
    const allowedFields = [
      'name', 'email', 'phone', 'promo_code', 'commission_type',
      'commission_value', 'status', 'payment_method', 'payment_details',
      'tax_id', 'cookie_duration_days', 'notes'
    ];

    const updates = [];
    const values = [orgId, affiliateId];
    let paramCount = 2;

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(key === 'payment_details' && data[key] ? JSON.stringify(data[key]) : data[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE affiliates
      SET ${updates.join(', ')}
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    return result.rows[0];
  }

  /**
   * Delete an affiliate
   */
  async deleteAffiliate(orgId, affiliateId) {
    const query = `
      DELETE FROM affiliates
      WHERE org_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    return { success: true, id: result.rows[0].id };
  }

  /**
   * Get single affiliate
   */
  async getAffiliate(orgId, affiliateId) {
    const query = `
      SELECT 
        a.*,
        t.tier_name,
        t.tier_level,
        COUNT(DISTINCT ac.id) as total_clicks,
        COUNT(DISTINCT acv.id) as total_conversions,
        COALESCE(SUM(acv.amount_ngn), 0) as total_revenue_ngn,
        COALESCE(SUM(acv.commission_ngn), 0) as total_commission_ngn
      FROM affiliates a
      LEFT JOIN affiliate_commission_tiers t ON a.current_tier_id = t.id
      LEFT JOIN affiliate_clicks ac ON a.id = ac.affiliate_id
      LEFT JOIN affiliate_conversions acv ON a.id = acv.affiliate_id AND acv.status = 'approved'
      WHERE a.org_id = $1 AND a.id = $2
      GROUP BY a.id, t.tier_name, t.tier_level
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    return result.rows[0];
  }

  /**
   * List affiliates with filters
   */
  async listAffiliates(orgId, filters = {}) {
    const { status, search, limit = 50, offset = 0, sort_by = 'created_at', sort_order = 'DESC' } = filters;

    let whereConditions = ['a.org_id = $1'];
    const values = [orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`a.status = $${paramCount}`);
      values.push(status);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(a.name ILIKE $${paramCount} OR a.email ILIKE $${paramCount} OR a.promo_code ILIKE $${paramCount})`);
      values.push(`%${search}%`);
    }

    const validSortFields = ['created_at', 'name', 'lifetime_conversions', 'lifetime_revenue_ngn', 'lifetime_commission_ngn'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        a.*,
        t.tier_name,
        t.tier_level,
        COUNT(DISTINCT ac.id) as total_clicks,
        COUNT(DISTINCT acv.id) as total_conversions
      FROM affiliates a
      LEFT JOIN affiliate_commission_tiers t ON a.current_tier_id = t.id
      LEFT JOIN affiliate_clicks ac ON a.id = ac.affiliate_id
      LEFT JOIN affiliate_conversions acv ON a.id = acv.affiliate_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY a.id, t.tier_name, t.tier_level
      ORDER BY a.${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM affiliates a
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await pool.query(countQuery, values.slice(0, paramCount));

    return {
      affiliates: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  }

  /**
   * Approve a pending affiliate
   */
  async approveAffiliate(orgId, affiliateId) {
    const query = `
      UPDATE affiliates
      SET status = 'active'
      WHERE org_id = $1 AND id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found or already approved');
    }

    return result.rows[0];
  }

  /**
   * Pause an affiliate
   */
  async pauseAffiliate(orgId, affiliateId) {
    const query = `
      UPDATE affiliates
      SET status = 'paused'
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    return result.rows[0];
  }

  /**
   * Resume a paused affiliate
   */
  async resumeAffiliate(orgId, affiliateId) {
    const query = `
      UPDATE affiliates
      SET status = 'active'
      WHERE org_id = $1 AND id = $2 AND status = 'paused'
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found or not paused');
    }

    return result.rows[0];
  }

  // ============================================================================
  // TRACKING LINKS
  // ============================================================================

  /**
   * Generate a unique tracking link
   */
  async generateTrackingLink(orgId, affiliateId, destinationUrl, campaignName = null) {
    // Generate unique link code
    const linkCode = this._generateLinkCode();

    const query = `
      INSERT INTO affiliate_tracking_links (
        org_id, affiliate_id, link_code, destination_url, campaign_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, affiliateId, linkCode, destinationUrl, campaignName]);
    return result.rows[0];
  }

  /**
   * List tracking links for an affiliate
   */
  async listTrackingLinks(orgId, affiliateId) {
    const query = `
      SELECT 
        tl.*,
        COUNT(DISTINCT c.id) as total_clicks,
        COUNT(DISTINCT cv.id) as total_conversions
      FROM affiliate_tracking_links tl
      LEFT JOIN affiliate_clicks c ON tl.id = c.link_id
      LEFT JOIN affiliate_conversions cv ON tl.id = cv.link_id AND cv.status = 'approved'
      WHERE tl.org_id = $1 AND tl.affiliate_id = $2
      GROUP BY tl.id
      ORDER BY tl.created_at DESC
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    return result.rows;
  }

  /**
   * Update tracking link
   */
  async updateTrackingLink(orgId, linkId, data) {
    const allowedFields = ['destination_url', 'campaign_name', 'is_active'];
    const updates = [];
    const values = [orgId, linkId];
    let paramCount = 2;

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(data[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE affiliate_tracking_links
      SET ${updates.join(', ')}
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Tracking link not found');
    }

    return result.rows[0];
  }

  /**
   * Delete tracking link
   */
  async deleteTrackingLink(orgId, linkId) {
    const query = `
      DELETE FROM affiliate_tracking_links
      WHERE org_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [orgId, linkId]);
    if (result.rows.length === 0) {
      throw new Error('Tracking link not found');
    }

    return { success: true, id: result.rows[0].id };
  }

  /**
   * Get tracking link by code (for public tracking)
   */
  async getTrackingLinkByCode(linkCode) {
    const query = `
      SELECT tl.*, a.cookie_duration_days
      FROM affiliate_tracking_links tl
      JOIN affiliates a ON tl.affiliate_id = a.id
      WHERE tl.link_code = $1 AND tl.is_active = true AND a.status = 'active'
    `;

    const result = await pool.query(query, [linkCode]);
    if (result.rows.length === 0) {
      throw new Error('Invalid or inactive tracking link');
    }

    return result.rows[0];
  }

  // ============================================================================
  // CLICK TRACKING
  // ============================================================================

  /**
   * Track a click event
   */
  async trackClick(linkCode, metadata = {}) {
    const { ip_address, user_agent, referrer, country_code, device_type = 'unknown' } = metadata;

    // Get link details
    const link = await this.getTrackingLinkByCode(linkCode);

    const query = `
      INSERT INTO affiliate_clicks (
        org_id, affiliate_id, link_id, ip_address, user_agent, 
        referrer, country_code, device_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      link.org_id,
      link.affiliate_id,
      link.id,
      ip_address,
      user_agent,
      referrer,
      country_code,
      device_type
    ]);

    return {
      click: result.rows[0],
      destination_url: link.destination_url,
      cookie_duration_days: link.cookie_duration_days
    };
  }

  /**
   * Get click history for an affiliate
   */
  async getClickHistory(orgId, affiliateId, filters = {}) {
    const { start_date, end_date, limit = 100, offset = 0 } = filters;

    let whereConditions = ['org_id = $1', 'affiliate_id = $2'];
    const values = [orgId, affiliateId];
    let paramCount = 2;

    if (start_date) {
      paramCount++;
      whereConditions.push(`clicked_at >= $${paramCount}`);
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereConditions.push(`clicked_at <= $${paramCount}`);
      values.push(end_date);
    }

    const query = `
      SELECT 
        c.*,
        tl.campaign_name,
        tl.destination_url
      FROM affiliate_clicks c
      LEFT JOIN affiliate_tracking_links tl ON c.link_id = tl.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.clicked_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ============================================================================
  // CONVERSIONS
  // ============================================================================

  /**
   * Track a conversion
   */
  async trackConversion(orgId, data) {
    const {
      affiliate_id,
      click_id,
      link_id,
      order_ref,
      amount_ngn,
      customer_email,
      customer_name,
      product_name,
      notes
    } = data;

    // Calculate commission
    const commission = await this.calculateCommission(orgId, affiliate_id, amount_ngn);

    const query = `
      INSERT INTO affiliate_conversions (
        org_id, affiliate_id, click_id, link_id, order_ref, 
        amount_ngn, commission_ngn, customer_email, customer_name, 
        product_name, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      orgId, affiliate_id, click_id, link_id, order_ref,
      amount_ngn, commission.commission_ngn, customer_email, customer_name,
      product_name, notes
    ]);

    return result.rows[0];
  }

  /**
   * Calculate commission for an affiliate
   */
  async calculateCommission(orgId, affiliateId, amountNgn) {
    const query = `
      SELECT commission_type, commission_value, current_tier_id
      FROM affiliates
      WHERE org_id = $1 AND id = $2
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    const { commission_type, commission_value } = result.rows[0];

    let commissionNgn;
    if (commission_type === 'percentage') {
      commissionNgn = Math.round((amountNgn * commission_value) / 100);
    } else {
      commissionNgn = Math.round(commission_value * 100); // Convert to kobo
    }

    return {
      commission_ngn: commissionNgn,
      commission_type,
      commission_value
    };
  }

  /**
   * Get conversions for an affiliate
   */
  async getConversionsByAffiliate(orgId, affiliateId, filters = {}) {
    const { status, start_date, end_date, limit = 50, offset = 0 } = filters;

    let whereConditions = ['org_id = $1', 'affiliate_id = $2'];
    const values = [orgId, affiliateId];
    let paramCount = 2;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (start_date) {
      paramCount++;
      whereConditions.push(`conversion_date >= $${paramCount}`);
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereConditions.push(`conversion_date <= $${paramCount}`);
      values.push(end_date);
    }

    const query = `
      SELECT *
      FROM affiliate_conversions
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY conversion_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update conversion status (approve/reject)
   */
  async updateConversionStatus(orgId, conversionId, status, userId, reason = null) {
    const validStatuses = ['pending', 'approved', 'paid', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    let updateFields = ['status = $3'];
    const values = [orgId, conversionId, status];
    let paramCount = 3;

    if (status === 'approved') {
      paramCount++;
      updateFields.push(`approved_at = NOW(), approved_by = $${paramCount}`);
      values.push(userId);
    } else if (status === 'rejected') {
      paramCount++;
      updateFields.push(`rejected_at = NOW(), rejected_by = $${paramCount}`);
      values.push(userId);
      
      if (reason) {
        paramCount++;
        updateFields.push(`rejection_reason = $${paramCount}`);
        values.push(reason);
      }
    }

    const query = `
      UPDATE affiliate_conversions
      SET ${updateFields.join(', ')}
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Conversion not found');
    }

    return result.rows[0];
  }

  // ============================================================================
  // PERFORMANCE & ANALYTICS
  // ============================================================================

  /**
   * Get performance stats for an affiliate
   */
  async getPerformanceStats(orgId, affiliateId, dateRange = {}) {
    const { start_date, end_date } = dateRange;

    let dateCondition = '';
    const values = [orgId, affiliateId];
    let paramCount = 2;

    if (start_date && end_date) {
      paramCount++;
      dateCondition = `AND clicked_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
      dateCondition += ` AND clicked_at <= $${paramCount}`;
      values.push(end_date);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT c.id) as total_clicks,
        COUNT(DISTINCT cv.id) as total_conversions,
        COALESCE(SUM(cv.amount_ngn), 0) as total_revenue_ngn,
        COALESCE(SUM(cv.commission_ngn), 0) as total_commission_ngn,
        CASE 
          WHEN COUNT(DISTINCT c.id) > 0 
          THEN ROUND((COUNT(DISTINCT cv.id)::numeric / COUNT(DISTINCT c.id)::numeric) * 100, 2)
          ELSE 0 
        END as conversion_rate,
        CASE 
          WHEN COUNT(DISTINCT cv.id) > 0 
          THEN ROUND(SUM(cv.amount_ngn)::numeric / COUNT(DISTINCT cv.id)::numeric, 2)
          ELSE 0 
        END as avg_order_value_ngn
      FROM affiliate_clicks c
      LEFT JOIN affiliate_conversions cv ON c.affiliate_id = cv.affiliate_id 
        AND cv.status = 'approved'
        ${start_date && end_date ? 'AND cv.conversion_date >= $3 AND cv.conversion_date <= $4' : ''}
      WHERE c.org_id = $1 AND c.affiliate_id = $2 ${dateCondition}
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get top performing affiliates
   */
  async getTopAffiliates(orgId, limit = 10, metric = 'revenue') {
    const validMetrics = {
      revenue: 'lifetime_revenue_ngn',
      conversions: 'lifetime_conversions',
      commission: 'lifetime_commission_ngn'
    };

    const sortField = validMetrics[metric] || 'lifetime_revenue_ngn';

    const query = `
      SELECT 
        a.*,
        t.tier_name,
        COUNT(DISTINCT ac.id) as total_clicks,
        CASE 
          WHEN COUNT(DISTINCT ac.id) > 0 
          THEN ROUND((a.lifetime_conversions::numeric / COUNT(DISTINCT ac.id)::numeric) * 100, 2)
          ELSE 0 
        END as conversion_rate
      FROM affiliates a
      LEFT JOIN affiliate_commission_tiers t ON a.current_tier_id = t.id
      LEFT JOIN affiliate_clicks ac ON a.id = ac.affiliate_id
      WHERE a.org_id = $1 AND a.status = 'active'
      GROUP BY a.id, t.tier_name
      ORDER BY a.${sortField} DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [orgId, limit]);
    return result.rows;
  }

  /**
   * Get overall affiliate analytics
   */
  async getAffiliateAnalytics(orgId, dateRange = {}) {
    const { start_date, end_date } = dateRange;

    let dateCondition = '';
    const values = [orgId];
    let paramCount = 1;

    if (start_date && end_date) {
      paramCount++;
      dateCondition = `AND clicked_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
      dateCondition += ` AND clicked_at <= $${paramCount}`;
      values.push(end_date);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as total_affiliates,
        COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_affiliates,
        COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_affiliates,
        COUNT(DISTINCT c.id) as total_clicks,
        COUNT(DISTINCT cv.id) as total_conversions,
        COALESCE(SUM(cv.amount_ngn), 0) as total_revenue_ngn,
        COALESCE(SUM(cv.commission_ngn), 0) as total_commission_ngn,
        CASE 
          WHEN COUNT(DISTINCT c.id) > 0 
          THEN ROUND((COUNT(DISTINCT cv.id)::numeric / COUNT(DISTINCT c.id)::numeric) * 100, 2)
          ELSE 0 
        END as overall_conversion_rate
      FROM affiliates a
      LEFT JOIN affiliate_clicks c ON a.id = c.affiliate_id ${dateCondition}
      LEFT JOIN affiliate_conversions cv ON a.id = cv.affiliate_id 
        AND cv.status = 'approved'
        ${start_date && end_date ? `AND cv.conversion_date >= $${paramCount - 1} AND cv.conversion_date <= $${paramCount}` : ''}
      WHERE a.org_id = $1
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // PAYOUTS
  // ============================================================================

  /**
   * Create a payout batch
   */
  async createPayoutBatch(orgId, data) {
    const { batch_name, affiliate_ids, date_range, payment_method, notes } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create batch
      const batchQuery = `
        INSERT INTO affiliate_payout_batches (
          org_id, batch_name, payment_method, notes, status
        )
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;

      const batchResult = await client.query(batchQuery, [orgId, batch_name, payment_method, notes]);
      const batch = batchResult.rows[0];

      // Get unpaid conversions for specified affiliates
      let conversionQuery = `
        SELECT 
          affiliate_id,
          ARRAY_AGG(id) as conversion_ids,
          SUM(commission_ngn) as total_commission_ngn
        FROM affiliate_conversions
        WHERE org_id = $1 
          AND status = 'approved' 
          AND payout_item_id IS NULL
      `;

      const queryValues = [orgId];
      let paramCount = 1;

      if (affiliate_ids && affiliate_ids.length > 0) {
        paramCount++;
        conversionQuery += ` AND affiliate_id = ANY($${paramCount})`;
        queryValues.push(affiliate_ids);
      }

      if (date_range?.start_date) {
        paramCount++;
        conversionQuery += ` AND conversion_date >= $${paramCount}`;
        queryValues.push(date_range.start_date);
      }

      if (date_range?.end_date) {
        paramCount++;
        conversionQuery += ` AND conversion_date <= $${paramCount}`;
        queryValues.push(date_range.end_date);
      }

      conversionQuery += ' GROUP BY affiliate_id';

      const conversionsResult = await client.query(conversionQuery, queryValues);

      // Create payout items
      let totalAmount = 0;
      for (const row of conversionsResult.rows) {
        const itemQuery = `
          INSERT INTO affiliate_payout_items (
            org_id, batch_id, affiliate_id, conversion_ids, amount_ngn
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const itemResult = await client.query(itemQuery, [
          orgId,
          batch.id,
          row.affiliate_id,
          row.conversion_ids,
          row.total_commission_ngn
        ]);

        // Link conversions to payout item
        await client.query(
          `UPDATE affiliate_conversions 
           SET payout_item_id = $1 
           WHERE id = ANY($2)`,
          [itemResult.rows[0].id, row.conversion_ids]
        );

        totalAmount += parseInt(row.total_commission_ngn);
      }

      // Update batch total
      await client.query(
        'UPDATE affiliate_payout_batches SET total_amount_ngn = $1 WHERE id = $2',
        [totalAmount, batch.id]
      );

      await client.query('COMMIT');

      // Return batch with items
      return await this.getPayoutBatch(orgId, batch.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payout batch details
   */
  async getPayoutBatch(orgId, batchId) {
    const batchQuery = `
      SELECT * FROM affiliate_payout_batches
      WHERE org_id = $1 AND id = $2
    `;

    const batchResult = await pool.query(batchQuery, [orgId, batchId]);
    if (batchResult.rows.length === 0) {
      throw new Error('Payout batch not found');
    }

    const itemsQuery = `
      SELECT 
        pi.*,
        a.name as affiliate_name,
        a.email as affiliate_email,
        a.payment_method,
        a.payment_details
      FROM affiliate_payout_items pi
      JOIN affiliates a ON pi.affiliate_id = a.id
      WHERE pi.org_id = $1 AND pi.batch_id = $2
      ORDER BY a.name
    `;

    const itemsResult = await pool.query(itemsQuery, [orgId, batchId]);

    return {
      ...batchResult.rows[0],
      items: itemsResult.rows
    };
  }

  /**
   * List payout batches
   */
  async listPayoutBatches(orgId, filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;

    let whereConditions = ['org_id = $1'];
    const values = [orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
    }

    const query = `
      SELECT 
        pb.*,
        COUNT(pi.id) as item_count
      FROM affiliate_payout_batches pb
      LEFT JOIN affiliate_payout_items pi ON pb.id = pi.batch_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY pb.id
      ORDER BY pb.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Process payout batch
   */
  async processPayoutBatch(orgId, batchId, paymentReference) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update batch status
      const batchQuery = `
        UPDATE affiliate_payout_batches
        SET status = 'completed', 
            processed_at = NOW(),
            payment_reference = $3
        WHERE org_id = $1 AND id = $2
        RETURNING *
      `;

      const batchResult = await client.query(batchQuery, [orgId, batchId, paymentReference]);
      if (batchResult.rows.length === 0) {
        throw new Error('Payout batch not found');
      }

      // Update all items to paid
      await client.query(
        `UPDATE affiliate_payout_items 
         SET status = 'paid' 
         WHERE batch_id = $1`,
        [batchId]
      );

      // Update conversions to paid
      await client.query(
        `UPDATE affiliate_conversions 
         SET status = 'paid' 
         WHERE payout_item_id IN (
           SELECT id FROM affiliate_payout_items WHERE batch_id = $1
         )`,
        [batchId]
      );

      await client.query('COMMIT');

      return batchResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payout history for an affiliate
   */
  async getPayoutHistory(orgId, affiliateId) {
    const query = `
      SELECT 
        pi.*,
        pb.batch_name,
        pb.status as batch_status,
        pb.payment_method,
        pb.payment_reference,
        pb.processed_at
      FROM affiliate_payout_items pi
      JOIN affiliate_payout_batches pb ON pi.batch_id = pb.id
      WHERE pi.org_id = $1 AND pi.affiliate_id = $2
      ORDER BY pb.created_at DESC
    `;

    const result = await pool.query(query, [orgId, affiliateId]);
    return result.rows;
  }

  // ============================================================================
  // MARKETING MATERIALS
  // ============================================================================

  /**
   * Upload marketing material
   */
  async uploadMarketingMaterial(orgId, data) {
    const {
      title,
      description,
      material_type,
      file_url,
      thumbnail_url,
      dimensions,
      file_size
    } = data;

    const query = `
      INSERT INTO affiliate_marketing_materials (
        org_id, title, description, material_type, file_url, 
        thumbnail_url, dimensions, file_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      orgId, title, description, material_type, file_url,
      thumbnail_url, dimensions, file_size
    ]);

    return result.rows[0];
  }

  /**
   * List marketing materials
   */
  async listMarketingMaterials(orgId, filters = {}) {
    const { material_type, is_active = true } = filters;

    let whereConditions = ['org_id = $1'];
    const values = [orgId];
    let paramCount = 1;

    if (material_type) {
      paramCount++;
      whereConditions.push(`material_type = $${paramCount}`);
      values.push(material_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      whereConditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
    }

    const query = `
      SELECT *
      FROM affiliate_marketing_materials
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Track material download
   */
  async trackMaterialDownload(orgId, materialId) {
    const query = `
      UPDATE affiliate_marketing_materials
      SET download_count = download_count + 1
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, materialId]);
    if (result.rows.length === 0) {
      throw new Error('Material not found');
    }

    return result.rows[0];
  }

  /**
   * Delete marketing material
   */
  async deleteMarketingMaterial(orgId, materialId) {
    const query = `
      DELETE FROM affiliate_marketing_materials
      WHERE org_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [orgId, materialId]);
    if (result.rows.length === 0) {
      throw new Error('Material not found');
    }

    return { success: true, id: result.rows[0].id };
  }

  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================

  /**
   * Run fraud detection for an affiliate
   */
  async detectFraud(orgId, affiliateId) {
    const alerts = [];

    // Check for suspicious click patterns (high clicks, low conversions)
    const clickConversionQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_clicks,
        COUNT(DISTINCT cv.id) as total_conversions
      FROM affiliate_clicks c
      LEFT JOIN affiliate_conversions cv ON c.affiliate_id = cv.affiliate_id
      WHERE c.org_id = $1 AND c.affiliate_id = $2
        AND c.clicked_at >= NOW() - INTERVAL '7 days'
    `;

    const clickResult = await pool.query(clickConversionQuery, [orgId, affiliateId]);
    const { total_clicks, total_conversions } = clickResult.rows[0];

    if (total_clicks > 100 && total_conversions === 0) {
      alerts.push({
        alert_type: 'suspicious_clicks',
        severity: 'high',
        description: `High click volume (${total_clicks}) with zero conversions in the last 7 days`
      });
    }

    // Check for duplicate conversions (same customer email)
    const duplicateQuery = `
      SELECT customer_email, COUNT(*) as count
      FROM affiliate_conversions
      WHERE org_id = $1 AND affiliate_id = $2 
        AND customer_email IS NOT NULL
        AND conversion_date >= NOW() - INTERVAL '30 days'
      GROUP BY customer_email
      HAVING COUNT(*) > 3
    `;

    const duplicateResult = await pool.query(duplicateQuery, [orgId, affiliateId]);
    if (duplicateResult.rows.length > 0) {
      alerts.push({
        alert_type: 'duplicate_conversions',
        severity: 'medium',
        description: `Multiple conversions from same customer emails detected`
      });
    }

    // Check for unusual traffic patterns (same IP multiple times)
    const ipQuery = `
      SELECT ip_address, COUNT(*) as count
      FROM affiliate_clicks
      WHERE org_id = $1 AND affiliate_id = $2
        AND clicked_at >= NOW() - INTERVAL '1 day'
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) > 50
    `;

    const ipResult = await pool.query(ipQuery, [orgId, affiliateId]);
    if (ipResult.rows.length > 0) {
      alerts.push({
        alert_type: 'invalid_traffic',
        severity: 'critical',
        description: `Suspicious traffic pattern: ${ipResult.rows.length} IP(s) with excessive clicks`
      });
    }

    // Save alerts to database
    for (const alert of alerts) {
      await pool.query(
        `INSERT INTO affiliate_fraud_alerts (
          org_id, affiliate_id, alert_type, severity, description
        ) VALUES ($1, $2, $3, $4, $5)`,
        [orgId, affiliateId, alert.alert_type, alert.severity, alert.description]
      );
    }

    return alerts;
  }

  /**
   * Get fraud alerts
   */
  async getFraudAlerts(orgId, filters = {}) {
    const { affiliate_id, is_resolved, severity } = filters;

    let whereConditions = ['org_id = $1'];
    const values = [orgId];
    let paramCount = 1;

    if (affiliate_id) {
      paramCount++;
      whereConditions.push(`affiliate_id = $${paramCount}`);
      values.push(affiliate_id);
    }

    if (is_resolved !== undefined) {
      paramCount++;
      whereConditions.push(`is_resolved = $${paramCount}`);
      values.push(is_resolved);
    }

    if (severity) {
      paramCount++;
      whereConditions.push(`severity = $${paramCount}`);
      values.push(severity);
    }

    const query = `
      SELECT 
        fa.*,
        a.name as affiliate_name,
        a.email as affiliate_email
      FROM affiliate_fraud_alerts fa
      JOIN affiliates a ON fa.affiliate_id = a.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY fa.created_at DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Resolve fraud alert
   */
  async resolveAlert(orgId, alertId, userId) {
    const query = `
      UPDATE affiliate_fraud_alerts
      SET is_resolved = true,
          resolved_by = $3,
          resolved_at = NOW()
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [orgId, alertId, userId]);
    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    return result.rows[0];
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate unique link code
   */
  _generateLinkCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Export affiliate report
   */
  async exportAffiliateReport(orgId, format = 'json') {
    const query = `
      SELECT 
        a.id,
        a.name,
        a.email,
        a.promo_code,
        a.status,
        a.lifetime_conversions,
        a.lifetime_revenue_ngn,
        a.lifetime_commission_ngn,
        t.tier_name,
        COUNT(DISTINCT c.id) as total_clicks,
        CASE 
          WHEN COUNT(DISTINCT c.id) > 0 
          THEN ROUND((a.lifetime_conversions::numeric / COUNT(DISTINCT c.id)::numeric) * 100, 2)
          ELSE 0 
        END as conversion_rate
      FROM affiliates a
      LEFT JOIN affiliate_commission_tiers t ON a.current_tier_id = t.id
      LEFT JOIN affiliate_clicks c ON a.id = c.affiliate_id
      WHERE a.org_id = $1
      GROUP BY a.id, t.tier_name
      ORDER BY a.lifetime_revenue_ngn DESC
    `;

    const result = await pool.query(query, [orgId]);

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const rows = result.rows.map(row => Object.values(row).join(',')).join('\n');
      return `${headers}\n${rows}`;
    }

    return result.rows;
  }
}

module.exports = new AffiliateService();
