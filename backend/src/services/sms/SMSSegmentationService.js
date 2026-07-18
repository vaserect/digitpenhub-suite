const db = require('../../db');

/**
 * SMSSegmentationService
 * 
 * Dynamic SMS contact segmentation engine (mirrors EmailSegmentationService pattern).
 * Supports real-time and cached segment membership calculation based on flexible conditions.
 * 
 * Condition Types:
 * - phone: Phone number filters (equals, contains, starts_with, ends_with)
 * - name: Name filters (equals, contains, starts_with, ends_with)
 * - tag: Tag matching (has_tag, not_has_tag, has_any_tag, has_all_tags)
 * - engagement_score: Numeric comparison (gt, gte, lt, lte, eq)
 * - last_message_at: Date-based filters (before, after, between, days_ago)
 * - opt_in_date: Date-based filters (before, after, between, days_ago)
 * - custom_field: Custom field value matching (equals, contains, gt, lt, exists, not_exists)
 * - status: Contact status (equals, not_equals)
 * - total_messages_received: Numeric comparison
 * - total_clicks: Numeric comparison
 */
class SMSSegmentationService {
  /**
   * Create a new segment
   */
  async createSegment(orgId, { name, description, conditions, is_dynamic = true }) {
    const { rows } = await db.query(
      `INSERT INTO sms_segments (org_id, name, description, conditions, is_dynamic)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, name, description || null, JSON.stringify(conditions), is_dynamic]
    );

    const segment = rows[0];

    // Calculate initial membership
    if (is_dynamic) {
      await this.recalculateSegment(segment.id);
    }

    return segment;
  }

  /**
   * Update segment conditions and recalculate membership
   */
  async updateSegment(segmentId, orgId, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.conditions !== undefined) {
      setClauses.push(`conditions = $${paramIndex++}`);
      values.push(JSON.stringify(updates.conditions));
    }
    if (updates.is_dynamic !== undefined) {
      setClauses.push(`is_dynamic = $${paramIndex++}`);
      values.push(updates.is_dynamic);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(segmentId, orgId);

    const { rows } = await db.query(
      `UPDATE sms_segments SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND org_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Segment not found');
    }

    // Recalculate if dynamic and conditions changed
    if (rows[0].is_dynamic && updates.conditions !== undefined) {
      await this.recalculateSegment(segmentId);
    }

    return rows[0];
  }

  /**
   * Delete a segment
   */
  async deleteSegment(segmentId, orgId) {
    await db.query(
      `DELETE FROM sms_segments WHERE id = $1 AND org_id = $2`,
      [segmentId, orgId]
    );
  }

  /**
   * Get segment by ID
   */
  async getSegment(segmentId, orgId) {
    const { rows } = await db.query(
      `SELECT * FROM sms_segments WHERE id = $1 AND org_id = $2`,
      [segmentId, orgId]
    );
    return rows[0] || null;
  }

  /**
   * List all segments for an organization
   */
  async listSegments(orgId) {
    const { rows } = await db.query(
      `SELECT * FROM sms_segments WHERE org_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return rows;
  }

  /**
   * Recalculate segment membership based on conditions
   */
  async recalculateSegment(segmentId) {
    const segment = await db.query(
      `SELECT * FROM sms_segments WHERE id = $1`,
      [segmentId]
    );

    if (!segment.rows.length) {
      throw new Error('Segment not found');
    }

    const { org_id, conditions } = segment.rows[0];

    // Build WHERE clause from conditions
    const whereClause = this.buildWhereClause(conditions, org_id);

    // Get matching contacts
    const { rows: contacts } = await db.query(
      `SELECT id FROM sms_contacts WHERE ${whereClause}`
    );

    // Clear existing members
    await db.query(
      `DELETE FROM sms_segment_members WHERE segment_id = $1`,
      [segmentId]
    );

    // Insert new members
    if (contacts.length > 0) {
      const values = contacts.map((c, i) => `($1, $${i + 2})`).join(',');
      const params = [segmentId, ...contacts.map(c => c.id)];
      await db.query(
        `INSERT INTO sms_segment_members (segment_id, contact_id) VALUES ${values}`,
        params
      );
    }

    // Update member count and last calculated time
    await db.query(
      `UPDATE sms_segments SET member_count = $1, last_calculated = NOW()
       WHERE id = $2`,
      [contacts.length, segmentId]
    );

    return contacts.length;
  }

  /**
   * Build SQL WHERE clause from segment conditions
   */
  buildWhereClause(conditions, orgId) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return `org_id = '${orgId}'`;
    }

    const clauses = conditions.map(condition => {
      const { field, operator, value } = condition;

      switch (field) {
        case 'phone':
          return this.buildStringCondition('phone', operator, value);
        
        case 'name':
          return this.buildStringCondition('name', operator, value);
        
        case 'tag':
          return this.buildTagCondition(operator, value);
        
        case 'engagement_score':
          return this.buildNumericCondition('engagement_score', operator, value);
        
        case 'last_message_at':
          return this.buildDateCondition('last_message_at', operator, value);
        
        case 'opt_in_date':
          return this.buildDateCondition('opt_in_date', operator, value);
        
        case 'custom_field':
          return this.buildCustomFieldCondition(operator, value);
        
        case 'status':
          return this.buildStatusCondition(operator, value);
        
        case 'total_messages_received':
          return this.buildNumericCondition('total_messages_received', operator, value);
        
        case 'total_clicks':
          return this.buildNumericCondition('total_clicks', operator, value);
        
        default:
          return '1=1'; // Invalid condition, ignore
      }
    });

    return `org_id = '${orgId}' AND (${clauses.join(' AND ')})`;
  }

  /**
   * Build string field condition
   */
  buildStringCondition(field, operator, value) {
    const escapedValue = value.replace(/'/g, "''");
    
    switch (operator) {
      case 'equals':
        return `${field} = '${escapedValue}'`;
      case 'not_equals':
        return `${field} != '${escapedValue}'`;
      case 'contains':
        return `${field} ILIKE '%${escapedValue}%'`;
      case 'not_contains':
        return `${field} NOT ILIKE '%${escapedValue}%'`;
      case 'starts_with':
        return `${field} ILIKE '${escapedValue}%'`;
      case 'ends_with':
        return `${field} ILIKE '%${escapedValue}'`;
      default:
        return '1=1';
    }
  }

  /**
   * Build tag condition
   */
  buildTagCondition(operator, value) {
    if (operator === 'has_tag') {
      const escapedTag = value.replace(/'/g, "''");
      return `'${escapedTag}' = ANY(tags)`;
    }
    if (operator === 'not_has_tag') {
      const escapedTag = value.replace(/'/g, "''");
      return `NOT ('${escapedTag}' = ANY(tags))`;
    }
    if (operator === 'has_any_tag') {
      const tags = Array.isArray(value) ? value : [value];
      const escapedTags = tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',');
      return `tags && ARRAY[${escapedTags}]`;
    }
    if (operator === 'has_all_tags') {
      const tags = Array.isArray(value) ? value : [value];
      const escapedTags = tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',');
      return `tags @> ARRAY[${escapedTags}]`;
    }
    return '1=1';
  }

  /**
   * Build numeric condition
   */
  buildNumericCondition(field, operator, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '1=1';

    switch (operator) {
      case 'gt':
        return `${field} > ${numValue}`;
      case 'gte':
        return `${field} >= ${numValue}`;
      case 'lt':
        return `${field} < ${numValue}`;
      case 'lte':
        return `${field} <= ${numValue}`;
      case 'eq':
        return `${field} = ${numValue}`;
      case 'neq':
        return `${field} != ${numValue}`;
      default:
        return '1=1';
    }
  }

  /**
   * Build date condition
   */
  buildDateCondition(field, operator, value) {
    switch (operator) {
      case 'before':
        return `${field} < '${value}'::timestamptz`;
      case 'after':
        return `${field} > '${value}'::timestamptz`;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return `${field} BETWEEN '${value[0]}'::timestamptz AND '${value[1]}'::timestamptz`;
        }
        return '1=1';
      case 'days_ago':
        const days = parseInt(value);
        if (isNaN(days)) return '1=1';
        return `${field} > NOW() - INTERVAL '${days} days'`;
      case 'is_null':
        return `${field} IS NULL`;
      case 'is_not_null':
        return `${field} IS NOT NULL`;
      default:
        return '1=1';
    }
  }

  /**
   * Build custom field condition
   */
  buildCustomFieldCondition(operator, value) {
    const { field_name, field_value } = value;
    const escapedName = field_name.replace(/'/g, "''");
    const escapedValue = String(field_value).replace(/'/g, "''");

    switch (operator) {
      case 'equals':
        return `custom_fields->>'${escapedName}' = '${escapedValue}'`;
      case 'not_equals':
        return `custom_fields->>'${escapedName}' != '${escapedValue}'`;
      case 'contains':
        return `custom_fields->>'${escapedName}' ILIKE '%${escapedValue}%'`;
      case 'gt':
        return `(custom_fields->>'${escapedName}')::numeric > ${parseFloat(field_value)}`;
      case 'lt':
        return `(custom_fields->>'${escapedName}')::numeric < ${parseFloat(field_value)}`;
      case 'exists':
        return `custom_fields ? '${escapedName}'`;
      case 'not_exists':
        return `NOT (custom_fields ? '${escapedName}')`;
      default:
        return '1=1';
    }
  }

  /**
   * Build status condition
   */
  buildStatusCondition(operator, value) {
    const escapedValue = value.replace(/'/g, "''");
    
    if (operator === 'equals') {
      return `status = '${escapedValue}'`;
    }
    if (operator === 'not_equals') {
      return `status != '${escapedValue}'`;
    }
    return '1=1';
  }

  /**
   * Get segment members
   */
  async getSegmentMembers(segmentId, orgId) {
    const { rows } = await db.query(
      `SELECT c.* FROM sms_contacts c
       INNER JOIN sms_segment_members sm ON c.id = sm.contact_id
       WHERE sm.segment_id = $1 AND c.org_id = $2
       ORDER BY sm.added_at DESC`,
      [segmentId, orgId]
    );
    return rows;
  }

  /**
   * Add contact to segment (for static segments)
   */
  async addContactToSegment(segmentId, contactId, orgId) {
    // Verify segment exists and is not dynamic
    const segment = await this.getSegment(segmentId, orgId);
    if (!segment) {
      throw new Error('Segment not found');
    }
    if (segment.is_dynamic) {
      throw new Error('Cannot manually add contacts to dynamic segments');
    }

    await db.query(
      `INSERT INTO sms_segment_members (segment_id, contact_id)
       VALUES ($1, $2)
       ON CONFLICT (segment_id, contact_id) DO NOTHING`,
      [segmentId, contactId]
    );

    // Update member count
    await db.query(
      `UPDATE sms_segments SET member_count = (
         SELECT COUNT(*) FROM sms_segment_members WHERE segment_id = $1
       ) WHERE id = $1`,
      [segmentId]
    );
  }

  /**
   * Remove contact from segment (for static segments)
   */
  async removeContactFromSegment(segmentId, contactId, orgId) {
    // Verify segment exists and is not dynamic
    const segment = await this.getSegment(segmentId, orgId);
    if (!segment) {
      throw new Error('Segment not found');
    }
    if (segment.is_dynamic) {
      throw new Error('Cannot manually remove contacts from dynamic segments');
    }

    await db.query(
      `DELETE FROM sms_segment_members
       WHERE segment_id = $1 AND contact_id = $2`,
      [segmentId, contactId]
    );

    // Update member count
    await db.query(
      `UPDATE sms_segments SET member_count = (
         SELECT COUNT(*) FROM sms_segment_members WHERE segment_id = $1
       ) WHERE id = $1`,
      [segmentId]
    );
  }
}

module.exports = new SMSSegmentationService();
