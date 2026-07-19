/**
 * Custom Field Search Utility
 * Enables searching and filtering records by custom field values
 */

/**
 * Build WHERE clause for custom field search
 * @param {Array} filters - Array of filter objects
 * @param {number} startParamIndex - Starting parameter index for SQL
 * @returns {Object} - { whereClause, params }
 */
function buildCustomFieldSearchQuery(filters, startParamIndex = 1) {
  const conditions = [];
  const params = [];
  let paramIndex = startParamIndex;

  for (const filter of filters) {
    const { field_key, operator, value } = filter;

    switch (operator) {
      case 'equals':
        conditions.push(`cfv.value->>'${field_key}' = $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'not_equals':
        conditions.push(`cfv.value->>'${field_key}' != $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'contains':
        conditions.push(`cfv.value->>'${field_key}' ILIKE $${paramIndex}`);
        params.push(`%${value}%`);
        paramIndex++;
        break;

      case 'not_contains':
        conditions.push(`cfv.value->>'${field_key}' NOT ILIKE $${paramIndex}`);
        params.push(`%${value}%`);
        paramIndex++;
        break;

      case 'starts_with':
        conditions.push(`cfv.value->>'${field_key}' ILIKE $${paramIndex}`);
        params.push(`${value}%`);
        paramIndex++;
        break;

      case 'ends_with':
        conditions.push(`cfv.value->>'${field_key}' ILIKE $${paramIndex}`);
        params.push(`%${value}`);
        paramIndex++;
        break;

      case 'greater_than':
        conditions.push(`(cfv.value->>'${field_key}')::numeric > $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'less_than':
        conditions.push(`(cfv.value->>'${field_key}')::numeric < $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'greater_than_or_equal':
        conditions.push(`(cfv.value->>'${field_key}')::numeric >= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'less_than_or_equal':
        conditions.push(`(cfv.value->>'${field_key}')::numeric <= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'is_empty':
        conditions.push(`(cfv.value->>'${field_key}' IS NULL OR cfv.value->>'${field_key}' = '')`);
        break;

      case 'is_not_empty':
        conditions.push(`(cfv.value->>'${field_key}' IS NOT NULL AND cfv.value->>'${field_key}' != '')`);
        break;

      case 'in':
        const inValues = Array.isArray(value) ? value : value.split(',').map(v => v.trim());
        const inPlaceholders = inValues.map(() => `$${paramIndex++}`).join(',');
        conditions.push(`cfv.value->>'${field_key}' IN (${inPlaceholders})`);
        params.push(...inValues);
        break;

      case 'not_in':
        const notInValues = Array.isArray(value) ? value : value.split(',').map(v => v.trim());
        const notInPlaceholders = notInValues.map(() => `$${paramIndex++}`).join(',');
        conditions.push(`cfv.value->>'${field_key}' NOT IN (${notInPlaceholders})`);
        params.push(...notInValues);
        break;

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          conditions.push(`(cfv.value->>'${field_key}')::numeric BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(value[0], value[1]);
          paramIndex += 2;
        }
        break;

      default:
        console.warn(`Unknown operator: ${operator}`);
    }
  }

  return {
    whereClause: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params,
    nextParamIndex: paramIndex
  };
}

/**
 * Build ORDER BY clause for custom field sorting
 * @param {string} fieldKey - Custom field key to sort by
 * @param {string} direction - 'ASC' or 'DESC'
 * @returns {string} - ORDER BY clause
 */
function buildCustomFieldSortClause(fieldKey, direction = 'ASC') {
  const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `cfv.value->>'${fieldKey}' ${dir}`;
}

/**
 * Extract custom field values from aggregated JSONB
 * @param {Object} record - Record with custom_fields JSONB
 * @returns {Object} - Parsed custom field values
 */
function extractCustomFieldValues(record) {
  if (!record.custom_fields) return {};
  
  try {
    return typeof record.custom_fields === 'string' 
      ? JSON.parse(record.custom_fields) 
      : record.custom_fields;
  } catch (error) {
    console.error('Error parsing custom fields:', error);
    return {};
  }
}

module.exports = {
  buildCustomFieldSearchQuery,
  buildCustomFieldSortClause,
  extractCustomFieldValues
};
