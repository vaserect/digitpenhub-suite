const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

class FunnelService {
  /**
   * Create a new funnel
   */
  async createFunnel(orgId, userId, data) {
    const {
      name,
      description,
      funnelType = 'lead_generation',
      goal,
      targetMetric,
      customDomain,
      subdomain,
      urlSlug,
      settings = {}
    } = data;

    const slug = urlSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(
      `INSERT INTO funnels (
        org_id, name, description, funnel_type, goal, target_metric,
        custom_domain, subdomain, url_slug, settings, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        orgId, name, description, funnelType, goal,
        JSON.stringify(targetMetric || {}),
        customDomain, subdomain, slug,
        JSON.stringify(settings),
        userId
      ]
    );

    return result.rows[0];
  }

  /**
   * Get funnel by ID with steps
   */
  async getFunnelById(funnelId, orgId) {
    const funnelResult = await db.query(
      `SELECT * FROM funnels WHERE id = $1 AND org_id = $2`,
      [funnelId, orgId]
    );

    if (funnelResult.rows.length === 0) {
      return null;
    }

    const funnel = funnelResult.rows[0];

    // Get steps
    const stepsResult = await db.query(
      `SELECT fs.*, p.title as page_title, p.slug as page_slug
       FROM funnel_steps fs
       LEFT JOIN pages p ON p.id = fs.page_id
       WHERE fs.funnel_id = $1
       ORDER BY fs.step_order`,
      [funnelId]
    );

    funnel.steps = stepsResult.rows;

    return funnel;
  }

  /**
   * List funnels for organization
   */
  async listFunnels(orgId, filters = {}) {
    let query = `
      SELECT f.*, 
             COUNT(DISTINCT fs.id) as step_count,
             COUNT(DISTINCT fc.id) as total_conversions
      FROM funnels f
      LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
      LEFT JOIN funnel_conversions fc ON fc.funnel_id = f.id
      WHERE f.org_id = $1
    `;

    const params = [orgId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND f.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.funnelType) {
      query += ` AND f.funnel_type = $${paramIndex}`;
      params.push(filters.funnelType);
      paramIndex++;
    }

    query += ` GROUP BY f.id ORDER BY f.updated_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Update funnel
   */
  async updateFunnel(funnelId, orgId, updates) {
    const allowedFields = [
      'name', 'description', 'funnel_type', 'goal', 'target_metric',
      'status', 'custom_domain', 'subdomain', 'url_slug', 'settings'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        
        if (key === 'target_metric' || key === 'settings') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(funnelId, orgId);

    const result = await db.query(
      `UPDATE funnels SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete funnel
   */
  async deleteFunnel(funnelId, orgId) {
    const result = await db.query(
      `DELETE FROM funnels WHERE id = $1 AND org_id = $2 RETURNING id`,
      [funnelId, orgId]
    );

    return result.rows.length > 0;
  }

  /**
   * Publish funnel
   */
  async publishFunnel(funnelId, orgId) {
    const result = await db.query(
      `UPDATE funnels 
       SET status = 'active', is_published = true, published_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [funnelId, orgId]
    );

    return result.rows[0];
  }

  /**
   * Create funnel step
   */
  async createStep(funnelId, orgId, stepData) {
    // Verify funnel ownership
    const funnelCheck = await db.query(
      `SELECT id FROM funnels WHERE id = $1 AND org_id = $2`,
      [funnelId, orgId]
    );

    if (funnelCheck.rows.length === 0) {
      throw new Error('Funnel not found');
    }

    const {
      stepName,
      stepType,
      urlPath,
      pageId,
      nextStepId,
      successStepId,
      failureStepId,
      conditions = [],
      settings = {}
    } = stepData;

    // Get next order number
    const orderResult = await db.query(
      `SELECT COALESCE(MAX(step_order), -1) + 1 as next_order
       FROM funnel_steps WHERE funnel_id = $1`,
      [funnelId]
    );

    const stepOrder = orderResult.rows[0].next_order;

    const result = await db.query(
      `INSERT INTO funnel_steps (
        funnel_id, step_name, step_type, step_order, url_path,
        page_id, next_step_id, success_step_id, failure_step_id,
        conditions, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        funnelId, stepName, stepType, stepOrder, urlPath,
        pageId, nextStepId, successStepId, failureStepId,
        JSON.stringify(conditions), JSON.stringify(settings)
      ]
    );

    return result.rows[0];
  }

  /**
   * Update funnel step
   */
  async updateStep(stepId, funnelId, orgId, updates) {
    // Verify ownership
    const check = await db.query(
      `SELECT fs.id FROM funnel_steps fs
       JOIN funnels f ON f.id = fs.funnel_id
       WHERE fs.id = $1 AND fs.funnel_id = $2 AND f.org_id = $3`,
      [stepId, funnelId, orgId]
    );

    if (check.rows.length === 0) {
      throw new Error('Step not found');
    }

    const allowedFields = [
      'step_name', 'step_type', 'url_path', 'page_id',
      'next_step_id', 'success_step_id', 'failure_step_id',
      'conditions', 'settings', 'is_active'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        
        if (key === 'conditions' || key === 'settings') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(stepId);

    const result = await db.query(
      `UPDATE funnel_steps SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete funnel step
   */
  async deleteStep(stepId, funnelId, orgId) {
    const result = await db.query(
      `DELETE FROM funnel_steps fs
       USING funnels f
       WHERE fs.id = $1 AND fs.funnel_id = $2 
       AND f.id = fs.funnel_id AND f.org_id = $3
       RETURNING fs.id`,
      [stepId, funnelId, orgId]
    );

    if (result.rows.length > 0) {
      // Reorder remaining steps
      await db.query(
        `UPDATE funnel_steps SET step_order = sub.new_order
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY step_order) - 1 as new_order
           FROM funnel_steps WHERE funnel_id = $1
         ) sub
         WHERE funnel_steps.id = sub.id`,
        [funnelId]
      );
    }

    return result.rows.length > 0;
  }

  /**
   * Reorder funnel steps
   */
  async reorderSteps(funnelId, orgId, orderedStepIds) {
    // Verify ownership
    const check = await db.query(
      `SELECT id FROM funnels WHERE id = $1 AND org_id = $2`,
      [funnelId, orgId]
    );

    if (check.rows.length === 0) {
      throw new Error('Funnel not found');
    }

    // Update each step's order
    for (let i = 0; i < orderedStepIds.length; i++) {
      await db.query(
        `UPDATE funnel_steps SET step_order = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND funnel_id = $3`,
        [i, orderedStepIds[i], funnelId]
      );
    }

    return true;
  }

  /**
   * Track analytics event
   */
  async trackEvent(eventData) {
    const {
      funnelId,
      stepId,
      sessionId,
      eventType,
      eventData: data = {},
      userId,
      visitorId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      deviceType,
      browser,
      os,
      country,
      city
    } = eventData;

    const result = await db.query(
      `INSERT INTO funnel_analytics_events (
        funnel_id, step_id, session_id, event_type, event_data,
        user_id, visitor_id, referrer,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        device_type, browser, os, country, city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        funnelId, stepId, sessionId, eventType, JSON.stringify(data),
        userId, visitorId, referrer,
        utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
        deviceType, browser, os, country, city
      ]
    );

    // Update step analytics
    if (stepId) {
      if (eventType === 'page_view') {
        await db.query(
          `UPDATE funnel_steps SET visitors = visitors + 1 WHERE id = $1`,
          [stepId]
        );
      } else if (eventType === 'conversion') {
        await db.query(
          `UPDATE funnel_steps 
           SET conversions = conversions + 1,
               conversion_rate = ROUND((conversions + 1)::numeric / NULLIF(visitors, 0) * 100, 2)
           WHERE id = $1`,
          [stepId]
        );
      }
    }

    // Update funnel analytics
    if (eventType === 'page_view') {
      await db.query(
        `UPDATE funnels SET total_visitors = total_visitors + 1 WHERE id = $1`,
        [funnelId]
      );
    } else if (eventType === 'conversion') {
      await db.query(
        `UPDATE funnels 
         SET total_conversions = total_conversions + 1,
             conversion_rate = ROUND((total_conversions + 1)::numeric / NULLIF(total_visitors, 0) * 100, 2)
         WHERE id = $1`,
        [funnelId]
      );
    }

    return result.rows[0];
  }

  /**
   * Track conversion
   */
  async trackConversion(conversionData) {
    const {
      funnelId,
      sessionId,
      conversionType,
      conversionValue = 0,
      entryStepId,
      conversionStepId,
      stepsTaken = [],
      timeToConvert,
      userId,
      visitorId,
      email,
      utmSource,
      utmMedium,
      utmCampaign,
      metadata = {}
    } = conversionData;

    const result = await db.query(
      `INSERT INTO funnel_conversions (
        funnel_id, session_id, conversion_type, conversion_value,
        entry_step_id, conversion_step_id, steps_taken, time_to_convert,
        user_id, visitor_id, email,
        utm_source, utm_medium, utm_campaign, conversion_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        funnelId, sessionId, conversionType, conversionValue,
        entryStepId, conversionStepId, JSON.stringify(stepsTaken), timeToConvert,
        userId, visitorId, email,
        utmSource, utmMedium, utmCampaign, JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  /**
   * Get funnel analytics
   */
  async getAnalytics(funnelId, orgId, dateRange = {}) {
    // Verify ownership
    const check = await db.query(
      `SELECT id FROM funnels WHERE id = $1 AND org_id = $2`,
      [funnelId, orgId]
    );

    if (check.rows.length === 0) {
      throw new Error('Funnel not found');
    }

    const { startDate, endDate } = dateRange;
    let dateFilter = '';
    const params = [funnelId];

    if (startDate && endDate) {
      dateFilter = ` AND created_at BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    // Overall metrics
    const overallResult = await db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as total_visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END) as total_conversions,
        ROUND(
          COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END)::numeric / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END), 0) * 100, 
          2
        ) as conversion_rate
       FROM funnel_analytics_events
       WHERE funnel_id = $1${dateFilter}`,
      params
    );

    // Step-by-step metrics
    const stepsResult = await db.query(
      `SELECT 
        fs.id, fs.step_name, fs.step_type, fs.step_order,
        COUNT(DISTINCT CASE WHEN fae.event_type = 'page_view' THEN fae.session_id END) as visitors,
        COUNT(DISTINCT CASE WHEN fae.event_type = 'conversion' THEN fae.session_id END) as conversions,
        ROUND(
          COUNT(DISTINCT CASE WHEN fae.event_type = 'conversion' THEN fae.session_id END)::numeric / 
          NULLIF(COUNT(DISTINCT CASE WHEN fae.event_type = 'page_view' THEN fae.session_id END), 0) * 100,
          2
        ) as conversion_rate
       FROM funnel_steps fs
       LEFT JOIN funnel_analytics_events fae ON fae.step_id = fs.id${dateFilter.replace('created_at', 'fae.created_at')}
       WHERE fs.funnel_id = $1
       GROUP BY fs.id, fs.step_name, fs.step_type, fs.step_order
       ORDER BY fs.step_order`,
      params
    );

    // Traffic sources
    const sourcesResult = await db.query(
      `SELECT 
        utm_source, utm_medium, utm_campaign,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END) as conversions
       FROM funnel_analytics_events
       WHERE funnel_id = $1${dateFilter}
       GROUP BY utm_source, utm_medium, utm_campaign
       ORDER BY visitors DESC
       LIMIT 10`,
      params
    );

    // Device breakdown
    const devicesResult = await db.query(
      `SELECT 
        device_type,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END) as conversions
       FROM funnel_analytics_events
       WHERE funnel_id = $1${dateFilter}
       GROUP BY device_type`,
      params
    );

    return {
      overall: overallResult.rows[0],
      steps: stepsResult.rows,
      sources: sourcesResult.rows,
      devices: devicesResult.rows
    };
  }

  /**
   * Create A/B test
   */
  async createABTest(funnelId, orgId, userId, testData) {
    // Verify ownership
    const check = await db.query(
      `SELECT id FROM funnels WHERE id = $1 AND org_id = $2`,
      [funnelId, orgId]
    );

    if (check.rows.length === 0) {
      throw new Error('Funnel not found');
    }

    const {
      stepId,
      testName,
      testType = 'page',
      variants = [],
      trafficAllocation = {}
    } = testData;

    const result = await db.query(
      `INSERT INTO funnel_ab_tests (
        funnel_id, step_id, test_name, test_type,
        variants, traffic_allocation, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        funnelId, stepId, testName, testType,
        JSON.stringify(variants), JSON.stringify(trafficAllocation),
        userId
      ]
    );

    return result.rows[0];
  }

  /**
   * Start A/B test
   */
  async startABTest(testId, orgId) {
    const result = await db.query(
      `UPDATE funnel_ab_tests fat
       SET status = 'running', started_at = CURRENT_TIMESTAMP
       FROM funnels f
       WHERE fat.id = $1 AND fat.funnel_id = f.id AND f.org_id = $2
       RETURNING fat.*`,
      [testId, orgId]
    );

    return result.rows[0];
  }

  /**
   * Stop A/B test
   */
  async stopABTest(testId, orgId, winnerVariantId = null) {
    const result = await db.query(
      `UPDATE funnel_ab_tests fat
       SET status = 'completed', ended_at = CURRENT_TIMESTAMP, winner_variant_id = $3
       FROM funnels f
       WHERE fat.id = $1 AND fat.funnel_id = f.id AND f.org_id = $2
       RETURNING fat.*`,
      [testId, orgId, winnerVariantId]
    );

    return result.rows[0];
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId, orgId) {
    const testResult = await db.query(
      `SELECT fat.* FROM funnel_ab_tests fat
       JOIN funnels f ON f.id = fat.funnel_id
       WHERE fat.id = $1 AND f.org_id = $2`,
      [testId, orgId]
    );

    if (testResult.rows.length === 0) {
      throw new Error('Test not found');
    }

    const resultsResult = await db.query(
      `SELECT * FROM funnel_ab_results WHERE test_id = $1 ORDER BY conversion_rate DESC`,
      [testId]
    );

    return {
      test: testResult.rows[0],
      results: resultsResult.rows
    };
  }

  /**
   * Create funnel from template
   */
  async createFromTemplate(templateId, orgId, userId, customizations = {}) {
    const templateResult = await db.query(
      `SELECT * FROM funnel_templates WHERE id = $1`,
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      throw new Error('Template not found');
    }

    const template = templateResult.rows[0];
    const templateData = template.template_data;

    // Create funnel
    const funnel = await this.createFunnel(orgId, userId, {
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      funnelType: templateData.funnel_type || 'lead_generation',
      ...customizations
    });

    // Create steps from template
    if (templateData.steps && Array.isArray(templateData.steps)) {
      for (const stepTemplate of templateData.steps) {
        await this.createStep(funnel.id, orgId, {
          stepName: stepTemplate.name,
          stepType: stepTemplate.type,
          urlPath: `/${stepTemplate.name.toLowerCase().replace(/\s+/g, '-')}`,
          settings: stepTemplate.settings || {}
        });
      }
    }

    // Update template usage count
    await db.query(
      `UPDATE funnel_templates SET usage_count = usage_count + 1 WHERE id = $1`,
      [templateId]
    );

    return this.getFunnelById(funnel.id, orgId);
  }

  /**
   * List funnel templates
   */
  async listTemplates(filters = {}) {
    let query = `SELECT * FROM funnel_templates WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.isSystem !== undefined) {
      query += ` AND is_system = $${paramIndex}`;
      params.push(filters.isSystem);
      paramIndex++;
    }

    query += ` ORDER BY usage_count DESC, created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = new FunnelService();
