const BaseService = require('../base/BaseService');
const db = require('../../db');
const logger = require('../../utils/logger');

/**
 * SegmentationService - Dynamic subscriber segmentation
 * Benchmark: Mailchimp Segments, Klaviyo Lists & Segments
 */
class SegmentationService extends BaseService {
  constructor() {
    super({}, { serviceName: 'SegmentationService', logger });
  }

  /**
   * Create a new segment with conditions
   */
  async createSegment(orgId, data) {
    const { listId, name, description, conditions, matchType = 'all' } = data;
    
    if (!name?.trim()) {
      throw new Error('Segment name is required');
    }

    if (!Array.isArray(conditions) || conditions.length === 0) {
      throw new Error('At least one condition is required');
    }

    const { rows } = await db.query(
      `INSERT INTO email_segments (org_id, list_id, name, description, conditions, match_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, listId || null, name.trim(), description || null, JSON.stringify(conditions), matchType]
    );

    // Calculate initial membership
    await this.recalculateSegment(rows[0].id, orgId);

    return rows[0];
  }

  /**
   * List all segments for an organization
   */
  async listSegments(orgId, listId = null) {
    const query = listId
      ? `SELECT s.*, l.name as list_name
         FROM email_segments s
         LEFT JOIN email_lists l ON l.id = s.list_id
         WHERE s.org_id = $1 AND s.list_id = $2
         ORDER BY s.created_at DESC`
      : `SELECT s.*, l.name as list_name
         FROM email_segments s
         LEFT JOIN email_lists l ON l.id = s.list_id
         WHERE s.org_id = $1
         ORDER BY s.created_at DESC`;

    const params = listId ? [orgId, listId] : [orgId];
    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get segment details with member count
   */
  async getSegment(segmentId, orgId) {
    const { rows } = await db.query(
      `SELECT s.*, l.name as list_name,
              COUNT(sm.subscriber_id) as member_count
       FROM email_segments s
       LEFT JOIN email_lists l ON l.id = s.list_id
       LEFT JOIN email_segment_members sm ON sm.segment_id = s.id
       WHERE s.id = $1 AND s.org_id = $2
       GROUP BY s.id, l.name`,
      [segmentId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Segment not found');
    }

    return rows[0];
  }

  /**
   * Update segment conditions
   */
  async updateSegment(segmentId, orgId, data) {
    const { name, description, conditions, matchType } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (conditions !== undefined) {
      updates.push(`conditions = $${paramCount++}`);
      values.push(JSON.stringify(conditions));
    }
    if (matchType !== undefined) {
      updates.push(`match_type = $${paramCount++}`);
      values.push(matchType);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = now()`);
    values.push(segmentId, orgId);

    const { rows } = await db.query(
      `UPDATE email_segments
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND org_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Segment not found');
    }

    // Recalculate membership if conditions changed
    if (conditions !== undefined) {
      await this.recalculateSegment(segmentId, orgId);
    }

    return rows[0];
  }

  /**
   * Delete a segment
   */
  async deleteSegment(segmentId, orgId) {
    const { rows } = await db.query(
      `DELETE FROM email_segments WHERE id = $1 AND org_id = $2 RETURNING id`,
      [segmentId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Segment not found');
    }

    return true;
  }

  /**
   * Recalculate segment membership based on conditions
   */
  async recalculateSegment(segmentId, orgId) {
    const segment = await this.getSegment(segmentId, orgId);
    const conditions = segment.conditions;
    const matchType = segment.match_type;

    // Build SQL query from conditions
    const { whereClause, params } = this.buildConditionQuery(conditions, matchType, orgId, segment.list_id);

    // Clear existing members
    await db.query(`DELETE FROM email_segment_members WHERE segment_id = $1`, [segmentId]);

    // Insert new members
    const insertQuery = `
      INSERT INTO email_segment_members (segment_id, subscriber_id)
      SELECT $1, s.id
      FROM email_subscribers s
      WHERE ${whereClause}
    `;

    await db.query(insertQuery, [segmentId, ...params]);

    // Update subscriber count
    const { rows } = await db.query(
      `UPDATE email_segments
       SET subscriber_count = (SELECT COUNT(*) FROM email_segment_members WHERE segment_id = $1),
           last_calculated_at = now()
       WHERE id = $1
       RETURNING subscriber_count`,
      [segmentId]
    );

    logger.info(`Recalculated segment ${segmentId}: ${rows[0].subscriber_count} members`);

    return rows[0].subscriber_count;
  }

  /**
   * Build SQL WHERE clause from segment conditions
   * Supports: email contains, name contains, tag has, engagement score, last opened, custom fields
   */
  buildConditionQuery(conditions, matchType, orgId, listId) {
    const clauses = [];
    const params = [];
    let paramIndex = 1;

    // Base conditions
    clauses.push(`s.org_id = $${paramIndex++}`);
    params.push(orgId);

    if (listId) {
      clauses.push(`s.list_id = $${paramIndex++}`);
      params.push(listId);
    }

    clauses.push(`s.status = 'subscribed'`);

    // Build condition clauses
    const conditionClauses = conditions.map(cond => {
      const { field, operator, value } = cond;

      switch (field) {
        case 'email':
          if (operator === 'contains') {
            params.push(`%${value}%`);
            return `s.email ILIKE $${paramIndex++}`;
          } else if (operator === 'equals') {
            params.push(value);
            return `s.email = $${paramIndex++}`;
          }
          break;

        case 'name':
          if (operator === 'contains') {
            params.push(`%${value}%`);
            return `s.name ILIKE $${paramIndex++}`;
          }
          break;

        case 'tags':
          if (operator === 'has') {
            params.push(value);
            return `$${paramIndex++} = ANY(s.tags)`;
          } else if (operator === 'has_any') {
            params.push(value);
            return `s.tags && $${paramIndex++}::text[]`;
          }
          break;

        case 'engagement_score':
          params.push(parseInt(value, 10));
          if (operator === 'greater_than') {
            return `s.engagement_score > $${paramIndex++}`;
          } else if (operator === 'less_than') {
            return `s.engagement_score < $${paramIndex++}`;
          }
          break;

        case 'last_opened':
          if (operator === 'within_days') {
            params.push(parseInt(value, 10));
            return `s.last_opened_at > now() - interval '1 day' * $${paramIndex++}`;
          } else if (operator === 'not_within_days') {
            params.push(parseInt(value, 10));
            return `(s.last_opened_at IS NULL OR s.last_opened_at < now() - interval '1 day' * $${paramIndex++})`;
          }
          break;

        case 'subscribed_date':
          if (operator === 'after') {
            params.push(value);
            return `s.subscribed_at > $${paramIndex++}`;
          } else if (operator === 'before') {
            params.push(value);
            return `s.subscribed_at < $${paramIndex++}`;
          }
          break;

        default:
          logger.warn(`Unknown segment condition field: ${field}`);
          return null;
      }
    }).filter(Boolean);

    if (conditionClauses.length > 0) {
      const connector = matchType === 'all' ? ' AND ' : ' OR ';
      clauses.push(`(${conditionClauses.join(connector)})`);
    }

    return {
      whereClause: clauses.join(' AND '),
      params
    };
  }

  /**
   * Get segment members with pagination
   */
  async getSegmentMembers(segmentId, orgId, { limit = 50, offset = 0 } = {}) {
    const segment = await this.getSegment(segmentId, orgId);

    const { rows } = await db.query(
      `SELECT s.id, s.email, s.name, s.status, s.subscribed_at, s.engagement_score
       FROM email_segment_members sm
       JOIN email_subscribers s ON s.id = sm.subscriber_id
       WHERE sm.segment_id = $1
       ORDER BY sm.added_at DESC
       LIMIT $2 OFFSET $3`,
      [segmentId, limit, offset]
    );

    return {
      members: rows,
      total: segment.member_count || 0,
      limit,
      offset
    };
  }

  /**
   * Check if a subscriber matches segment conditions (real-time check)
   */
  async subscriberMatchesSegment(subscriberId, segmentId, orgId) {
    const segment = await this.getSegment(segmentId, orgId);
    const { whereClause, params } = this.buildConditionQuery(
      segment.conditions,
      segment.match_type,
      orgId,
      segment.list_id
    );

    const { rows } = await db.query(
      `SELECT EXISTS(
         SELECT 1 FROM email_subscribers s
         WHERE s.id = $1 AND ${whereClause}
       ) as matches`,
      [subscriberId, ...params]
    );

    return rows[0].matches;
  }
}

module.exports = SegmentationService;
