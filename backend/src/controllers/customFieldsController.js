const db = require('../db');

// pg does not auto-serialize JS objects/arrays for jsonb columns the way it
// does for a single JSON value — an array param gets sent as a Postgres
// array literal ({a,b,c}) instead of JSON text, which Postgres then rejects
// as invalid jsonb. Always JSON.stringify before binding to a jsonb column.
function toJsonb(value, fallback) {
  if (value === undefined || value === null) {
    return fallback === undefined ? null : JSON.stringify(fallback);
  }
  return JSON.stringify(value);
}

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation'];

function validateDefinitionInput(body) {
  const { key, label, fieldType } = body || {};
  if (!key || !/^[a-z][a-z0-9_]*$/.test(key)) {
    return 'key is required and must be lowercase snake_case (e.g. "renewal_date").';
  }
  if (!label) return 'label is required.';
  if (!FIELD_TYPES.includes(fieldType)) {
    return `fieldType must be one of: ${FIELD_TYPES.join(', ')}.`;
  }
  if (fieldType === 'relation' && !body.relationRecordType) {
    return 'relationRecordType is required when fieldType is "relation".';
  }
  if (['select', 'multiselect'].includes(fieldType)) {
    const opts = Array.isArray(body.options) ? body.options : [];
    if (!opts.length) return 'options must be a non-empty array for select/multiselect fields.';
  }
  return null;
}

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

async function listDefinitions(req, res) {
  const { recordType } = req.params;
  const { rows } = await db.query(
    `SELECT id, record_type, key, label, field_type, description, required,
            default_value, validation, options, relation_record_type,
            sort_order, is_active, created_at, updated_at
     FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true
     ORDER BY sort_order ASC, created_at ASC`,
    [req.user.orgId, recordType]
  );
  res.json({ fields: rows });
}

async function createDefinition(req, res) {
  const { recordType } = req.params;
  const error = validateDefinitionInput(req.body);
  if (error) return res.status(400).json({ error });

  const {
    key, label, fieldType, description, required, defaultValue,
    validation, options, relationRecordType, sortOrder,
  } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO custom_field_definitions
         (org_id, record_type, key, label, field_type, description, required,
          default_value, validation, options, relation_record_type, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, record_type, key, label, field_type, description, required,
                 default_value, validation, options, relation_record_type,
                 sort_order, is_active, created_at, updated_at`,
      [
        req.user.orgId, recordType, key, label, fieldType, description || null,
        !!required, toJsonb(defaultValue), toJsonb(validation, {}), toJsonb(options, []),
        relationRecordType || null, Number.isFinite(sortOrder) ? sortOrder : 0,
      ]
    );
    res.status(201).json({ field: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `A field with key "${key}" already exists for ${recordType}.` });
    }
    throw err;
  }
}

async function updateDefinition(req, res) {
  const { recordType, id } = req.params;
  const {
    label, description, required, defaultValue, validation,
    options, relationRecordType, sortOrder, isActive,
  } = req.body || {};

  const { rows } = await db.query(
    `UPDATE custom_field_definitions
     SET label = COALESCE($1, label),
         description = COALESCE($2, description),
         required = COALESCE($3, required),
         default_value = COALESCE($4, default_value),
         validation = COALESCE($5, validation),
         options = COALESCE($6, options),
         relation_record_type = COALESCE($7, relation_record_type),
         sort_order = COALESCE($8, sort_order),
         is_active = COALESCE($9, is_active),
         updated_at = NOW()
     WHERE id = $10 AND org_id = $11 AND record_type = $12
     RETURNING id, record_type, key, label, field_type, description, required,
               default_value, validation, options, relation_record_type,
               sort_order, is_active, created_at, updated_at`,
    [
      label ?? null, description ?? null, required ?? null,
      defaultValue !== undefined ? JSON.stringify(defaultValue) : null,
      validation !== undefined ? JSON.stringify(validation) : null,
      options !== undefined ? JSON.stringify(options) : null,
      relationRecordType ?? null,
      Number.isFinite(sortOrder) ? sortOrder : null, isActive ?? null,
      id, req.user.orgId, recordType,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: 'Field not found.' });
  res.json({ field: rows[0] });
}

async function deleteDefinition(req, res) {
  const { recordType, id } = req.params;
  const { rows } = await db.query(
    `UPDATE custom_field_definitions
     SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND org_id = $2 AND record_type = $3
     RETURNING id`,
    [id, req.user.orgId, recordType]
  );
  if (!rows.length) return res.status(404).json({ error: 'Field not found.' });
  res.status(204).end();
}

async function getRecordValues(req, res) {
  const { recordType, recordId } = req.params;
  const { rows } = await db.query(
    `SELECT d.key, d.field_type, v.value
     FROM custom_field_definitions d
     LEFT JOIN custom_field_values v
       ON v.field_id = d.id AND v.record_id = $3
     WHERE d.org_id = $1 AND d.record_type = $2 AND d.is_active = true
     ORDER BY d.sort_order ASC`,
    [req.user.orgId, recordType, recordId]
  );
  const values = {};
  for (const row of rows) values[row.key] = row.value ?? null;
  res.json({ values });
}

async function setRecordValues(req, res) {
  const { recordType, recordId } = req.params;
  const incoming = (req.body && req.body.values) || {};

  const { rows: defs } = await db.query(
    `SELECT id, key, label, field_type, required, options
     FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true`,
    [req.user.orgId, recordType]
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
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(incoming)) {
      const def = defByKey[key];
      await client.query(
        `INSERT INTO custom_field_values (field_id, org_id, record_type, record_id, value)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (field_id, record_id)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [def.id, req.user.orgId, recordType, recordId, value === undefined ? null : JSON.stringify(value)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await db.query(
    `SELECT d.key, v.value
     FROM custom_field_definitions d
     LEFT JOIN custom_field_values v ON v.field_id = d.id AND v.record_id = $3
     WHERE d.org_id = $1 AND d.record_type = $2 AND d.is_active = true`,
    [req.user.orgId, recordType, recordId]
  );
  const values = {};
  for (const row of rows) values[row.key] = row.value ?? null;
  res.json({ values });
}

module.exports = {
  FIELD_TYPES,
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
};
