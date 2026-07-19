const db = require('../db');
const {
  FIELD_TYPES,
  validateCustomFieldValues,
  upsertCustomFieldValues,
  attachCustomFields,
} = require('../utils/customFields');
const { validateAdvancedRules } = require('../utils/validationEngine');
const { validateFieldValues } = require('../utils/customFieldValidator');
const { filterFieldsByDependencies } = require('../utils/fieldDependencyEvaluator');
const { trackFieldValueSet, trackFieldValueRead } = require('../utils/fieldUsageTracker');
const { logFieldCreation, logFieldUpdate, logFieldDeletion } = require('../utils/fieldHistoryTracker');


// ============================================================================
// Field-Level Security Functions
// ============================================================================

/**
 * Filter fields based on user role and security settings
 */
function filterFieldsByRole(fields, userRole) {
  return fields.filter(field => {
    const security = field.security || {
      visibility: ['owner', 'admin', 'member'],
      editable: ['owner', 'admin'],
      sensitive: false,
      mask_value: false
    };
    return security.visibility.includes(userRole);
  });
}

/**
 * Check if user can edit a specific field
 */
function canEditField(field, userRole) {
  const security = field.security || { editable: ['owner', 'admin'] };
  return security.editable.includes(userRole);
}

/**
 * Mask sensitive field values
 */
function maskSensitiveValue(field, value) {
  const security = field.security || { sensitive: false, mask_value: false };
  if (security.sensitive && security.mask_value && value) {
    if (typeof value === 'string') {
      return '****' + value.slice(-4);
    }
    return '****';
  }
  return value;
}

/**
 * Add security metadata to field definitions
 */
function addSecurityMetadata(fields, userRole) {
  return fields.map(field => ({
    ...field,
    _security: {
      canEdit: canEditField(field, userRole),
      isSensitive: field.security?.sensitive || false,
      isReadOnly: !canEditField(field, userRole)
    }
  }));
}

function toJsonb(value, fallback) {
  if (value === undefined || value === null) {
    return fallback === undefined ? null : JSON.stringify(fallback);
  }
  return JSON.stringify(value);
}

function validateDefinitionInput(body, { isUpdate = false } = {}) {
  const { key, label, fieldType } = body || {};
  if (!isUpdate) {
    if (!key || !/^[a-z][a-z0-9_]*$/.test(key)) {
      return 'key is required and must be lowercase snake_case (e.g. "renewal_date").';
    }
    if (!label) return 'label is required.';
    if (!FIELD_TYPES.includes(fieldType)) {
      return `fieldType must be one of: ${FIELD_TYPES.join(', ')}.`;
    }
  } else if (fieldType !== undefined && !FIELD_TYPES.includes(fieldType)) {
    return `fieldType must be one of: ${FIELD_TYPES.join(', ')}.`;
  }

  const effectiveType = fieldType || body?.field_type;
  if (effectiveType === 'relation' && !body.relationRecordType && !body.relation_record_type) {
    if (!isUpdate) return 'relationRecordType is required when fieldType is "relation".';
  }
  if (['select', 'multiselect'].includes(effectiveType)) {
    const opts = Array.isArray(body.options) ? body.options : [];
    if (!isUpdate && !opts.length) {
      return 'options must be a non-empty array for select/multiselect fields.';
    }
  }
  return null;
}

const DEFINITION_SELECT = `
  id, record_type, key, label, field_type, description, required,
  default_value, validation, options, relation_record_type,
  sort_order, is_active, currency_code, min_value, max_value, format_pattern, security,
  created_at, updated_at
`;

async function listDefinitions(req, res) {
  const { recordType } = req.params;
  const { rows } = await db.query(
    `SELECT ${DEFINITION_SELECT}
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
    key,
    label,
    fieldType,
    description,
    required,
    defaultValue,
    validation,
    options,
    relationRecordType,
    sortOrder,
    currencyCode,
    minValue,
    maxValue,
    formatPattern,
    security,
  } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO custom_field_definitions
         (org_id, record_type, key, label, field_type, description, required,
          default_value, validation, options, relation_record_type, sort_order,
          currency_code, min_value, max_value, format_pattern, security)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING ${DEFINITION_SELECT}`,
      [
        req.user.orgId,
        recordType,
        key,
        label,
        fieldType,
        description || null,
        !!required,
        toJsonb(defaultValue),
        toJsonb(validation, {}),
        toJsonb(options, []),
        relationRecordType || null,
        Number.isFinite(sortOrder) ? sortOrder : 0,
        currencyCode || 'USD',
        minValue ?? null,
        maxValue ?? null,
        formatPattern || null,
      ]
    );
    res.status(201).json({ field: rows[0] });
    // Log field creation
    logFieldCreation(req.user.orgId, recordType, rows[0].id, key, rows[0], req.user.id).catch(() => {});
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `A field with key "${key}" already exists for ${recordType}.` });
    }
    throw err;
  }
}

async function updateDefinition(req, res) {
  const { recordType, id } = req.params;
  const error = validateDefinitionInput(req.body, { isUpdate: true });
  if (error) return res.status(400).json({ error });

  const {
    label,
    description,
    required,
    defaultValue,
    validation,
    options,
    relationRecordType,
    sortOrder,
    isActive,
    currencyCode,
    minValue,
    maxValue,
    formatPattern,
  } = req.body || {};

  // Fetch old field data for history tracking
  const { rows: oldRows } = await db.query(
    `SELECT * FROM custom_field_definitions WHERE id = $1 AND org_id = $2 AND record_type = $3`,
    [id, req.user.orgId, recordType]
  );
  
  if (!oldRows.length) return res.status(404).json({ error: 'Field not found.' });
  const oldField = oldRows[0];

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
         currency_code = COALESCE($10, currency_code),
         min_value = COALESCE($11, min_value),
         max_value = COALESCE($12, max_value),
         format_pattern = COALESCE($13, format_pattern),
         updated_at = NOW()
     WHERE id = $14 AND org_id = $15 AND record_type = $16
     RETURNING ${DEFINITION_SELECT}`,
    [
      label ?? null,
      description ?? null,
      required ?? null,
      defaultValue !== undefined ? JSON.stringify(defaultValue) : null,
      validation !== undefined ? JSON.stringify(validation) : null,
      options !== undefined ? JSON.stringify(options) : null,
      relationRecordType ?? null,
      Number.isFinite(sortOrder) ? sortOrder : null,
      isActive ?? null,
      currencyCode ?? null,
      minValue ?? null,
      maxValue ?? null,
      formatPattern ?? null,
      id,
      req.user.orgId,
      recordType,
    ]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Field not found.' });
  
  // Log field update
  logFieldUpdate(req.user.orgId, recordType, id, oldField.key, oldField, rows[0], req.user.id).catch(() => {});
  
  res.json({ field: rows[0] });
}
async function deleteDefinition(req, res) {
  const { recordType, id } = req.params;
  
  // Fetch field data before deletion for history tracking
  const { rows: fieldRows } = await db.query(
    `SELECT * FROM custom_field_definitions WHERE id = $1 AND org_id = $2 AND record_type = $3`,
    [id, req.user.orgId, recordType]
  );
  
  if (!fieldRows.length) return res.status(404).json({ error: 'Field not found.' });
  const fieldData = fieldRows[0];
  
  const { rows } = await db.query(
    `UPDATE custom_field_definitions
     SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND org_id = $2 AND record_type = $3
     RETURNING id`,
    [id, req.user.orgId, recordType]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Field not found.' });
  
  // Log field deletion
  logFieldDeletion(req.user.orgId, recordType, id, fieldData.key, fieldData, req.user.id).catch(() => {});
  
  res.status(204).end();
}

async function getRecordValues(req, res) {
async function getRecordValues(req, res) {
  const { recordType, recordId } = req.params;
  const userRole = req.user.role || 'member'; // Get user role from request

  const { rows } = await db.query(
    `SELECT d.id, d.key, d.field_type, d.security, d.dependencies, v.value
     FROM custom_field_definitions d
     LEFT JOIN custom_field_values v
       ON v.field_id = d.id AND v.record_id = $3
     WHERE d.org_id = $1 AND d.record_type = $2 AND d.is_active = true
     ORDER BY d.sort_order ASC`,
    [req.user.orgId, recordType, recordId]
  );

  // First get all values for dependency evaluation
  const allValues = {};
  for (const field of rows) {
    allValues[field.key] = field.value ?? null;
  }

  // Filter fields by dependencies
  const dependencyFilteredFields = filterFieldsByDependencies(rows, allValues);
  const dependencyFilteredKeys = new Set(dependencyFilteredFields.map(f => f.key));

  // Then filter by role visibility and mask sensitive values
  const visibleFields = filterFieldsByRole(rows, userRole);
  const values = {};
  for (const field of visibleFields) {
    // Only include if field passed dependency check
    if (dependencyFilteredKeys.has(field.key)) {
      const rawValue = field.value ?? null;
      values[field.key] = maskSensitiveValue(field, rawValue);
    }
  }
  // Track field reads (non-blocking)
  for (const field of visibleFields) {
    if (dependencyFilteredKeys.has(field.key)) {
      trackFieldValueRead(req.user.orgId, recordType, field.key, req.user.id).catch(() => {});
    }
  }

  res.json({ values });
}
  const { recordType, recordId } = req.params;
  const incoming = (req.body && req.body.values) || {};
  const userRole = req.user.role || 'member'; // Get user role from request

  const { errors, defByKey } = await validateCustomFieldValues(req.user.orgId, recordType, incoming);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  // Validate field values against validation rules
  const fieldDefs = Object.values(defByKey);
  const validationResult = validateFieldValues(incoming, fieldDefs);
  if (!validationResult.valid) {
    const validationErrors = [];
    for (const [fieldKey, fieldErrors] of Object.entries(validationResult.errors)) {
      const fieldDef = defByKey[fieldKey];
      const label = fieldDef?.label || fieldKey;
      validationErrors.push(`${label}: ${fieldErrors.join(', ')}`);
    }
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  // Enforce field-level security: filter out fields user cannot edit
  const editableFields = {};
  for (const [key, value] of Object.entries(incoming)) {
    const fieldDef = defByKey[key];
    if (fieldDef && canEditField(fieldDef, userRole)) {
      editableFields[key] = value;
    } else if (fieldDef) {
      // User tried to edit a field they don't have permission for
      return res.status(403).json({ 
        error: `You do not have permission to edit the field '${fieldDef.label || key}'` 
      });
    }
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await upsertCustomFieldValues(client, req.user.orgId, recordType, recordId, editableFields, defByKey);
    await client.query('COMMIT');
    // Track field writes (non-blocking)
    for (const fieldKey of Object.keys(editableFields)) {
      trackFieldValueSet(req.user.orgId, recordType, fieldKey, req.user.id).catch(() => {});
    }
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

// Maps record_type keys used by the Custom Fields Engine to underlying tables.
const RECORD_TABLES = {
  contact: 'contacts',
  crm_contact: 'contacts',
  invoice: 'invoices',
  quotation: 'quotations',
  project: 'projects',
  task: 'task_items',
  lead: 'leads',
  product: 'digital_products',
  asset: 'assets',
  inventory_item: 'inventory_items',
  hr_employee: 'employees',
  student: 'students',
};

async function getRecordsWithFields(req, res) {
  const { recordType } = req.params;
  const { page = 1, limit = 50, search } = req.query;
  const table = RECORD_TABLES[recordType];
  if (!table) {
    return res.status(400).json({
      error: `Unsupported record type: ${recordType}. Supported: ${Object.keys(RECORD_TABLES).join(', ')}`,
    });
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;

  if (search) {
    conditions.push(`(
      COALESCE(name,'') ILIKE $${idx}
      OR COALESCE(full_name,'') ILIKE $${idx}
      OR COALESCE(email,'') ILIKE $${idx}
    )`);
    params.push(`%${search}%`);
    idx += 1;
  }

  let records = [];
  let total = 0;
  try {
    const { rows } = await db.query(
      `SELECT * FROM ${table}
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit, 10), offset]
    );
    records = rows;
    const { rows: countResult } = await db.query(
      `SELECT count(*) AS cnt FROM ${table} WHERE ${conditions.join(' AND ')}`,
      params
    );
    total = parseInt(countResult[0].cnt, 10);
  } catch (err) {
    // Table may not exist for every record type in every deployment.
    if (err.code === '42P01' || err.code === '42703') {
      return res.json({ records: [], fields: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    }
    throw err;
  }

  const enhanced = await attachCustomFields(records, recordType, req.user.orgId);
  const { rows: definitions } = await db.query(
    `SELECT key, label, field_type FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId, recordType]
  );

  res.json({
    records: enhanced,
    fields: definitions,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
}

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

async function exportRecordsCsv(req, res) {
  const { recordType } = req.params;
  const table = RECORD_TABLES[recordType];
  if (!table) return res.status(400).json({ error: `Unsupported record type: ${recordType}.` });

  let records = [];
  try {
    const { rows } = await db.query(
      `SELECT * FROM ${table} WHERE org_id = $1 ORDER BY created_at DESC LIMIT 5000`,
      [req.user.orgId]
    );
    records = rows;
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(400).json({ error: `No data table available for record type ${recordType}.` });
    }
    throw err;
  }

  const { rows: definitions } = await db.query(
    `SELECT key, label, field_type FROM custom_field_definitions
     WHERE org_id = $1 AND record_type = $2 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId, recordType]
  );

  const enhanced = await attachCustomFields(records, recordType, req.user.orgId);
  const baseCols = Object.keys(records[0] || {}).filter(
    (k) => !['password_hash', 'totp_secret', 'totp_backup_codes'].includes(k)
  );
  const fieldCols = definitions.map((d) => d.key);
  const allCols = [...baseCols, ...fieldCols];

  const lines = [allCols.join(',')];
  for (const record of enhanced) {
    const row = allCols.map((col) => {
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

async function listTemplates(req, res) {
  const { recordType } = req.query;
  let query = 'SELECT * FROM custom_field_templates WHERE 1=1';
  const params = [];

  if (recordType) {
    params.push(recordType);
    query += ` AND record_type = $${params.length}`;
  }

  query += ' ORDER BY category, name';

  try {
    const { rows } = await db.query(query, params);
    res.json({ templates: rows });
  } catch (err) {
    if (err.code === '42P01') {
      return res.json({ templates: [] });
    }
    throw err;
  }
}

async function applyTemplate(req, res) {
  const { templateId } = req.params;
  const { recordType } = req.body || {};

  let template;
  try {
    const { rows } = await db.query('SELECT * FROM custom_field_templates WHERE id = $1', [templateId]);
    template = rows[0];
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(404).json({ error: 'Field templates are not available yet.' });
    }
    throw err;
  }

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const fields = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields;
  const targetType = recordType || template.record_type;
  const created = [];

  for (const fieldDef of fields) {
    try {
      const { rows } = await db.query(
        `INSERT INTO custom_field_definitions
           (org_id, record_type, key, label, field_type, description, required,
            default_value, validation, options, relation_record_type, sort_order,
            currency_code, min_value, max_value, format_pattern)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (org_id, record_type, key) DO NOTHING
         RETURNING id, key, label`,
        [
          req.user.orgId,
          targetType,
          fieldDef.key,
          fieldDef.label,
          fieldDef.fieldType || fieldDef.field_type,
          fieldDef.description || null,
          fieldDef.required || false,
          JSON.stringify(fieldDef.defaultValue ?? fieldDef.default_value ?? null),
          JSON.stringify(fieldDef.validation || {}),
          JSON.stringify(fieldDef.options || []),
          fieldDef.relationRecordType || fieldDef.relation_record_type || null,
          fieldDef.sortOrder || fieldDef.sort_order || 0,
          fieldDef.currencyCode || fieldDef.currency_code || 'USD',
          fieldDef.minValue ?? fieldDef.min_value ?? null,
          fieldDef.maxValue ?? fieldDef.max_value ?? null,
          fieldDef.formatPattern || fieldDef.format_pattern || null,
        ]
      );
      if (rows.length > 0) created.push(rows[0]);
    } catch (err) {
      console.error('Error creating field from template:', err.message);
    }
  }

  await db.query(
    'UPDATE custom_field_templates SET usage_count = usage_count + 1 WHERE id = $1',
    [templateId]
  );

  res.json({
    message: `Applied template: ${created.length} fields created`,
    created: created.length,
    skipped: fields.length - created.length,
    fields: created,
  });
}

async function getAnalytics(req, res) {
  const orgId = req.user.orgId;

  const { rows: summary } = await db.query(
    `SELECT
       COUNT(*)::int AS total_fields,
       COUNT(*) FILTER (WHERE is_active)::int AS active_fields,
       COUNT(DISTINCT record_type)::int AS record_types
     FROM custom_field_definitions
     WHERE org_id = $1`,
    [orgId]
  );

  const { rows: withData } = await db.query(
    `SELECT COUNT(DISTINCT field_id)::int AS fields_with_data
     FROM custom_field_values
     WHERE org_id = $1 AND value IS NOT NULL AND value::text NOT IN ('null', '""', '[]', '{}')`,
    [orgId]
  );

  const { rows: byType } = await db.query(
    `SELECT record_type,
            COUNT(*)::int AS field_count,
            COUNT(*) FILTER (WHERE is_active)::int AS active_count
     FROM custom_field_definitions
     WHERE org_id = $1
     GROUP BY record_type
     ORDER BY field_count DESC`,
    [orgId]
  );

  const { rows: topFields } = await db.query(
    `SELECT d.key, d.label, d.record_type, d.field_type,
            COUNT(v.id)::int AS value_count
     FROM custom_field_definitions d
     LEFT JOIN custom_field_values v ON v.field_id = d.id
     WHERE d.org_id = $1 AND d.is_active = true
     GROUP BY d.id
     ORDER BY value_count DESC
     LIMIT 10`,
    [orgId]
  );

  res.json({
    stats: {
      totalFields: summary[0]?.total_fields || 0,
      activeFields: summary[0]?.active_fields || 0,
      recordTypes: summary[0]?.record_types || 0,
      fieldsWithData: withData[0]?.fields_with_data || 0,
    },
    byRecordType: byType,
    topFields,
  });
}

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
  listTemplates,
  applyTemplate,
  getAnalytics,
  getFieldAnalytics,
  getOverallStats,
  listValidationTemplates,
  getValidationTemplate,
  addValidationRule,
  removeValidationRule,
  FIELD_TYPES,
};

// Analytics endpoints
async function getFieldAnalytics(req, res) {
  const { recordType } = req.params;
  
  // Get all field definitions for this record type
  const { rows: fields } = await db.query(
    `SELECT id, key, label, field_type, created_at 
     FROM custom_field_definitions 
     WHERE org_id = $1 AND record_type = $2 AND is_active = true
     ORDER BY created_at DESC`,
    [req.user.orgId, recordType]
  );
  
  // Get usage statistics for each field
  const analytics = [];
  for (const field of fields) {
    const { rows: [stats] } = await db.query(
      `SELECT 
        COUNT(DISTINCT record_id) as records_with_value,
        COUNT(*) as total_values,
        MAX(updated_at) as last_used
       FROM custom_field_values
       WHERE field_id = $1 AND org_id = $2 AND value IS NOT NULL AND value != 'null'::jsonb`,
      [field.id, req.user.orgId]
    );
    
    // Get total record count for this type
    let totalRecords = 0;
    try {
      const tableMap = {
        'crm_contact': 'contacts',
        'invoice': 'invoices',
        'quotation': 'quotations',
        'project': 'projects',
        'task': 'tasks',
        'inventory_item': 'inventory',
        'hr_employee': 'hr_employees',
        'student': 'students',
      };
      const tableName = tableMap[recordType];
      if (tableName) {
        const { rows: [count] } = await db.query(
          `SELECT COUNT(*) as total FROM ${tableName} WHERE org_id = $1`,
          [req.user.orgId]
        );
        totalRecords = parseInt(count.total);
      }
    } catch (err) {
      console.error('Error getting total records:', err);
    }
    
    const recordsWithValue = parseInt(stats.records_with_value || 0);
    const fillRate = totalRecords > 0 ? (recordsWithValue / totalRecords * 100).toFixed(1) : 0;
    
    analytics.push({
      field_id: field.id,
      field_key: field.key,
      field_label: field.label,
      field_type: field.field_type,
      created_at: field.created_at,
      records_with_value: recordsWithValue,
      total_records: totalRecords,
      fill_rate: parseFloat(fillRate),
      last_used: stats.last_used,
    });
  }
  
  res.json({ analytics });
}

async function getOverallStats(req, res) {
  // Get overall statistics across all record types
  const { rows: [stats] } = await db.query(
    `SELECT 
      COUNT(DISTINCT d.id) as total_fields,
      COUNT(DISTINCT d.record_type) as record_types,
      COUNT(DISTINCT v.record_id) as records_with_custom_fields,
      COUNT(DISTINCT CASE WHEN d.created_at > NOW() - INTERVAL '30 days' THEN d.id END) as fields_created_last_30_days
     FROM custom_field_definitions d
     LEFT JOIN custom_field_values v ON v.field_id = d.id
     WHERE d.org_id = $1 AND d.is_active = true`,
    [req.user.orgId]
  );
  
  // Get most used field types
  const { rows: fieldTypes } = await db.query(
    `SELECT field_type, COUNT(*) as count
     FROM custom_field_definitions
     WHERE org_id = $1 AND is_active = true
     GROUP BY field_type
     ORDER BY count DESC
     LIMIT 5`,
    [req.user.orgId]
  );
  
  res.json({
    total_fields: parseInt(stats.total_fields || 0),
    record_types: parseInt(stats.record_types || 0),
    records_with_custom_fields: parseInt(stats.records_with_custom_fields || 0),
    fields_created_last_30_days: parseInt(stats.fields_created_last_30_days || 0),
    popular_field_types: fieldTypes,
  });
}

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
  listTemplates,
  applyTemplate,
  getAnalytics,
  getFieldAnalytics,
  getOverallStats,
  listValidationTemplates,
  getValidationTemplate,
  addValidationRule,
  removeValidationRule,
  FIELD_TYPES,
};

// Validation rule template endpoints
async function listValidationTemplates(req, res) {
  const { fieldType } = req.query;
  let query = 'SELECT * FROM custom_field_validation_templates WHERE 1=1';
  const params = [];
  
  if (fieldType) {
    params.push(fieldType);
    query += ` AND field_type = $${params.length}`;
  }
  
  query += ' ORDER BY field_type, name';
  
  const { rows } = await db.query(query, params);
  res.json({ templates: rows });
}

async function addValidationRule(req, res) {
  const { fieldId } = req.params;
  const { ruleType, ruleConfig } = req.body;
  
  // Get current validation rules
  const { rows: [field] } = await db.query(
    'SELECT validation_rules FROM custom_field_definitions WHERE id = $1 AND org_id = $2',
    [fieldId, req.user.orgId]
  );
  
  if (!field) {
    return res.status(404).json({ error: 'Field not found' });
  }
  
  const currentRules = field.validation_rules || [];
  const newRule = {
    id: require('crypto').randomUUID(),
    rule_type: ruleType,
    rule_config: ruleConfig,
    created_at: new Date().toISOString(),
  };
  
  const updatedRules = [...currentRules, newRule];
  
  await db.query(
    'UPDATE custom_field_definitions SET validation_rules = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3',
    [JSON.stringify(updatedRules), fieldId, req.user.orgId]
  );
  
  res.json({ rule: newRule });
}

async function removeValidationRule(req, res) {
  const { fieldId, ruleId } = req.params;
  
  const { rows: [field] } = await db.query(
    'SELECT validation_rules FROM custom_field_definitions WHERE id = $1 AND org_id = $2',
    [fieldId, req.user.orgId]
  );
  
  if (!field) {
    return res.status(404).json({ error: 'Field not found' });
  }
  
  const currentRules = field.validation_rules || [];
  const updatedRules = currentRules.filter(r => r.id !== ruleId);
  
  await db.query(
    'UPDATE custom_field_definitions SET validation_rules = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3',
    [JSON.stringify(updatedRules), fieldId, req.user.orgId]
  );
  
  res.json({ success: true });
}

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
  listTemplates,
  applyTemplate,
  getAnalytics,
  getFieldAnalytics,
  getOverallStats,
  listValidationTemplates,
  getValidationTemplate,
  addValidationRule,
  removeValidationRule,
  FIELD_TYPES,
};

// ============================================================================
// Validation Template Management
// ============================================================================

async function listValidationTemplates(req, res) {
  const { fieldType } = req.query;
  
  try {
    let query = 'SELECT * FROM custom_field_validation_templates WHERE is_system = true';
    const params = [];
    
    if (fieldType) {
      query += ' AND field_type = $1';
      params.push(fieldType);
    }
    
    query += ' ORDER BY field_type, name';
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listing validation templates:', err);
    res.status(500).json({ error: 'Failed to list validation templates.' });
  }
}

async function getValidationTemplate(req, res) {
  const { templateId } = req.params;
  
  try {
    const { rows } = await db.query(
      'SELECT * FROM custom_field_validation_templates WHERE id = $1',
      [templateId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Validation template not found.' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error getting validation template:', err);
    res.status(500).json({ error: 'Failed to get validation template.' });
  }
}


/**
 * Reorder fields by updating sort_order
 */
async function reorderFields(req, res) {
  const { recordType } = req.params;
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const update of updates) {
      await client.query(
        `UPDATE custom_field_definitions 
         SET sort_order = $1, updated_at = NOW()
         WHERE id = $2 AND org_id = $3 AND record_type = $4`,
        [update.sort_order, update.id, req.user.orgId, recordType]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, updated: updates.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder fields' });
  } finally {
    client.release();
  }
}

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
  listTemplates,
  applyTemplate,
  getAnalytics,
  getOverallStats,
  getFieldAnalytics,
  listValidationTemplates,
  addValidationRule,
  removeValidationRule,
  reorderFields,
  bulkOperations,
};

/**
 * Bulk operations on field definitions
 */
async function bulkOperations(req, res) {
  const { recordType } = req.params;
  const { operation, field_ids, updates } = req.body;

  if (!operation || !Array.isArray(field_ids) || field_ids.length === 0) {
    return res.status(400).json({ error: 'operation and field_ids array are required' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let affectedCount = 0;

    switch (operation) {
      case 'delete':
        // Soft delete multiple fields
        const { rowCount: deleteCount } = await client.query(
          `UPDATE custom_field_definitions 
           SET is_active = false, updated_at = NOW()
           WHERE id = ANY($1) AND org_id = $2 AND record_type = $3`,
          [field_ids, req.user.orgId, recordType]
        );
        affectedCount = deleteCount;
        break;

      case 'activate':
        const { rowCount: activateCount } = await client.query(
          `UPDATE custom_field_definitions 
           SET is_active = true, updated_at = NOW()
           WHERE id = ANY($1) AND org_id = $2 AND record_type = $3`,
          [field_ids, req.user.orgId, recordType]
        );
        affectedCount = activateCount;
        break;

      case 'deactivate':
        const { rowCount: deactivateCount } = await client.query(
          `UPDATE custom_field_definitions 
           SET is_active = false, updated_at = NOW()
           WHERE id = ANY($1) AND org_id = $2 AND record_type = $3`,
          [field_ids, req.user.orgId, recordType]
        );
        affectedCount = deactivateCount;
        break;

      case 'update':
        // Bulk update specific properties
        if (!updates || typeof updates !== 'object') {
          throw new Error('updates object is required for update operation');
        }

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (updates.required !== undefined) {
          updateFields.push(`required = $${paramIndex++}`);
          updateValues.push(updates.required);
        }
        if (updates.sort_order !== undefined) {
          updateFields.push(`sort_order = $${paramIndex++}`);
          updateValues.push(updates.sort_order);
        }
        if (updates.security !== undefined) {
          updateFields.push(`security = $${paramIndex++}`);
          updateValues.push(JSON.stringify(updates.security));
        }

        if (updateFields.length === 0) {
          throw new Error('No valid update fields provided');
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(field_ids, req.user.orgId, recordType);

        const { rowCount: updateCount } = await client.query(
          `UPDATE custom_field_definitions 
           SET ${updateFields.join(', ')}
           WHERE id = ANY($${paramIndex}) AND org_id = $${paramIndex + 1} AND record_type = $${paramIndex + 2}`,
          updateValues
        );
        affectedCount = updateCount;
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      operation,
      affected: affectedCount 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk operation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

// ============================================================================
// Field Dependencies Management
// ============================================================================

/**
 * Add or update dependencies for a custom field
 * POST /api/v1/custom-fields/:fieldId/dependencies
 */
async function setFieldDependencies(req, res) {
  const { fieldId } = req.params;
  const { dependencies } = req.body;
  const orgId = req.user.orgId;

  try {
    // Validate dependencies structure
    if (!Array.isArray(dependencies)) {
      return res.status(400).json({ error: 'dependencies must be an array' });
    }

    // Validate each dependency rule
    const validConditionTypes = [
      'equals', 'not_equals', 'contains', 'not_contains',
      'greater_than', 'less_than', 'is_empty', 'is_not_empty',
      'in_list', 'not_in_list'
    ];
    const validActions = ['show', 'hide', 'require', 'optional', 'enable', 'disable'];

    for (const dep of dependencies) {
      if (!dep.source_field || typeof dep.source_field !== 'string') {
        return res.status(400).json({ error: 'Each dependency must have a source_field (string)' });
      }
      if (!validConditionTypes.includes(dep.condition_type)) {
        return res.status(400).json({ 
          error: `Invalid condition_type. Must be one of: ${validConditionTypes.join(', ')}` 
        });
      }
      if (!validActions.includes(dep.action)) {
        return res.status(400).json({ 
          error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
        });
      }
    }

    // Update field with dependencies
    const result = await db.query(
      `UPDATE custom_field_definitions 
       SET dependencies = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [JSON.stringify(dependencies), fieldId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Log the update
    await logFieldUpdate(fieldId, orgId, req.user.id, {
      action: 'dependencies_updated',
      dependencies_count: dependencies.length
    });

    res.json({
      success: true,
      field: result.rows[0],
      message: `${dependencies.length} dependencies configured`
    });
  } catch (error) {
    console.error('Error setting field dependencies:', error);
    res.status(500).json({ error: 'Failed to set field dependencies' });
  }
}

/**
 * Get dependencies for a custom field
 * GET /api/v1/custom-fields/:fieldId/dependencies
 */
async function getFieldDependencies(req, res) {
  const { fieldId } = req.params;
  const orgId = req.user.orgId;

  try {
    const result = await db.query(
      `SELECT id, key, label, dependencies 
       FROM custom_field_definitions 
       WHERE id = $1 AND org_id = $2`,
      [fieldId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json({
      field_id: result.rows[0].id,
      field_key: result.rows[0].key,
      field_label: result.rows[0].label,
      dependencies: result.rows[0].dependencies || []
    });
  } catch (error) {
    console.error('Error getting field dependencies:', error);
    res.status(500).json({ error: 'Failed to get field dependencies' });
  }
}

/**
 * Evaluate dependencies for fields with current values
 * POST /api/v1/custom-fields/evaluate-dependencies
 */
async function evaluateDependencies(req, res) {
  const { recordType, fieldValues } = req.body;
  const orgId = req.user.orgId;

  try {
    if (!recordType || !fieldValues) {
      return res.status(400).json({ 
        error: 'recordType and fieldValues are required' 
      });
    }

    // Get all field definitions for this record type
    const fieldsResult = await db.query(
      `SELECT * FROM custom_field_definitions 
       WHERE org_id = $1 AND record_type = $2 AND is_active = true
       ORDER BY sort_order`,
      [orgId, recordType]
    );

    const fieldDefinitions = fieldsResult.rows;
    
    // Evaluate dependencies using the utility
    const evaluationResults = evaluateAllDependencies(fieldDefinitions, fieldValues);

    // Filter fields based on evaluation
    const visibleFields = filterFieldsByDependencies(fieldDefinitions, fieldValues);

    res.json({
      success: true,
      evaluation_results: evaluationResults,
      visible_fields: visibleFields.map(f => ({
        id: f.id,
        key: f.key,
        label: f.label,
        visible: evaluationResults[f.key]?.visible ?? true,
        required: evaluationResults[f.key]?.required ?? f.required,
        enabled: evaluationResults[f.key]?.enabled ?? true
      }))
    });
  } catch (error) {
    console.error('Error evaluating dependencies:', error);
    res.status(500).json({ error: 'Failed to evaluate dependencies' });
  }
}

/**
 * Remove all dependencies from a field
 * DELETE /api/v1/custom-fields/:fieldId/dependencies
 */
async function removeFieldDependencies(req, res) {
  const { fieldId } = req.params;
  const orgId = req.user.orgId;

  try {
    const result = await db.query(
      `UPDATE custom_field_definitions 
       SET dependencies = '[]'::jsonb, updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [fieldId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    await logFieldUpdate(fieldId, orgId, req.user.id, {
      action: 'dependencies_removed'
    });

    res.json({
      success: true,
      message: 'Dependencies removed',
      field: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing field dependencies:', error);
    res.status(500).json({ error: 'Failed to remove field dependencies' });
  }
}

module.exports = {
  ...module.exports,
  setFieldDependencies,
  getFieldDependencies,
  evaluateDependencies,
  removeFieldDependencies
};

// ============================================================================
// Custom Field Search and Filter
// ============================================================================

const { buildCustomFieldSearchQuery, buildCustomFieldSortClause } = require('../utils/customFieldSearch');

/**
 * Search records by custom field values
 * POST /api/v1/custom-fields/:recordType/search
 */
async function searchByCustomFields(req, res) {
  const { recordType } = req.params;
  const { filters = [], sort_by, sort_direction = 'ASC', limit = 50, offset = 0 } = req.body;
  const orgId = req.user.orgId;

  try {
    // Build search query
    const { whereClause, params, nextParamIndex } = buildCustomFieldSearchQuery(filters, 3);
    
    // Build sort clause
    let orderByClause = 'r.created_at DESC';
    if (sort_by) {
      orderByClause = buildCustomFieldSortClause(sort_by, sort_direction);
    }

    // Query to get records with custom field values
    const query = `
      SELECT 
        r.*,
        jsonb_object_agg(
          COALESCE(cfd.key, 'null'), 
          COALESCE(cfv.value, 'null'::jsonb)
        ) FILTER (WHERE cfd.key IS NOT NULL) as custom_fields
      FROM ${recordType}s r
      LEFT JOIN custom_field_values cfv ON cfv.record_id = r.id AND cfv.record_type = $1
      LEFT JOIN custom_field_definitions cfd ON cfd.id = cfv.field_id
      WHERE r.org_id = $2 AND ${whereClause}
      GROUP BY r.id
      ORDER BY ${orderByClause}
      LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}
    `;

    const result = await db.query(query, [recordType, orgId, ...params, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM ${recordType}s r
      LEFT JOIN custom_field_values cfv ON cfv.record_id = r.id AND cfv.record_type = $1
      LEFT JOIN custom_field_definitions cfd ON cfd.id = cfv.field_id
      WHERE r.org_id = $2 AND ${whereClause}
    `;

    const countResult = await db.query(countQuery, [recordType, orgId, ...params]);
    const total = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      records: result.rows,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      },
      filters_applied: filters.length
    });
  } catch (error) {
    console.error('Error searching by custom fields:', error);
    res.status(500).json({ error: 'Failed to search records' });
  }
}

/**
 * Get available filter options for a custom field
 * GET /api/v1/custom-fields/:recordType/:fieldKey/filter-options
 */
async function getFilterOptions(req, res) {
  const { recordType, fieldKey } = req.params;
  const orgId = req.user.orgId;

  try {
    // Get field definition
    const fieldResult = await db.query(
      `SELECT field_type, options FROM custom_field_definitions 
       WHERE org_id = $1 AND record_type = $2 AND key = $3`,
      [orgId, recordType, fieldKey]
    );

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const field = fieldResult.rows[0];

    // For select/multiselect, return predefined options
    if (['select', 'multiselect'].includes(field.field_type)) {
      return res.json({
        field_key: fieldKey,
        field_type: field.field_type,
        options: field.options || []
      });
    }

    // For other fields, get unique values from data
    const valuesQuery = `
      SELECT DISTINCT cfv.value->>'${fieldKey}' as value
      FROM custom_field_values cfv
      JOIN custom_field_definitions cfd ON cfd.id = cfv.field_id
      WHERE cfd.org_id = $1 AND cfd.record_type = $2 AND cfd.key = $3
        AND cfv.value->>'${fieldKey}' IS NOT NULL
        AND cfv.value->>'${fieldKey}' != ''
      ORDER BY value
      LIMIT 100
    `;

    const valuesResult = await db.query(valuesQuery, [orgId, recordType, fieldKey]);

    res.json({
      field_key: fieldKey,
      field_type: field.field_type,
      unique_values: valuesResult.rows.map(r => r.value)
    });
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({ error: 'Failed to get filter options' });
  }
}

module.exports = {
  ...module.exports,
  searchByCustomFields,
  getFilterOptions
};
