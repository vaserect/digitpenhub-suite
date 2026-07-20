/**
 * Field History Tracker
 * Tracks changes to field definitions over time
 */

const db = require('../db');

/**
 * Log a field definition change
 */
async function logFieldChange(orgId, recordType, fieldId, fieldKey, changeType, changes, userId) {
  try {
    await db.query(
      `INSERT INTO custom_field_history 
       (org_id, record_type, field_id, field_key, change_type, changes, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [orgId, recordType, fieldId, fieldKey, changeType, JSON.stringify(changes), userId]
    );
  } catch (error) {
    console.error('Error logging field history:', error);
    // Don't throw - history logging should not break main functionality
  }
}

/**
 * Get field history
 */
async function getFieldHistory(orgId, recordType, fieldKey, limit = 50) {
  const { rows } = await db.query(
    `SELECT h.*, u.full_name as user_name, u.email as user_email
     FROM custom_field_history h
     LEFT JOIN users u ON u.id = h.user_id
     WHERE h.org_id = $1 AND h.record_type = $2 AND h.field_key = $3
     ORDER BY h.created_at DESC
     LIMIT $4`,
    [orgId, recordType, fieldKey, limit]
  );

  return rows;
}

/**
 * Get all field changes for a record type
 */
async function getAllFieldHistory(orgId, recordType, limit = 100) {
  const { rows } = await db.query(
    `SELECT h.*, u.full_name as user_name, u.email as user_email
     FROM custom_field_history h
     LEFT JOIN users u ON u.id = h.user_id
     WHERE h.org_id = $1 AND h.record_type = $2
     ORDER BY h.created_at DESC
     LIMIT $3`,
    [orgId, recordType, limit]
  );

  return rows;
}

/**
 * Compare two field definitions and return changes
 */
function getFieldChanges(oldField, newField) {
  const changes = {};

  const fieldsToCompare = [
    'label', 'field_type', 'description', 'required', 'options',
    'relation_record_type', 'sort_order', 'currency_code',
    'min_value', 'max_value', 'format_pattern', 'security',
    'validation_rules', 'dependencies', 'groups'
  ];

  for (const field of fieldsToCompare) {
    const oldValue = oldField[field];
    const newValue = newField[field];

    // Deep comparison for objects and arrays
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = {
        old: oldValue,
        new: newValue,
      };
    }
  }

  return changes;
}

/**
 * Log field creation
 */
async function logFieldCreation(orgId, recordType, fieldId, fieldKey, fieldData, userId) {
  await logFieldChange(orgId, recordType, fieldId, fieldKey, 'created', {
    field: fieldData,
  }, userId);
}

/**
 * Log field update
 */
async function logFieldUpdate(orgId, recordType, fieldId, fieldKey, oldField, newField, userId) {
  const changes = getFieldChanges(oldField, newField);
  
  if (Object.keys(changes).length > 0) {
    await logFieldChange(orgId, recordType, fieldId, fieldKey, 'updated', changes, userId);
  }
}

/**
 * Log field deletion
 */
async function logFieldDeletion(orgId, recordType, fieldId, fieldKey, fieldData, userId) {
  await logFieldChange(orgId, recordType, fieldId, fieldKey, 'deleted', {
    field: fieldData,
  }, userId);
}

module.exports = {
  logFieldChange,
  getFieldHistory,
  getAllFieldHistory,
  getFieldChanges,
  logFieldCreation,
  logFieldUpdate,
  logFieldDeletion,
};
