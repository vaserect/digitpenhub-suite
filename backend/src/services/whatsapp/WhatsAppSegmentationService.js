const db = require('../../db');
const BaseService = require('../base/BaseService');

/**
 * WhatsAppSegmentationService
 * 
 * Dynamic contact segmentation engine for WhatsApp Marketing.
 * Reuses proven architecture from SMS/Email segmentation.
 * 
 * Features:
 * - 10+ condition types (status, tags, dates, counts, custom fields)
 * - Dynamic SQL generation for complex queries
 * - Real-time contact counting
 * - Support for AND/OR logic
 * - Custom field filtering
 * 
 * Benchmark: WhatsApp Business API best practices
 */
class WhatsAppSegmentationService extends BaseService {
  constructor() {
    super('whatsapp_segments');
  }

  /**
   * Create a new segment with conditions
   */
  async createSegment(orgId, data) {
    const { name, description, conditions = [], matchType = 'all' } = data;

    if (!name?.trim()) {
      throw new Error('Segment name is required');
    }

    if (!Array.isArray(conditions)) {
      throw new Error('Conditions must be an array');
    }

    // Validate conditions
    this._validateConditions(conditions);

    const { rows } = await db.query(
      `INSERT INTO whatsapp_segments (org_id, name, description, conditions, match_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, name.trim(), description || null, JSON.stringify(conditions), matchType]
    );

    const segment = rows[0];

    // Calculate initial contact count
    await this.recalculateSegment(orgId, segment.id);

    return this.getSegment(orgId, segment.id);
  }

  /**
   * Update segment conditions
   */
  async updateSegment(orgId, segmentId, data) {
    const { name, description, conditions, matchType } = data;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }

    if (conditions !== undefined) {
      if (!Array.isArray(conditions)) {
        throw new Error('Conditions must be an array');
      }
      this._validateConditions(conditions);
      updates.push(`conditions = $${paramIndex++}`);
      values.push(JSON.stringify(conditions));
    }

    if (matchType !== undefined) {
      updates.push(`match_type = $${paramIndex++}`);
      values.push(matchType);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(segmentId, orgId);

    const { rows } = await db.query(
      `UPDATE whatsapp_segments 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Segment not found');
    }

    // Recalculate contact count if conditions changed
    if (conditions !== undefined) {
      await this.recalculateSegment(orgId, segmentId);
    }

    return this.getSegment(orgId, segmentId);
  }

  /**
   * Get segment by ID
   */
  async getSegment(orgId, segmentId) {
    const { rows } = await db.query(
      `SELECT * FROM whatsapp_segments WHERE id = $1 AND org_id = $2`,
      [segmentId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Segment not found');
    }

    return rows[0];
  }

  /**
   * List all segments for organization
   */
  async listSegments(orgId) {
    const { rows } = await db.query(
      `SELECT * FROM whatsapp_segments 
       WHERE org_id = $1 
       ORDER BY name`,
      [orgId]
    );

    return rows;
  }

  /**
   * Delete segment
   */
  async deleteSegment(orgId, segmentId) {
    const { rowCount } = await db.query(
      `DELETE FROM whatsapp_segments WHERE id = $1 AND org_id = $2`,
      [segmentId, orgId]
    );

    if (rowCount === 0) {
      throw new Error('Segment not found');
    }

    return { success: true };
  }

  /**
   * Get contacts matching segment conditions
   */
  async getSegmentContacts(orgId, segmentId, options = {}) {
    const segment = await this.getSegment(orgId, segmentId);
    const { limit = 100, offset = 0 } = options;

    const { sql, params } = this._buildSegmentQuery(orgId, segment.conditions, segment.match_type);

    const query = `
      SELECT * FROM whatsapp_contacts
      WHERE org_id = $1 AND (${sql})
      ORDER BY name
      LIMIT $${params.length + 2} OFFSET $${params.length + 3}
    `;

    const { rows } = await db.query(query, [orgId, ...params, limit, offset]);

    return rows;
  }

  /**
   * Recalculate contact count for segment
   */
  async recalculateSegment(orgId, segmentId) {
    const segment = await this.getSegment(orgId, segmentId);

    const { sql, params } = this._buildSegmentQuery(orgId, segment.conditions, segment.match_type);

    const countQuery = `
      SELECT COUNT(*)::int as count
      FROM whatsapp_contacts
      WHERE org_id = $1 AND (${sql})
    `;

    const { rows } = await db.query(countQuery, [orgId, ...params]);
    const count = rows[0].count;

    await db.query(
      `UPDATE whatsapp_segments 
       SET contact_count = $1, last_calculated_at = NOW()
       WHERE id = $2 AND org_id = $3`,
      [count, segmentId, orgId]
    );

    return count;
  }

  /**
   * Recalculate all segments for organization
   */
  async recalculateAllSegments(orgId) {
    const segments = await this.listSegments(orgId);

    for (const segment of segments) {
      await this.recalculateSegment(orgId, segment.id);
    }

    return { recalculated: segments.length };
  }

  /**
   * Build SQL query from segment conditions
   * @private
   */
  _buildSegmentQuery(orgId, conditions, matchType) {
    if (!conditions || conditions.length === 0) {
      return { sql: 'TRUE', params: [] };
    }

    const clauses = [];
    const params = [];
    let paramIndex = 2; // Start at 2 because $1 is orgId

    for (const condition of conditions) {
      const { field, operator, value } = condition;

      let clause = '';

      switch (field) {
        case 'status':
          clause = this._buildStatusCondition(operator, value, paramIndex);
          break;

        case 'tags':
          clause = this._buildTagsCondition(operator, value, paramIndex);
          break;

        case 'created_at':
        case 'last_message_at':
        case 'opted_in_at':
        case 'opted_out_at':
          clause = this._buildDateCondition(field, operator, value, paramIndex);
          break;

        case 'message_count':
          clause = this._buildNumberCondition(field, operator, value, paramIndex);
          break;

        case 'phone':
        case 'name':
        case 'email':
        case 'business_name':
          clause = this._buildTextCondition(field, operator, value, paramIndex);
          break;

        default:
          // Custom field
          if (field.startsWith('custom_fields.')) {
            clause = this._buildCustomFieldCondition(field, operator, value, paramIndex);
          } else {
            throw new Error(`Unsupported field: ${field}`);
          }
      }

      if (clause) {
        clauses.push(clause);
        params.push(value);
        paramIndex++;
      }
    }

    const logic = matchType === 'any' ? ' OR ' : ' AND ';
    const sql = clauses.length > 0 ? clauses.join(logic) : 'TRUE';

    return { sql, params };
  }

  /**
   * Build status condition
   * @private
   */
  _buildStatusCondition(operator, value, paramIndex) {
    switch (operator) {
      case 'equals':
        return `status = $${paramIndex}`;
      case 'not_equals':
        return `status != $${paramIndex}`;
      case 'in':
        return `status = ANY($${paramIndex}::text[])`;
      case 'not_in':
        return `status != ALL($${paramIndex}::text[])`;
      default:
        throw new Error(`Unsupported operator for status: ${operator}`);
    }
  }

  /**
   * Build tags condition
   * @private
   */
  _buildTagsCondition(operator, value, paramIndex) {
    switch (operator) {
      case 'contains':
        return `$${paramIndex} = ANY(tags)`;
      case 'not_contains':
        return `NOT ($${paramIndex} = ANY(tags))`;
      case 'contains_any':
        return `tags && $${paramIndex}::text[]`;
      case 'contains_all':
        return `tags @> $${paramIndex}::text[]`;
      default:
        throw new Error(`Unsupported operator for tags: ${operator}`);
    }
  }

  /**
   * Build date condition
   * @private
   */
  _buildDateCondition(field, operator, value, paramIndex) {
    switch (operator) {
      case 'equals':
        return `DATE(${field}) = DATE($${paramIndex}::timestamptz)`;
      case 'not_equals':
        return `DATE(${field}) != DATE($${paramIndex}::timestamptz)`;
      case 'greater_than':
        return `${field} > $${paramIndex}::timestamptz`;
      case 'less_than':
        return `${field} < $${paramIndex}::timestamptz`;
      case 'greater_than_or_equal':
        return `${field} >= $${paramIndex}::timestamptz`;
      case 'less_than_or_equal':
        return `${field} <= $${paramIndex}::timestamptz`;
      case 'is_null':
        return `${field} IS NULL`;
      case 'is_not_null':
        return `${field} IS NOT NULL`;
      case 'in_last_days':
        return `${field} >= NOW() - INTERVAL '${parseInt(value)} days'`;
      case 'not_in_last_days':
        return `${field} < NOW() - INTERVAL '${parseInt(value)} days'`;
      default:
        throw new Error(`Unsupported operator for date: ${operator}`);
    }
  }

  /**
   * Build number condition
   * @private
   */
  _buildNumberCondition(field, operator, value, paramIndex) {
    switch (operator) {
      case 'equals':
        return `${field} = $${paramIndex}::int`;
      case 'not_equals':
        return `${field} != $${paramIndex}::int`;
      case 'greater_than':
        return `${field} > $${paramIndex}::int`;
      case 'less_than':
        return `${field} < $${paramIndex}::int`;
      case 'greater_than_or_equal':
        return `${field} >= $${paramIndex}::int`;
      case 'less_than_or_equal':
        return `${field} <= $${paramIndex}::int`;
      default:
        throw new Error(`Unsupported operator for number: ${operator}`);
    }
  }

  /**
   * Build text condition
   * @private
   */
  _buildTextCondition(field, operator, value, paramIndex) {
    switch (operator) {
      case 'equals':
        return `${field} = $${paramIndex}`;
      case 'not_equals':
        return `${field} != $${paramIndex}`;
      case 'contains':
        return `${field} ILIKE '%' || $${paramIndex} || '%'`;
      case 'not_contains':
        return `${field} NOT ILIKE '%' || $${paramIndex} || '%'`;
      case 'starts_with':
        return `${field} ILIKE $${paramIndex} || '%'`;
      case 'ends_with':
        return `${field} ILIKE '%' || $${paramIndex}`;
      case 'is_null':
        return `${field} IS NULL`;
      case 'is_not_null':
        return `${field} IS NOT NULL`;
      default:
        throw new Error(`Unsupported operator for text: ${operator}`);
    }
  }

  /**
   * Build custom field condition
   * @private
   */
  _buildCustomFieldCondition(field, operator, value, paramIndex) {
    const fieldPath = field.replace('custom_fields.', '');

    switch (operator) {
      case 'equals':
        return `custom_fields->>'${fieldPath}' = $${paramIndex}`;
      case 'not_equals':
        return `custom_fields->>'${fieldPath}' != $${paramIndex}`;
      case 'contains':
        return `custom_fields->>'${fieldPath}' ILIKE '%' || $${paramIndex} || '%'`;
      case 'not_contains':
        return `custom_fields->>'${fieldPath}' NOT ILIKE '%' || $${paramIndex} || '%'`;
      case 'exists':
        return `custom_fields ? '${fieldPath}'`;
      case 'not_exists':
        return `NOT (custom_fields ? '${fieldPath}')`;
      default:
        throw new Error(`Unsupported operator for custom field: ${operator}`);
    }
  }

  /**
   * Validate segment conditions
   * @private
   */
  _validateConditions(conditions) {
    const validFields = [
      'status', 'tags', 'created_at', 'last_message_at', 'opted_in_at', 'opted_out_at',
      'message_count', 'phone', 'name', 'email', 'business_name'
    ];

    const validOperators = [
      'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
      'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
      'in', 'not_in', 'contains_any', 'contains_all', 'is_null', 'is_not_null',
      'in_last_days', 'not_in_last_days', 'exists', 'not_exists'
    ];

    for (const condition of conditions) {
      if (!condition.field) {
        throw new Error('Condition field is required');
      }

      if (!condition.operator) {
        throw new Error('Condition operator is required');
      }

      if (!validOperators.includes(condition.operator)) {
        throw new Error(`Invalid operator: ${condition.operator}`);
      }

      // Allow custom fields
      if (!validFields.includes(condition.field) && !condition.field.startsWith('custom_fields.')) {
        throw new Error(`Invalid field: ${condition.field}`);
      }

      // Value is required for most operators
      if (!['is_null', 'is_not_null', 'exists', 'not_exists'].includes(condition.operator)) {
        if (condition.value === undefined || condition.value === null) {
          throw new Error(`Value is required for operator: ${condition.operator}`);
        }
      }
    }
  }
}

module.exports = new WhatsAppSegmentationService();
