const db = require('../db');

// Returns an Express handler that deletes many rows by id, scoped to the
// requesting org. Body: { ids: string[] }. Used for the "bulk actions"
// pattern shared across ~20 list-style modules.
function bulkDeleteHandler(table, idColumn = 'id') {
  return async function bulkDelete(req, res) {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids (non-empty array) required.' });
    const { rowCount } = await db.query(
      `DELETE FROM ${table} WHERE ${idColumn} = ANY($1) AND org_id=$2`,
      [ids, req.user.orgId]
    );
    res.json({ deleted: rowCount });
  };
}

module.exports = { bulkDeleteHandler };
