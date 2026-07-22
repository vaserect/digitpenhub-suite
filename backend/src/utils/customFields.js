const db = require('../db');

async function attachCustomFields(records, recordType, orgId) {
  if (!records.length) return records;
  const recordIds = records.map((r) => r.id);

  const { rows } = await db.query(
    `SELECT v.record_id, d.key, v.value
     FROM custom_field_values v
     JOIN custom_field_definitions d ON d.id = v.field_id
     WHERE v.org_id = $1 AND v.record_type = $2
       AND v.record_id = ANY($3::uuid[])
       AND d.is_active = true`,
    [orgId, recordType, recordIds]
  );

  const byRecordId = {};
  for (const row of rows) {
    if (!byRecordId[row.record_id]) byRecordId[row.record_id] = {};
    byRecordId[row.record_id][row.key] = row.value ?? null;
  }

  return records.map((r) => ({ ...r, customFields: byRecordId[r.id] || {} }));
}

async function getExportColumns(recordType, orgId) {
  const { rows } = await db.query(
    `SELECT key, label FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true
     ORDER BY sort_order ASC`,
    [orgId, recordType]
  );
  return rows;
}

// Enhanced field types (Phase 2)
const FIELD_TYPES = [
  'text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation',
  'currency', 'percent', 'url', 'email', 'phone', 'rating', 'progress', 'location'
];

function validateValue(def, value) {
  if (value === undefined || value === null || value === '') {
    if (def.required) return `${def.label} is required.`;
    return null;
  }
  
  switch (def.field_type) {
    case 'number':
      if (Number.isNaN(Number(value))) return `${def.label} must be a number.`;
      break;
    case 'date':
      if (Number.isNaN(Date.parse(value))) return `${def.label} must be a valid date.`;
      break;
    case 'checkbox':
      if (typeof value !== 'boolean') return `${def.label} must be true or false.`;
      break;
    case 'select':
      if (!def.options.includes(value)) return `${def.label} must be one of the configured options.`;
      break;
    case 'multiselect': {
      const arr = Array.isArray(value) ? value : [];
      const invalid = arr.filter((v) => !def.options.includes(v));
      if (invalid.length) return `${def.label} contains options that are not configured: ${invalid.join(', ')}.`;
      break;
    }
    // Enhanced field types validation
    case 'currency':
      if (Number.isNaN(Number(value))) return `${def.label} must be a valid currency amount.`;
      if (Number(value) < 0) return `${def.label} cannot be negative.`;
      break;
    case 'percent':
      if (Number.isNaN(Number(value))) return `${def.label} must be a valid percentage.`;
      if (Number(value) < 0 || Number(value) > 100) return `${def.label} must be between 0 and 100.`;
      break;
    case 'url':
      try {
        new URL(value);
      } catch {
        return `${def.label} must be a valid URL (e.g., https://example.com).`;
      }
      break;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return `${def.label} must be a valid email address.`;
      break;
    case 'phone':
      // Basic phone validation - can be enhanced with format_pattern
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) return `${def.label} must be a valid phone number.`;
      if (def.format_pattern) {
        const customRegex = new RegExp(def.format_pattern);
        if (!customRegex.test(value)) return `${def.label} does not match the required format.`;
      }
      break;
    case 'rating':
      if (Number.isNaN(Number(value))) return `${def.label} must be a number.`;
      const ratingMin = def.min_value ?? 1;
      const ratingMax = def.max_value ?? 5;
      if (Number(value) < ratingMin || Number(value) > ratingMax) {
        return `${def.label} must be between ${ratingMin} and ${ratingMax}.`;
      }
      break;
    case 'progress':
      if (Number.isNaN(Number(value))) return `${def.label} must be a number.`;
      const progressMin = def.min_value ?? 0;
      const progressMax = def.max_value ?? 100;
      if (Number(value) < progressMin || Number(value) > progressMax) {
        return `${def.label} must be between ${progressMin} and ${progressMax}.`;
      }
      break;
    case 'location':
      // Expect location as object with lat/lng or address
      if (typeof value === 'object') {
        if (value.lat !== undefined && value.lng !== undefined) {
          if (Number.isNaN(Number(value.lat)) || Number.isNaN(Number(value.lng))) {
            return `${def.label} must have valid latitude and longitude.`;
          }
        } else if (!value.address) {
          return `${def.label} must have either coordinates (lat/lng) or an address.`;
        }
      } else if (typeof value !== 'string') {
        return `${def.label} must be a location object or address string.`;
      }
      break;
    default:
      break;
  }
  return null;
}

async function validateCustomFieldValues(orgId, recordType, incoming) {
  const { rows: defs } = await db.query(
    `SELECT id, key, label, field_type, required, options, currency_code, 
            min_value, max_value, format_pattern
     FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true`,
    [orgId, recordType]
  );
  const defByKey = Object.fromEntries(defs.map((d) => [d.key, d]));

  const errors = [];
  for (const def of defs) {
    if (Object.prototype.hasOwnProperty.call(incoming, def.key)) {
      const err = validateValue(def, incoming[def.key]);
      if (err) errors.push(err);
    } else if (def.required) {
      errors.push(`${def.label} is required.`);
    }
  }
  const unknownKeys = Object.keys(incoming).filter((k) => !defByKey[k]);
  if (unknownKeys.length) {
    errors.push(`Unknown custom field key(s): ${unknownKeys.join(', ')}.`);
  }

  return { errors, defs, defByKey };
}

async function upsertCustomFieldValues(client, orgId, recordType, recordId, incoming, defByKey) {
  for (const [key, value] of Object.entries(incoming)) {
    const def = defByKey[key];
    if (!def) continue;
    await client.query(
      `INSERT INTO custom_field_values (field_id, org_id, record_type, record_id, value)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (field_id, record_id)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [def.id, orgId, recordType, recordId, JSON.stringify(value)]
    );
  }
}

module.exports = {
  FIELD_TYPES,
  attachCustomFields,
  getExportColumns,
  validateCustomFieldValues,
  upsertCustomFieldValues,
  validateValue,
};
