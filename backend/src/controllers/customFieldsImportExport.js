const db = require('../db');
const { Parser } = require('json2csv');

/**
 * Export custom field definitions
 */
async function exportFields(req, res) {
  const { recordType, format = 'json' } = req.query;

  if (!recordType) {
    return res.status(400).json({ error: 'recordType is required' });
  }

  try {
    const { rows } = await db.query(
      `SELECT key, label, field_type, description, required, options, 
              relation_record_type, sort_order, currency_code, min_value, 
              max_value, format_pattern, security, validation_rules, dependencies
       FROM custom_field_definitions
       WHERE org_id = $1 AND record_type = $2 AND is_active = true
       ORDER BY sort_order ASC`,
      [req.user.orgId, recordType]
    );

    if (format === 'csv') {
      // Convert to CSV
      const fields = [
        'key', 'label', 'field_type', 'description', 'required',
        'options', 'relation_record_type', 'sort_order', 'currency_code',
        'min_value', 'max_value', 'format_pattern'
      ];

      const data = rows.map(row => ({
        ...row,
        options: JSON.stringify(row.options || []),
        security: JSON.stringify(row.security || {}),
        validation_rules: JSON.stringify(row.validation_rules || []),
        dependencies: JSON.stringify(row.dependencies || []),
      }));

      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="custom-fields-${recordType}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="custom-fields-${recordType}.json"`);
      res.json({
        recordType,
        exportedAt: new Date().toISOString(),
        fields: rows,
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
}

/**
 * Import custom field definitions
 */
async function importFields(req, res) {
  const { recordType, format = 'json' } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!recordType) {
    return res.status(400).json({ error: 'recordType is required' });
  }

  try {
    let fieldsToImport = [];

    if (format === 'json') {
      const fileContent = file.buffer.toString('utf-8');
      const data = JSON.parse(fileContent);
      fieldsToImport = data.fields || data;
    } else if (format === 'csv') {
      // Parse CSV
      const csvParse = require('csv-parse/sync');
      const fileContent = file.buffer.toString('utf-8');
      const records = csvParse.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      fieldsToImport = records.map(record => ({
        ...record,
        options: record.options ? JSON.parse(record.options) : [],
        security: record.security ? JSON.parse(record.security) : {},
        validation_rules: record.validation_rules ? JSON.parse(record.validation_rules) : [],
        dependencies: record.dependencies ? JSON.parse(record.dependencies) : [],
        required: record.required === 'true' || record.required === true,
      }));
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const field of fieldsToImport) {
        // Check if field already exists
        const { rows: existing } = await client.query(
          'SELECT id FROM custom_field_definitions WHERE org_id = $1 AND record_type = $2 AND key = $3',
          [req.user.orgId, recordType, field.key]
        );

        if (existing.length > 0) {
          // Update existing field
          await client.query(
            `UPDATE custom_field_definitions 
             SET label = $1, field_type = $2, description = $3, required = $4,
                 options = $5, relation_record_type = $6, sort_order = $7,
                 currency_code = $8, min_value = $9, max_value = $10,
                 format_pattern = $11, security = $12, validation_rules = $13,
                 dependencies = $14, updated_at = NOW()
             WHERE id = $15`,
            [
              field.label,
              field.field_type,
              field.description || null,
              field.required || false,
              JSON.stringify(field.options || []),
              field.relation_record_type || null,
              field.sort_order || 0,
              field.currency_code || null,
              field.min_value || null,
              field.max_value || null,
              field.format_pattern || null,
              JSON.stringify(field.security || {}),
              JSON.stringify(field.validation_rules || []),
              JSON.stringify(field.dependencies || []),
              existing[0].id,
            ]
          );
          updated++;
        } else {
          // Insert new field
          await client.query(
            `INSERT INTO custom_field_definitions 
             (org_id, record_type, key, label, field_type, description, required,
              options, relation_record_type, sort_order, currency_code, min_value,
              max_value, format_pattern, security, validation_rules, dependencies)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              req.user.orgId,
              recordType,
              field.key,
              field.label,
              field.field_type,
              field.description || null,
              field.required || false,
              JSON.stringify(field.options || []),
              field.relation_record_type || null,
              field.sort_order || 0,
              field.currency_code || null,
              field.min_value || null,
              field.max_value || null,
              field.format_pattern || null,
              JSON.stringify(field.security || {}),
              JSON.stringify(field.validation_rules || []),
              JSON.stringify(field.dependencies || []),
            ]
          );
          imported++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      imported,
      updated,
      skipped,
      total: fieldsToImport.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Import failed', 
      details: error.message 
    });
  }
}

module.exports = {
  exportFields,
  importFields,
};
