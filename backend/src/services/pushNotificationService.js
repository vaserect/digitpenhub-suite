const db = require('../db');
const BaseService = require('./base/BaseService');

/**
 * Push Notification Marketing Service
 * Handles web push notifications, mobile push, campaigns, subscribers, and analytics
 * Benchmark: OneSignal / PushEngage
 */
class PushNotificationService extends BaseService {
  constructor() {
    super('push_campaigns');
  }

  // ==================== CAMPAIGNS ====================

  /**
   * Create a new push campaign
   */
  async createCampaign(orgId, userId, campaignData) {
    const {
      name, type, title, body, icon_url, image_url, badge_url, click_url,
      action_buttons, schedule_type, scheduled_at, timezone, recurring_pattern,
      segment_ids, targeting_rules, is_ab_test, ab_test_variants,
      ttl, priority, require_interaction, silent, vibrate, sound, tags, custom_data
    } = campaignData;

    const { rows } = await db.query(
      `INSERT INTO push_campaigns (
        org_id, name, type, title, body, icon_url, image_url, badge_url, click_url,
        action_buttons, schedule_type, scheduled_at, timezone, recurring_pattern,
        segment_ids, targeting_rules, is_ab_test, ab_test_variants,
        ttl, priority, require_interaction, silent, vibrate, sound, tags, custom_data, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        orgId, name, type, title, body, icon_url, image_url, badge_url, click_url,
        JSON.stringify(action_buttons || []), schedule_type, scheduled_at, timezone, 
        JSON.stringify(recurring_pattern), segment_ids, JSON.stringify(targeting_rules || {}),
        is_ab_test || false, JSON.stringify(ab_test_variants),
        ttl || 259200, priority || 'normal', require_interaction || false, 
        silent || false, vibrate, sound, tags, JSON.stringify(custom_data || {}), userId
      ]
    );

    return rows[0];
  }

  /**
   * Get all campaigns for an organization
   */
  async getCampaigns(orgId, filters = {}) {
    const { status, type, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM push_campaigns WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(orgId, campaignId) {
    const { rows } = await db.query(
      'SELECT * FROM push_campaigns WHERE id = $1 AND org_id = $2',
      [campaignId, orgId]
    );
    return rows[0];
  }

  /**
   * Update a campaign
   */
  async updateCampaign(orgId, campaignId, updates) {
    const allowedFields = [
      'name', 'type', 'status', 'title', 'body', 'icon_url', 'image_url', 
      'badge_url', 'click_url', 'action_buttons', 'schedule_type', 'scheduled_at',
      'timezone', 'recurring_pattern', 'segment_ids', 'targeting_rules',
      'is_ab_test', 'ab_test_variants', 'ttl', 'priority', 'require_interaction',
      'silent', 'vibrate', 'sound', 'tags', 'custom_data'
    ];

    const setClause = [];
    const values = [orgId, campaignId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        let value = updates[key];
        
        // Handle JSON fields
        if (['action_buttons', 'recurring_pattern', 'targeting_rules', 'ab_test_variants', 'custom_data'].includes(key)) {
          value = JSON.stringify(value);
        }
        
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    setClause.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    const { rows } = await db.query(
      `UPDATE push_campaigns SET ${setClause.join(', ')} 
       WHERE org_id = $1 AND id = $2 RETURNING *`,
      values
    );

    return rows[0];
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(orgId, campaignId) {
    await db.query(
      'DELETE FROM push_campaigns WHERE id = $1 AND org_id = $2',
      [campaignId, orgId]
    );
    return { success: true };
  }

  /**
   * Send a campaign immediately
   */
  async sendCampaign(orgId, campaignId) {
    const campaign = await this.getCampaign(orgId, campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get target subscribers
    const subscribers = await this.getTargetSubscribers(orgId, campaign);

    // Create deliveries
    const deliveries = [];
    for (const subscriber of subscribers) {
      const variant = campaign.is_ab_test ? this.selectVariant(campaign.ab_test_variants) : null;
      
      const { rows } = await db.query(
        `INSERT INTO push_deliveries (org_id, campaign_id, subscriber_id, variant, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
        [orgId, campaignId, subscriber.id, variant]
      );
      deliveries.push(rows[0]);
    }

    // Update campaign status
    await db.query(
      `UPDATE push_campaigns SET status = 'active', sent_at = NOW() WHERE id = $1`,
      [campaignId]
    );

    // In production, this would trigger actual push notification sending
    // For now, we'll mark them as sent
    await db.query(
      `UPDATE push_deliveries SET status = 'sent', sent_at = NOW() 
       WHERE campaign_id = $1`,
      [campaignId]
    );

    return { success: true, deliveries: deliveries.length };
  }

  /**
   * Get target subscribers based on campaign targeting
   */
  async getTargetSubscribers(orgId, campaign) {
    let query = 'SELECT * FROM push_subscribers WHERE org_id = $1 AND is_active = true AND opted_in = true';
    const params = [orgId];
    let paramCount = 1;

    // Filter by platform
    if (campaign.type === 'web') {
      paramCount++;
      query += ` AND platform = $${paramCount}`;
      params.push('web');
    } else if (campaign.type === 'mobile') {
      paramCount++;
      query += ` AND platform IN ($${paramCount}, $${paramCount + 1})`;
      params.push('ios', 'android');
      paramCount++;
    }

    // Filter by segments
    if (campaign.segment_ids && campaign.segment_ids.length > 0) {
      // This would need more complex logic to evaluate segment rules
      // For now, we'll skip segment filtering
    }

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Select A/B test variant
   */
  selectVariant(variants) {
    if (!variants || variants.length === 0) return null;
    const random = Math.random();
    let cumulative = 0;
    
    for (const variant of variants) {
      cumulative += variant.percentage / 100;
      if (random <= cumulative) {
        return variant.name;
      }
    }
    
    return variants[0].name;
  }

  // ==================== SUBSCRIBERS ====================

  /**
   * Subscribe a device to push notifications
   */
  async subscribe(orgId, subscriptionData) {
    const {
      user_id, contact_id, platform, endpoint, auth_key, p256dh_key, device_token,
      device_type, device_model, os_version, app_version, browser, browser_version,
      subscription_data, country, city, timezone, language, tags, custom_attributes
    } = subscriptionData;

    const { rows } = await db.query(
      `INSERT INTO push_subscribers (
        org_id, user_id, contact_id, platform, endpoint, auth_key, p256dh_key, device_token,
        device_type, device_model, os_version, app_version, browser, browser_version,
        subscription_data, country, city, timezone, language, tags, custom_attributes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (org_id, endpoint) DO UPDATE SET
        is_active = true, opted_in = true, opted_in_at = NOW(), last_seen_at = NOW(), updated_at = NOW()
      RETURNING *`,
      [
        orgId, user_id, contact_id, platform, endpoint, auth_key, p256dh_key, device_token,
        device_type, device_model, os_version, app_version, browser, browser_version,
        JSON.stringify(subscription_data), country, city, timezone, language, tags,
        JSON.stringify(custom_attributes || {})
      ]
    );

    return rows[0];
  }

  /**
   * Unsubscribe a device
   */
  async unsubscribe(orgId, subscriberId) {
    await db.query(
      `UPDATE push_subscribers SET is_active = false, opted_in = false, opted_out_at = NOW()
       WHERE id = $1 AND org_id = $2`,
      [subscriberId, orgId]
    );
    return { success: true };
  }

  /**
   * Get all subscribers
   */
  async getSubscribers(orgId, filters = {}) {
    const { platform, is_active, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM push_subscribers WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (platform) {
      paramCount++;
      query += ` AND platform = $${paramCount}`;
      params.push(platform);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get subscriber count
   */
  async getSubscriberCount(orgId, filters = {}) {
    const { platform, is_active } = filters;
    
    let query = 'SELECT COUNT(*) FROM push_subscribers WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (platform) {
      paramCount++;
      query += ` AND platform = $${paramCount}`;
      params.push(platform);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
    }

    const { rows } = await db.query(query, params);
    return parseInt(rows[0].count);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(orgId, campaignId, dateRange = {}) {
    const { start_date, end_date } = dateRange;
    
    let query = `
      SELECT 
        date,
        SUM(sent) as sent,
        SUM(delivered) as delivered,
        SUM(failed) as failed,
        SUM(clicked) as clicked,
        SUM(dismissed) as dismissed,
        AVG(delivery_rate) as avg_delivery_rate,
        AVG(click_rate) as avg_click_rate,
        SUM(web_sent) as web_sent,
        SUM(web_clicked) as web_clicked,
        SUM(mobile_sent) as mobile_sent,
        SUM(mobile_clicked) as mobile_clicked
      FROM push_analytics_daily
      WHERE org_id = $1 AND campaign_id = $2
    `;
    const params = [orgId, campaignId];
    let paramCount = 2;

    if (start_date) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' GROUP BY date ORDER BY date DESC';

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get overall analytics summary
   */
  async getAnalyticsSummary(orgId, dateRange = {}) {
    const { start_date, end_date } = dateRange;
    
    let query = `
      SELECT 
        COUNT(DISTINCT campaign_id) as total_campaigns,
        SUM(sent) as total_sent,
        SUM(delivered) as total_delivered,
        SUM(clicked) as total_clicked,
        ROUND(AVG(delivery_rate), 2) as avg_delivery_rate,
        ROUND(AVG(click_rate), 2) as avg_click_rate
      FROM push_analytics_daily
      WHERE org_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (start_date) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(end_date);
    }

    const { rows } = await db.query(query, params);
    return rows[0];
  }

  /**
   * Track delivery event
   */
  async trackDeliveryEvent(deliveryId, eventType) {
    const validEvents = ['delivered', 'clicked', 'dismissed'];
    if (!validEvents.includes(eventType)) {
      throw new Error('Invalid event type');
    }

    const timestampField = `${eventType}_at`;
    await db.query(
      `UPDATE push_deliveries SET status = $1, ${timestampField} = NOW() WHERE id = $2`,
      [eventType, deliveryId]
    );

    return { success: true };
  }

  // ==================== SEGMENTS ====================

  /**
   * Create a subscriber segment
   */
  async createSegment(orgId, userId, segmentData) {
    const { name, description, rules } = segmentData;

    const { rows } = await db.query(
      `INSERT INTO push_segments (org_id, name, description, rules, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orgId, name, description, JSON.stringify(rules), userId]
    );

    return rows[0];
  }

  /**
   * Get all segments
   */
  async getSegments(orgId) {
    const { rows } = await db.query(
      'SELECT * FROM push_segments WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return rows;
  }

  /**
   * Update segment
   */
  async updateSegment(orgId, segmentId, updates) {
    const { name, description, rules } = updates;
    const { rows } = await db.query(
      `UPDATE push_segments SET name = COALESCE($1, name), description = COALESCE($2, description),
       rules = COALESCE($3, rules), updated_at = NOW()
       WHERE id = $4 AND org_id = $5 RETURNING *`,
      [name, description, rules ? JSON.stringify(rules) : null, segmentId, orgId]
    );
    return rows[0];
  }

  /**
   * Delete segment
   */
  async deleteSegment(orgId, segmentId) {
    await db.query('DELETE FROM push_segments WHERE id = $1 AND org_id = $2', [segmentId, orgId]);
    return { success: true };
  }

  // ==================== TEMPLATES ====================

  /**
   * Get all templates
   */
  async getTemplates(orgId, includeSystem = true) {
    let query = 'SELECT * FROM push_templates WHERE (org_id = $1 OR org_id IS NULL)';
    if (!includeSystem) {
      query = 'SELECT * FROM push_templates WHERE org_id = $1';
    }
    query += ' AND is_active = true ORDER BY created_at DESC';

    const { rows } = await db.query(query, [orgId]);
    return rows;
  }

  /**
   * Create custom template
   */
  async createTemplate(orgId, userId, templateData) {
    const { name, description, category, title, body, icon_url, image_url, click_url, action_buttons } = templateData;

    const { rows } = await db.query(
      `INSERT INTO push_templates (org_id, name, description, category, title, body, icon_url, image_url, click_url, action_buttons, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [orgId, name, description, category, title, body, icon_url, image_url, click_url, JSON.stringify(action_buttons || []), userId]
    );

    return rows[0];
  }

  // ==================== AUTOMATION TRIGGERS ====================

  /**
   * Create automation trigger
   */
  async createTrigger(orgId, userId, triggerData) {
    const { name, description, trigger_type, trigger_event, trigger_conditions, campaign_id, delay_minutes } = triggerData;

    const { rows } = await db.query(
      `INSERT INTO push_automation_triggers (org_id, name, description, trigger_type, trigger_event, trigger_conditions, campaign_id, delay_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orgId, name, description, trigger_type, trigger_event, JSON.stringify(trigger_conditions || {}), campaign_id, delay_minutes || 0, userId]
    );

    return rows[0];
  }

  /**
   * Get all triggers
   */
  async getTriggers(orgId) {
    const { rows } = await db.query(
      'SELECT * FROM push_automation_triggers WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return rows;
  }

  /**
   * Toggle trigger active status
   */
  async toggleTrigger(orgId, triggerId, isActive) {
    const { rows } = await db.query(
      `UPDATE push_automation_triggers SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3 RETURNING *`,
      [isActive, triggerId, orgId]
    );
    return rows[0];
  }
}

module.exports = new PushNotificationService();
