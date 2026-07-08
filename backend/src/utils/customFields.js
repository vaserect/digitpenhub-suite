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

module.exports = { attachCustomFields, getExportColumns };
