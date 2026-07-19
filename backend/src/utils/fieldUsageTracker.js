/**
 * Field Usage Analytics Tracker
 * Tracks field usage patterns and generates analytics
 */

const db = require('../db');

/**
 * Track field value set operation
 */
async function trackFieldValueSet(orgId, recordType, fieldKey, userId) {
  try {
    await db.query(
      `INSERT INTO custom_field_usage_log 
       (org_id, record_type, field_key, action_type, user_id, created_at)
       VALUES ($1, $2, $3, 'set_value', $4, NOW())`,
      [orgId, recordType, fieldKey, userId]
    );
  } catch (error) {
    console.error('Error tracking field usage:', error);
    // Don't throw - usage tracking should not break main functionality
  }
}

/**
 * Track field value read operation
 */
async function trackFieldValueRead(orgId, recordType, fieldKey, userId) {
  try {
    await db.query(
      `INSERT INTO custom_field_usage_log 
       (org_id, record_type, field_key, action_type, user_id, created_at)
       VALUES ($1, $2, $3, 'read_value', $4, NOW())`,
      [orgId, recordType, fieldKey, userId]
    );
  } catch (error) {
    console.error('Error tracking field usage:', error);
  }
}

/**
 * Get field usage statistics
 */
async function getFieldUsageStats(orgId, recordType, days = 30) {
  const { rows } = await db.query(
    `SELECT 
       field_key,
       COUNT(*) FILTER (WHERE action_type = 'set_value') as write_count,
       COUNT(*) FILTER (WHERE action_type = 'read_value') as read_count,
       COUNT(DISTINCT user_id) as unique_users,
       MAX(created_at) as last_used
     FROM custom_field_usage_log
     WHERE org_id = $1 
       AND record_type = $2 
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY field_key
     ORDER BY write_count DESC`,
    [orgId, recordType]
  );

  return rows;
}

/**
 * Get overall usage summary
 */
async function getUsageSummary(orgId, days = 30) {
  const { rows } = await db.query(
    `SELECT 
       record_type,
       COUNT(DISTINCT field_key) as fields_used,
       COUNT(*) as total_operations,
       COUNT(DISTINCT user_id) as active_users
     FROM custom_field_usage_log
     WHERE org_id = $1 
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY record_type
     ORDER BY total_operations DESC`,
    [orgId]
  );

  return rows;
}

/**
 * Get unused fields (fields with no usage in specified period)
 */
async function getUnusedFields(orgId, recordType, days = 30) {
  const { rows } = await db.query(
    `SELECT d.key, d.label, d.field_type, d.created_at
     FROM custom_field_definitions d
     WHERE d.org_id = $1 
       AND d.record_type = $2
       AND d.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM custom_field_usage_log l
         WHERE l.org_id = d.org_id
           AND l.record_type = d.record_type
           AND l.field_key = d.key
           AND l.created_at >= NOW() - INTERVAL '${days} days'
       )
     ORDER BY d.created_at DESC`,
    [orgId, recordType]
  );

  return rows;
}

/**
 * Get field usage trend over time
 */
async function getFieldUsageTrend(orgId, recordType, fieldKey, days = 30) {
  const { rows } = await db.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) FILTER (WHERE action_type = 'set_value') as writes,
       COUNT(*) FILTER (WHERE action_type = 'read_value') as reads
     FROM custom_field_usage_log
     WHERE org_id = $1 
       AND record_type = $2 
       AND field_key = $3
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [orgId, recordType, fieldKey]
  );

  return rows;
}

module.exports = {
  trackFieldValueSet,
  trackFieldValueRead,
  getFieldUsageStats,
  getUsageSummary,
  getUnusedFields,
  getFieldUsageTrend,
};
