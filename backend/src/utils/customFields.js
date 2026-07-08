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

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation'];

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
    default:
      break;
  }
  return null;
}

// Shared by any controller writing custom field values on create/update.
// Looks up active definitions for the org+recordType, validates the incoming
// values against them, and flags any keys that don't match a definition.
async function validateCustomFieldValues(orgId, recordType, incoming) {
  const { rows: defs } = await db.query(
    `SELECT id, key, label, field_type, required, options
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

// Writes values within a caller-supplied client so it can participate in the
// same transaction as the parent record's insert/update.
async function upsertCustomFieldValues(client, orgId, recordType, recordId, incoming, defByKey) {
  for (const [key, value] of Object.entries(incoming)) {
    const def = defByKey[key];
    if (!def) continue; // caught by validateCustomFieldValues already; skip defensively
    await client.query(
      `INSERT INTO custom_field_values (field_id, org_id, record_type, record_id, value)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (field_id, record_id)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [def.id, orgId, recordType, recordId, value === undefined ? null : JSON.stringify(value)]
    );
  }
}

module.exports = {
  attachCustomFields,
  getExportColumns,
  FIELD_TYPES,
  validateValue,
  validateCustomFieldValues,
  upsertCustomFieldValues,
};
