// backend/src/services/leads/LeadScoringService.js
// Module 25: Lead Scoring Service
// Benchmark: MadKudu / HubSpot Lead Scoring

const db = require('../../db');

class LeadScoringService {
  /**
   * Get all scoring models for an organization
   */
  async getModels(orgId, options = {}) {
    const { activeOnly = false } = options;
    
    let query = `
      SELECT 
        lsm.*,
        COUNT(DISTINCT lsr.id) as rules_count,
        COUNT(DISTINCT cs.id) as scored_contacts_count,
        AVG(cs.total_score) as avg_score
      FROM lead_scoring_models lsm
      LEFT JOIN lead_scoring_rules lsr ON lsr.model_id = lsm.id AND lsr.is_active = true
      LEFT JOIN contact_scores cs ON cs.model_id = lsm.id
      WHERE lsm.org_id = $1
    `;
    
    const params = [orgId];
    
    if (activeOnly) {
      query += ` AND lsm.is_active = true`;
    }
    
    query += `
      GROUP BY lsm.id
      ORDER BY lsm.is_default DESC, lsm.created_at DESC
    `;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get default scoring model for an organization
   */
  async getDefaultModel(orgId) {
    const result = await db.query(
      `SELECT * FROM lead_scoring_models 
       WHERE org_id = $1 AND is_default = true AND is_active = true
       LIMIT 1`,
      [orgId]
    );
    
    if (result.rows.length === 0) {
      // Create default model if none exists
      return await this.createModel(orgId, {
        name: 'Default Scoring Model',
        description: 'Automatically created default scoring model',
        is_default: true,
        is_active: true
      });
    }
    
    return result.rows[0];
  }

  /**
   * Create a new scoring model
   */
  async createModel(orgId, data, userId = null) {
    const { name, description, is_active = true, is_default = false } = data;
    
    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        `UPDATE lead_scoring_models SET is_default = false WHERE org_id = $1`,
        [orgId]
      );
    }
    
    const result = await db.query(
      `INSERT INTO lead_scoring_models 
       (org_id, name, description, is_active, is_default, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, name, description, is_active, is_default, userId]
    );
    
    return result.rows[0];
  }

  /**
   * Update a scoring model
   */
  async updateModel(modelId, orgId, data, userId = null) {
    const { name, description, is_active, is_default } = data;
    
    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        `UPDATE lead_scoring_models SET is_default = false 
         WHERE org_id = $1 AND id != $2`,
        [orgId, modelId]
      );
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(is_default);
    }
    
    updates.push(`updated_at = now()`);
    values.push(modelId, orgId);
    
    const result = await db.query(
      `UPDATE lead_scoring_models 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND org_id = $${paramCount++}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Delete a scoring model
   */
  async deleteModel(modelId, orgId) {
    // Cannot delete default model
    const model = await db.query(
      `SELECT is_default FROM lead_scoring_models WHERE id = $1 AND org_id = $2`,
      [modelId, orgId]
    );
    
    if (model.rows.length === 0) {
      throw new Error('Model not found');
    }
    
    if (model.rows[0].is_default) {
      throw new Error('Cannot delete default scoring model');
    }
    
    await db.query(
      `DELETE FROM lead_scoring_models WHERE id = $1 AND org_id = $2`,
      [modelId, orgId]
    );
    
    return { success: true };
  }

  /**
   * Get scoring rules for a model
   */
  async getRules(modelId, orgId, options = {}) {
    const { activeOnly = false } = options;
    
    let query = `
      SELECT lsr.*, u.full_name as created_by_name
      FROM lead_scoring_rules lsr
      LEFT JOIN users u ON u.id = lsr.created_by
      WHERE lsr.model_id = $1 AND lsr.org_id = $2
    `;
    
    const params = [modelId, orgId];
    
    if (activeOnly) {
      query += ` AND lsr.is_active = true`;
    }
    
    query += ` ORDER BY lsr.priority ASC, lsr.created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Create a scoring rule
   */
  async createRule(modelId, orgId, data, userId = null) {
    const {
      name,
      description,
      rule_type,
      conditions,
      score_change,
      is_active = true,
      priority = 0
    } = data;
    
    const result = await db.query(
      `INSERT INTO lead_scoring_rules 
       (model_id, org_id, name, description, rule_type, conditions, score_change, is_active, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [modelId, orgId, name, description, rule_type, JSON.stringify(conditions), score_change, is_active, priority, userId]
    );
    
    return result.rows[0];
  }

  /**
   * Update a scoring rule
   */
  async updateRule(ruleId, orgId, data) {
    const { name, description, rule_type, conditions, score_change, is_active, priority } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (rule_type !== undefined) {
      updates.push(`rule_type = $${paramCount++}`);
      values.push(rule_type);
    }
    if (conditions !== undefined) {
      updates.push(`conditions = $${paramCount++}`);
      values.push(JSON.stringify(conditions));
    }
    if (score_change !== undefined) {
      updates.push(`score_change = $${paramCount++}`);
      values.push(score_change);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    
    updates.push(`updated_at = now()`);
    values.push(ruleId, orgId);
    
    const result = await db.query(
      `UPDATE lead_scoring_rules 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND org_id = $${paramCount++}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Delete a scoring rule
   */
  async deleteRule(ruleId, orgId) {
    await db.query(
      `DELETE FROM lead_scoring_rules WHERE id = $1 AND org_id = $2`,
      [ruleId, orgId]
    );
    
    return { success: true };
  }

  /**
   * Evaluate a single rule against contact data
   */
  evaluateRule(rule, contactData, activityData = {}) {
    const conditions = rule.conditions || [];
    
    // All conditions must be met for rule to apply
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      let fieldValue;
      
      // Get field value from contact or activity data
      if (field.startsWith('activity.')) {
        const activityField = field.replace('activity.', '');
        fieldValue = activityData[activityField];
      } else if (field === 'activity_type' || field === 'activity_data') {
        fieldValue = activityData[field];
      } else {
        fieldValue = contactData[field];
      }
      
      // Evaluate condition
      let conditionMet = false;
      
      switch (operator) {
        case 'equals':
          conditionMet = fieldValue === value;
          break;
        case 'not_equals':
          conditionMet = fieldValue !== value;
          break;
        case 'contains':
          conditionMet = String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'not_contains':
          conditionMet = !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'greater_than':
          conditionMet = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          conditionMet = Number(fieldValue) < Number(value);
          break;
        case 'greater_than_or_equal':
          conditionMet = Number(fieldValue) >= Number(value);
          break;
        case 'less_than_or_equal':
          conditionMet = Number(fieldValue) <= Number(value);
          break;
        case 'is_empty':
          conditionMet = !fieldValue || fieldValue === '';
          break;
        case 'is_not_empty':
          conditionMet = fieldValue && fieldValue !== '';
          break;
        case 'in':
          conditionMet = Array.isArray(value) && value.includes(fieldValue);
          break;
        case 'not_in':
          conditionMet = Array.isArray(value) && !value.includes(fieldValue);
          break;
        default:
          conditionMet = false;
      }
      
      if (!conditionMet) {
        return false; // Rule doesn't apply
      }
    }
    
    return true; // All conditions met
  }

  /**
   * Calculate score for a contact
   */
  async calculateContactScore(contactId, orgId, modelId = null, options = {}) {
    const { triggeredBy = 'manual', userId = null, reason = null } = options;
    
    // Get model
    if (!modelId) {
      const defaultModel = await this.getDefaultModel(orgId);
      modelId = defaultModel.id;
    }
    
    // Get contact data
    const contactResult = await db.query(
      `SELECT * FROM contacts WHERE id = $1 AND org_id = $2`,
      [contactId, orgId]
    );
    
    if (contactResult.rows.length === 0) {
      throw new Error('Contact not found');
    }
    
    const contact = contactResult.rows[0];
    
    // Get contact's activities
    const activitiesResult = await db.query(
      `SELECT * FROM lead_scoring_activities WHERE contact_id = $1 AND org_id = $2`,
      [contactId, orgId]
    );
    const activities = activitiesResult.rows;
    
    // Get active rules for model
    const rules = await this.getRules(modelId, orgId, { activeOnly: true });
    
    // Get current score
    const currentScoreResult = await db.query(
      `SELECT * FROM contact_scores WHERE contact_id = $1 AND model_id = $2`,
      [contactId, modelId]
    );
    
    const previousScore = currentScoreResult.rows.length > 0 
      ? currentScoreResult.rows[0].total_score 
      : 0;
    
    // Calculate new score
    let newScore = 0;
    let demographicScore = 0;
    let behavioralScore = 0;
    let engagementScore = 0;
    
    const appliedRules = [];
    
    for (const rule of rules) {
      let ruleMatched = false;
      const isActivityRule = ['activity', 'behavioral', 'engagement'].includes(rule.rule_type);

      if (isActivityRule) {
        if (activities && activities.length > 0) {
          for (const activity of activities) {
            if (this.evaluateRule(rule, contact, activity)) {
              ruleMatched = true;
              break;
            }
          }
        }
      } else {
        ruleMatched = this.evaluateRule(rule, contact, {});
      }

      if (ruleMatched) {
        newScore += rule.score_change;
        
        // Track by type
        if (rule.rule_type === 'demographic') {
          demographicScore += rule.score_change;
        } else if (rule.rule_type === 'behavioral' || rule.rule_type === 'activity') {
          behavioralScore += rule.score_change;
        } else if (rule.rule_type === 'engagement') {
          engagementScore += rule.score_change;
        }
        
        appliedRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          score_change: rule.score_change
        });
      }
    }
    
    // Ensure score doesn't go negative
    newScore = Math.max(0, newScore);
    
    // Update or insert contact score
    if (currentScoreResult.rows.length > 0) {
      await db.query(
        `UPDATE contact_scores 
         SET total_score = $1, demographic_score = $2, behavioral_score = $3, 
             engagement_score = $4, last_score_change = $5, last_scored_at = now(), updated_at = now()
         WHERE contact_id = $6 AND model_id = $7`,
        [newScore, demographicScore, behavioralScore, engagementScore, newScore - previousScore, contactId, modelId]
      );
    } else {
      await db.query(
        `INSERT INTO contact_scores 
         (contact_id, model_id, org_id, total_score, demographic_score, behavioral_score, engagement_score, last_score_change)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [contactId, modelId, orgId, newScore, demographicScore, behavioralScore, engagementScore, newScore - previousScore]
      );
    }
    
    // Record history
    if (newScore !== previousScore) {
      await db.query(
        `INSERT INTO contact_score_history 
         (contact_id, model_id, org_id, score_change, previous_score, new_score, reason, triggered_by, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          contactId, 
          modelId, 
          orgId, 
          newScore - previousScore, 
          previousScore, 
          newScore, 
          reason || 'Score recalculation', 
          triggeredBy,
          JSON.stringify({ applied_rules: appliedRules }),
          userId
        ]
      );
      
      // Check thresholds and send notifications if needed
      await this.checkThresholds(contactId, modelId, orgId, previousScore, newScore);
    }
    
    return {
      contact_id: contactId,
      model_id: modelId,
      previous_score: previousScore,
      new_score: newScore,
      score_change: newScore - previousScore,
      demographic_score: demographicScore,
      behavioral_score: behavioralScore,
      engagement_score: engagementScore,
      applied_rules: appliedRules
    };
  }

  /**
   * Bulk calculate scores for multiple contacts
   */
  async bulkCalculateScores(orgId, modelId = null, options = {}) {
    const { contactIds = null, limit = 100 } = options;
    
    let query = `SELECT id FROM contacts WHERE org_id = $1`;
    const params = [orgId];
    
    if (contactIds && contactIds.length > 0) {
      query += ` AND id = ANY($2)`;
      params.push(contactIds);
    }
    
    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    const contacts = result.rows;
    
    const results = [];
    for (const contact of contacts) {
      try {
        const score = await this.calculateContactScore(
          contact.id, 
          orgId, 
          modelId,
          { triggeredBy: 'bulk_calculation' }
        );
        results.push(score);
      } catch (error) {
        results.push({
          contact_id: contact.id,
          error: error.message
        });
      }
    }
    
    return {
      total_processed: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results
    };
  }

  /**
   * Get contact score
   */
  async getContactScore(contactId, orgId, modelId = null) {
    if (!modelId) {
      const defaultModel = await this.getDefaultModel(orgId);
      modelId = defaultModel.id;
    }
    
    const result = await db.query(
      `SELECT cs.*, lsm.name as model_name,
              (SELECT name FROM lead_scoring_thresholds 
               WHERE model_id = cs.model_id 
               AND min_score <= cs.total_score 
               AND (max_score IS NULL OR max_score >= cs.total_score)
               ORDER BY min_score DESC LIMIT 1) as threshold_name
       FROM contact_scores cs
       JOIN lead_scoring_models lsm ON lsm.id = cs.model_id
       WHERE cs.contact_id = $1 AND cs.org_id = $2 AND cs.model_id = $3`,
      [contactId, orgId, modelId]
    );
    
    if (result.rows.length === 0) {
      // Calculate score if not exists
      await this.calculateContactScore(contactId, orgId, modelId);
      return await this.getContactScore(contactId, orgId, modelId);
    }
    
    return result.rows[0];
  }

  /**
   * Get contact score history
   */
  async getContactScoreHistory(contactId, orgId, options = {}) {
    const { modelId = null, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT csh.*, lsr.name as rule_name, u.full_name as created_by_name
      FROM contact_score_history csh
      LEFT JOIN lead_scoring_rules lsr ON lsr.id = csh.rule_id
      LEFT JOIN users u ON u.id = csh.created_by
      WHERE csh.contact_id = $1 AND csh.org_id = $2
    `;
    
    const params = [contactId, orgId];
    
    if (modelId) {
      query += ` AND csh.model_id = $${params.length + 1}`;
      params.push(modelId);
    }
    
    query += ` ORDER BY csh.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get thresholds for a model
   */
  async getThresholds(modelId, orgId) {
    const result = await db.query(
      `SELECT * FROM lead_scoring_thresholds 
       WHERE model_id = $1 AND org_id = $2
       ORDER BY min_score ASC`,
      [modelId, orgId]
    );
    
    return result.rows;
  }

  /**
   * Create a threshold
   */
  async createThreshold(modelId, orgId, data) {
    const { name, min_score, max_score, color, notify_on_reach, notification_config } = data;
    
    const result = await db.query(
      `INSERT INTO lead_scoring_thresholds 
       (model_id, org_id, name, min_score, max_score, color, notify_on_reach, notification_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [modelId, orgId, name, min_score, max_score, color, notify_on_reach, JSON.stringify(notification_config || {})]
    );
    
    return result.rows[0];
  }

  /**
   * Update a threshold
   */
  async updateThreshold(thresholdId, orgId, data) {
    const { name, min_score, max_score, color, notify_on_reach, notification_config } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (min_score !== undefined) {
      updates.push(`min_score = $${paramCount++}`);
      values.push(min_score);
    }
    if (max_score !== undefined) {
      updates.push(`max_score = $${paramCount++}`);
      values.push(max_score);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (notify_on_reach !== undefined) {
      updates.push(`notify_on_reach = $${paramCount++}`);
      values.push(notify_on_reach);
    }
    if (notification_config !== undefined) {
      updates.push(`notification_config = $${paramCount++}`);
      values.push(JSON.stringify(notification_config));
    }
    
    updates.push(`updated_at = now()`);
    values.push(thresholdId, orgId);
    
    const result = await db.query(
      `UPDATE lead_scoring_thresholds 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND org_id = $${paramCount++}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Delete a threshold
   */
  async deleteThreshold(thresholdId, orgId) {
    await db.query(
      `DELETE FROM lead_scoring_thresholds WHERE id = $1 AND org_id = $2`,
      [thresholdId, orgId]
    );
    
    return { success: true };
  }

  /**
   * Check if score crossed any thresholds and send notifications
   */
  async checkThresholds(contactId, modelId, orgId, previousScore, newScore) {
    const thresholds = await this.getThresholds(modelId, orgId);
    
    for (const threshold of thresholds) {
      if (!threshold.notify_on_reach) continue;
      
      const crossedThreshold = 
        previousScore < threshold.min_score && 
        newScore >= threshold.min_score &&
        (threshold.max_score === null || newScore <= threshold.max_score);
      
      if (crossedThreshold) {
        // TODO: Send notification via notification service
        console.log(`Contact ${contactId} reached threshold: ${threshold.name} (${newScore} points)`);
      }
    }
  }

  /**
   * Get scoring analytics
   */
  async getAnalytics(orgId, modelId, options = {}) {
    const { startDate = null, endDate = null } = options;
    
    // Get score distribution
    const distributionResult = await db.query(
      `SELECT 
         CASE 
           WHEN total_score BETWEEN 0 AND 20 THEN '0-20'
           WHEN total_score BETWEEN 21 AND 40 THEN '21-40'
           WHEN total_score BETWEEN 41 AND 60 THEN '41-60'
           WHEN total_score BETWEEN 61 AND 80 THEN '61-80'
           ELSE '81-100'
         END as score_range,
         COUNT(*) as count
       FROM contact_scores
       WHERE org_id = $1 AND model_id = $2
       GROUP BY score_range
       ORDER BY score_range`,
      [orgId, modelId]
    );
    
    // Get threshold distribution
    const thresholdResult = await db.query(
      `SELECT 
         lst.name,
         lst.color,
         COUNT(cs.id) as count
       FROM lead_scoring_thresholds lst
       LEFT JOIN contact_scores cs ON 
         cs.model_id = lst.model_id AND
         cs.total_score >= lst.min_score AND
         (lst.max_score IS NULL OR cs.total_score <= lst.max_score)
       WHERE lst.org_id = $1 AND lst.model_id = $2
       GROUP BY lst.id, lst.name, lst.color, lst.min_score
       ORDER BY lst.min_score`,
      [orgId, modelId]
    );
    
    // Get summary stats
    const statsResult = await db.query(
      `SELECT 
         COUNT(*) as total_contacts,
         AVG(total_score) as avg_score,
         MAX(total_score) as max_score,
         MIN(total_score) as min_score
       FROM contact_scores
       WHERE org_id = $1 AND model_id = $2`,
      [orgId, modelId]
    );
    
    return {
      summary: statsResult.rows[0],
      score_distribution: distributionResult.rows,
      threshold_distribution: thresholdResult.rows
    };
  }

  /**
   * Record activity for behavioral scoring
   */
  async recordActivity(contactId, orgId, activityType, activityData = {}) {
    // Insert activity
    await db.query(
      `INSERT INTO lead_scoring_activities 
       (contact_id, org_id, activity_type, activity_data)
       VALUES ($1, $2, $3, $4)`,
      [contactId, orgId, activityType, JSON.stringify(activityData)]
    );
    
    // Trigger score recalculation
    const defaultModel = await this.getDefaultModel(orgId);
    await this.calculateContactScore(contactId, orgId, defaultModel.id, {
      triggeredBy: 'activity',
      reason: `Activity: ${activityType}`
    });
  }
}

module.exports = new LeadScoringService();
