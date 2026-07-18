const db = require('../db');
const BaseService = require('./base/BaseService');

/**
 * Customer Segmentation Engine Service
 * Handles segment creation, rule evaluation, member calculation, and analytics
 * Benchmark: Segment / Klaviyo Segmentation
 */
class SegmentationService extends BaseService {
  constructor() {
    super('segments');
  }

  // ==================== SEGMENTS ====================

  /**
   * Create a new segment
   */
  async createSegment(orgId, userId, segmentData) {
    const {
      name, description, criteria_json, is_dynamic, refresh_frequency
    } = segmentData;

    const { rows } = await db.query(
      `INSERT INTO segments (
        org_id, name, description, criteria_json, is_dynamic, 
        refresh_frequency, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        orgId, name, description || null, 
        JSON.stringify(criteria_json || {}),
        is_dynamic !== false, refresh_frequency || 'realtime', userId
      ]
    );

    const segment = rows[0];

    // Calculate initial membership if dynamic
    if (segment.is_dynamic) {
      await this.calculateSegmentMembers(orgId, segment.id);
    }

    return segment;
  }

  /**
   * Get all segments for an organization
   */
  async getSegments(orgId, filters = {}) {
    const { is_active, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM segments WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

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
   * Get a single segment by ID
   */
  async getSegment(orgId, segmentId) {
    const { rows } = await db.query(
      'SELECT * FROM segments WHERE id = $1 AND org_id = $2',
      [segmentId, orgId]
    );
    return rows[0];
  }

  /**
   * Update a segment
   */
  async updateSegment(orgId, segmentId, updates) {
    const allowedFields = [
      'name', 'description', 'criteria_json', 'is_dynamic', 
      'refresh_frequency', 'is_active'
    ];

    const setClause = [];
    const values = [orgId, segmentId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        let value = updates[key];
        
        if (key === 'criteria_json') {
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
      `UPDATE segments SET ${setClause.join(', ')} 
       WHERE org_id = $1 AND id = $2 RETURNING *`,
      values
    );

    const segment = rows[0];

    // Recalculate if criteria changed
    if (updates.criteria_json && segment.is_dynamic) {
      await this.calculateSegmentMembers(orgId, segmentId);
    }

    return segment;
  }

  /**
   * Delete a segment
   */
  async deleteSegment(orgId, segmentId) {
    await db.query(
      'DELETE FROM segments WHERE id = $1 AND org_id = $2',
      [segmentId, orgId]
    );
    return { success: true };
  }

  // ==================== SEGMENT CALCULATION ====================

  /**
   * Calculate segment members based on criteria
   */
  async calculateSegmentMembers(orgId, segmentId) {
    const calculation = await this.startCalculation(segmentId);

    try {
      const segment = await this.getSegment(orgId, segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      const criteria = segment.criteria_json;
      const contacts = await this.evaluateSegmentCriteria(orgId, criteria);

      // Get current members
      const { rows: currentMembers } = await db.query(
        'SELECT entity_id FROM segment_members WHERE segment_id = $1 AND entity_type = $2',
        [segmentId, 'contact']
      );
      const currentMemberIds = new Set(currentMembers.map(m => m.entity_id));

      // Calculate additions and removals
      const newMemberIds = new Set(contacts.map(c => c.id));
      const toAdd = contacts.filter(c => !currentMemberIds.has(c.id));
      const toRemove = Array.from(currentMemberIds).filter(id => !newMemberIds.has(id));

      // Add new members
      for (const contact of toAdd) {
        await db.query(
          `INSERT INTO segment_members (segment_id, entity_type, entity_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [segmentId, 'contact', contact.id]
        );

        // Log event
        await this.logSegmentEvent(segmentId, contact.id, 'added', 'calculation');
      }

      // Remove old members
      for (const contactId of toRemove) {
        await db.query(
          `DELETE FROM segment_members 
           WHERE segment_id = $1 AND entity_type = $2 AND entity_id = $3`,
          [segmentId, 'contact', contactId]
        );

        // Log event
        await this.logSegmentEvent(segmentId, contactId, 'removed', 'calculation');
      }

      // Update segment member count
      await db.query(
        `UPDATE segments SET member_count = $1, last_calculated = NOW(), last_refresh_at = NOW()
         WHERE id = $2`,
        [newMemberIds.size, segmentId]
      );

      // Record history
      await this.recordSegmentHistory(segmentId, newMemberIds.size, toAdd.length, toRemove.length);

      // Complete calculation
      await this.completeCalculation(calculation.id, toAdd.length, toRemove.length);

      return {
        total: newMemberIds.size,
        added: toAdd.length,
        removed: toRemove.length
      };
    } catch (error) {
      await this.failCalculation(calculation.id, error.message);
      throw error;
    }
  }

  /**
   * Evaluate segment criteria against contacts
   */
  async evaluateSegmentCriteria(orgId, criteria) {
    if (!criteria || !criteria.conditions || criteria.conditions.length === 0) {
      // No criteria = all contacts
      const { rows } = await db.query(
        'SELECT id FROM contacts WHERE org_id = $1',
        [orgId]
      );
      return rows;
    }

    // Build SQL query from criteria
    const { query, params } = this.buildSegmentQuery(orgId, criteria);
    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Build SQL query from segment criteria
   */
  buildSegmentQuery(orgId, criteria) {
    let query = 'SELECT DISTINCT c.id FROM contacts c WHERE c.org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    const conditions = criteria.conditions || [];
    const logicalOp = criteria.logical_operator || 'AND';

    if (conditions.length > 0) {
      const whereClauses = [];

      for (const condition of conditions) {
        const { field, operator, value } = condition;
        
        if (!field || !operator) continue;

        paramCount++;
        const clause = this.buildConditionClause(field, operator, value, paramCount);
        if (clause) {
          whereClauses.push(clause.sql);
          if (clause.value !== undefined) {
            params.push(clause.value);
          } else {
            paramCount--; // Didn't use the param
          }
        }
      }

      if (whereClauses.length > 0) {
        query += ` AND (${whereClauses.join(` ${logicalOp} `)})`;
      }
    }

    return { query, params };
  }

  /**
   * Build SQL clause for a single condition
   */
  buildConditionClause(field, operator, value, paramIndex) {
    const fieldMap = {
      'email': 'c.email',
      'name': 'c.name',
      'created_at': 'c.created_at',
      'updated_at': 'c.updated_at',
      'tags': 'c.tags',
      'status': 'c.status'
    };

    const sqlField = fieldMap[field] || `c.${field}`;

    switch (operator) {
      case 'equals':
        return { sql: `${sqlField} = $${paramIndex}`, value };
      case 'not_equals':
        return { sql: `${sqlField} != $${paramIndex}`, value };
      case 'contains':
        return { sql: `${sqlField} ILIKE $${paramIndex}`, value: `%${value}%` };
      case 'not_contains':
        return { sql: `${sqlField} NOT ILIKE $${paramIndex}`, value: `%${value}%` };
      case 'starts_with':
        return { sql: `${sqlField} ILIKE $${paramIndex}`, value: `${value}%` };
      case 'ends_with':
        return { sql: `${sqlField} ILIKE $${paramIndex}`, value: `%${value}` };
      case 'is_null':
        return { sql: `${sqlField} IS NULL` };
      case 'is_not_null':
        return { sql: `${sqlField} IS NOT NULL` };
      case 'greater_than':
        return { sql: `${sqlField} > $${paramIndex}`, value };
      case 'less_than':
        return { sql: `${sqlField} < $${paramIndex}`, value };
      case 'within_last':
        return { sql: `${sqlField} >= NOW() - INTERVAL '${parseInt(value)} days'` };
      case 'in':
        return { sql: `${sqlField} = ANY($${paramIndex})`, value };
      default:
        return null;
    }
  }

  // ==================== SEGMENT MEMBERS ====================

  /**
   * Get members of a segment
   */
  async getSegmentMembers(orgId, segmentId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const { rows } = await db.query(
      `SELECT c.* FROM contacts c
       JOIN segment_members sm ON c.id = sm.entity_id::uuid
       WHERE sm.segment_id = $1 AND sm.entity_type = 'contact' AND c.org_id = $2
       ORDER BY sm.added_at DESC
       LIMIT $3 OFFSET $4`,
      [segmentId, orgId, limit, offset]
    );

    return rows;
  }

  /**
   * Preview segment members (without saving)
   */
  async previewSegment(orgId, criteria, limit = 100) {
    const contacts = await this.evaluateSegmentCriteria(orgId, criteria);
    return contacts.slice(0, limit);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get segment analytics
   */
  async getSegmentAnalytics(orgId, segmentId, dateRange = {}) {
    const { start_date, end_date } = dateRange;
    
    let query = `
      SELECT 
        date,
        member_count,
        new_members,
        churned_members,
        growth_rate,
        engagement_rate,
        conversion_rate
      FROM segment_analytics_daily
      WHERE org_id = $1 AND segment_id = $2
    `;
    const params = [orgId, segmentId];
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

    query += ' ORDER BY date DESC';

    const { rows } = await db.query(query, params);
    return rows;
  }

  // ==================== TEMPLATES ====================

  /**
   * Get segment templates
   */
  async getTemplates(includeSystem = true) {
    let query = 'SELECT * FROM segment_templates WHERE 1=1';
    
    if (!includeSystem) {
      query += ' AND is_system = false';
    }

    query += ' ORDER BY category, name';

    const { rows } = await db.query(query);
    return rows;
  }

  /**
   * Create segment from template
   */
  async createFromTemplate(orgId, userId, templateId, name) {
    const { rows: templates } = await db.query(
      'SELECT * FROM segment_templates WHERE id = $1',
      [templateId]
    );

    if (templates.length === 0) {
      throw new Error('Template not found');
    }

    const template = templates[0];

    return this.createSegment(orgId, userId, {
      name: name || template.name,
      description: template.description,
      criteria_json: template.criteria_json,
      is_dynamic: true,
      refresh_frequency: 'realtime'
    });
  }

  // ==================== HELPER METHODS ====================

  async startCalculation(segmentId) {
    const { rows } = await db.query(
      `INSERT INTO segment_calculations (segment_id, status, started_at)
       VALUES ($1, 'running', NOW()) RETURNING *`,
      [segmentId]
    );
    return rows[0];
  }

  async completeCalculation(calculationId, membersAdded, membersRemoved) {
    const startTime = await db.query(
      'SELECT started_at FROM segment_calculations WHERE id = $1',
      [calculationId]
    );
    const duration = Date.now() - new Date(startTime.rows[0].started_at).getTime();

    await db.query(
      `UPDATE segment_calculations 
       SET status = 'completed', completed_at = NOW(), duration_ms = $1,
           members_added = $2, members_removed = $3
       WHERE id = $4`,
      [duration, membersAdded, membersRemoved, calculationId]
    );
  }

  async failCalculation(calculationId, errorMessage) {
    await db.query(
      `UPDATE segment_calculations 
       SET status = 'failed', completed_at = NOW(), error_message = $1
       WHERE id = $2`,
      [errorMessage, calculationId]
    );
  }

  async logSegmentEvent(segmentId, contactId, eventType, triggeredBy) {
    await db.query(
      `INSERT INTO segment_events (segment_id, contact_id, event_type, triggered_by)
       VALUES ($1, $2, $3, $4)`,
      [segmentId, contactId, eventType, triggeredBy]
    );
  }

  async recordSegmentHistory(segmentId, memberCount, addedCount, removedCount) {
    await db.query(
      `INSERT INTO segment_history (segment_id, member_count, added_count, removed_count)
       VALUES ($1, $2, $3, $4)`,
      [segmentId, memberCount, addedCount, removedCount]
    );
  }
}

module.exports = new SegmentationService();
