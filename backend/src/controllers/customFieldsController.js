const db = require('../db');
const { FIELD_TYPES, validateCustomFieldValues, upsertCustomFieldValues } = require('../utils/customFields');

function toJsonb(value, fallback) {
  if (value === undefined || value === null) {
    return fallback === undefined ? null : JSON.stringify(fallback);
  }
  return JSON.stringify(value);
}

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

  const { errors, defByKey } = await validateCustomFieldValues(req.user.orgId, recordType, incoming);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await upsertCustomFieldValues(client, req.user.orgId, recordType, recordId, incoming, defByKey);
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

// ── Get records with custom fields attached (paginated) ──────────────────────
// Returns records from the target table with their custom field values merged.
// Requires the caller to know the underlying table name for the recordType.
const RECORD_TABLES = {
  contact: 'contacts',
  invoice: 'invoices',
  project: 'projects',
  task: 'task_items',
  lead: 'lead_forms',
  product: 'digital_products',
  asset: 'assets',
};

async function getRecordsWithFields(req, res) {
  const { recordType } = req.params;
  const { page = 1, limit = 50, search } = req.query;
  const table = RECORD_TABLES[recordType];
  if (!table) return res.status(400).json({ error: `Unsupported record type: ${recordType}. Supported: ${Object.keys(RECORD_TABLES).join(', ')}` });

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;

  if (search) { conditions.push(`(name ILIKE $${idx} OR full_name ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

  // Get base records
  const { rows: records } = await db.query(
    `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  const { rows: countResult } = await db.query(
    `SELECT count(*) AS cnt FROM ${table} WHERE ${conditions.join(' AND ')}`,
    params
  );

  // Attach custom fields
  const enhanced = await attachCustomFields(records, recordType, req.user.orgId);

  // Get field definitions for the response
  const { rows: definitions } = await db.query(
    `SELECT key, label, field_type FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId, recordType]
  );

  res.json({
    records: enhanced,
    fields: definitions,
    total: parseInt(countResult[0].cnt),
    page: parseInt(page),
    limit: parseInt(limit),
  });
}

// ── Bulk set custom field values ─────────────────────────────────────────────
// Sets the same custom field values on multiple records at once.
async function bulkSetValues(req, res) {
  const { recordType } = req.params;
  const { recordIds, values } = req.body || {};
  if (!Array.isArray(recordIds) || !recordIds.length || !values) {
    return res.status(400).json({ error: 'recordIds (non-empty array) and values are required.' });
  }

  const { errors, defByKey } = await validateCustomFieldValues(req.user.orgId, recordType, values);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const recordId of recordIds) {
      await upsertCustomFieldValues(client, req.user.orgId, recordType, recordId, values, defByKey);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ ok: true, count: recordIds.length });
}

// ── Export records with custom fields as CSV ─────────────────────────────────
async function exportRecordsCsv(req, res) {
  const { recordType } = req.params;
  const table = RECORD_TABLES[recordType];
  if (!table) return res.status(400).json({ error: `Unsupported record type: ${recordType}.` });

  const { rows: records } = await db.query(
    `SELECT * FROM ${table} WHERE org_id = $1 ORDER BY created_at DESC LIMIT 5000`,
    [req.user.orgId]
  );

  const { rows: definitions } = await db.query(
    `SELECT key, label, field_type FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId, recordType]
  );

  // Attach custom fields
  const enhanced = await attachCustomFields(records, recordType, req.user.orgId);

  // Build CSV
  const baseCols = Object.keys(records[0] || {}).filter(k => !['password_hash','totp_secret','totp_backup_codes'].includes(k));
  const fieldCols = definitions.map(d => d.key);
  const allCols = [...baseCols, ...fieldCols];

  const lines = [allCols.join(',')];
  for (const record of enhanced) {
    const row = allCols.map(col => {
      if (col in (record.customFields || {})) {
        return JSON.stringify(String(record.customFields[col] ?? '').replace(/"/g, '""'));
      }
      return JSON.stringify(String(record[col] ?? '').replace(/"/g, '""'));
    });
    lines.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${recordType}-custom-fields.csv"`);
  res.send(lines.join('\n'));
}

module.exports = {
  FIELD_TYPES,
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
};
