/**
 * Reusable CRUD controller factory.
 * Every module with a DB table gets its own controller via this factory.
 * Generates: list, get, create, update, delete, bulkDelete, export, stats.
 */

const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');

function createCrudController(tableName, options = {}) {
  const {
    orgScoped = true,
    idColumn = 'id',
    orderBy = 'created_at',
    orderDir = 'DESC',
    searchColumns = null,
    allowedColumns = null,
    exportName = null,
  } = options;

  async function getSchema() {
    const { rows } = await db.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
      [tableName]
    );
    const columns = rows.map(r => r.column_name);
    const hasUpdatedAt = columns.includes('updated_at');
    return { columns, hasUpdatedAt, rows };
  }

  async function list(req, res) {
    const { orgId } = req.user;
    const { search, limit = 50, offset = 0 } = req.query;
    const schema = await getSchema();

    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    const conds = [];

    if (orgScoped) { params.push(orgId); conds.push(`org_id = $${params.length}`); }

    if (search) {
      const cols = searchColumns || schema.columns.filter(c =>
        ['name','title','label','code','email','description','full_name','first_name','subject','body','content'].includes(c)
      );
      if (cols.length) {
        const parts = cols.map(c => {
          params.push(`%${search}%`);
          return `${c}::text ILIKE $${params.length}`;
        });
        conds.push(`(${parts.join(' OR ')})`);
      }
    }

    if (conds.length) query += ' WHERE ' + conds.join(' AND ');
    query += ` ORDER BY ${orderBy} ${orderDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Math.min(parseInt(limit) || 50, 200), Math.max(parseInt(offset) || 0, 0));

    const result = await db.query(query, params);
    res.json({ data: result.rows, total: result.rows.length, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 });
  }

  async function get(req, res) {
    const { orgId } = req.user;
    const { id } = req.params;
    let query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`;
    const params = [id];
    if (orgScoped) { params.push(orgId); query += ` AND org_id = $2`; }
    const { rows } = await db.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }

  async function create(req, res) {
    const { orgId } = req.user;
    const schema = await getSchema();
    const bodyKeys = Object.keys(req.body).filter(k =>
      schema.columns.includes(k) && !['id','org_id','created_at','updated_at'].includes(k)
    );
    if (!bodyKeys.length) return res.status(400).json({ error: 'No valid fields' });
    const cols = [...bodyKeys];
    const vals = bodyKeys.map(k => req.body[k]);
    if (orgScoped) { cols.push('org_id'); vals.push(orgId); }
    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await db.query(
      `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${ph}) RETURNING *`,
      vals
    );
    res.status(201).json(rows[0]);
  }

  async function update(req, res) {
    const { orgId } = req.user;
    const { id } = req.params;
    const schema = await getSchema();
    const bodyKeys = Object.keys(req.body).filter(k =>
      schema.columns.includes(k) && !['id','org_id','created_at'].includes(k)
    );
    if (!bodyKeys.length) return res.status(400).json({ error: 'No valid fields' });
    const sets = bodyKeys.map((k, i) => `${k} = $${i + 1}`);
    const vals = bodyKeys.map(k => req.body[k]);
    vals.push(id);
    if (orgScoped) vals.push(orgId);
    if (schema.hasUpdatedAt) sets.push('updated_at = NOW()');
    let query = `UPDATE ${tableName} SET ${sets.join(',')} WHERE ${idColumn} = $${bodyKeys.length + 1}`;
    if (orgScoped) query += ` AND org_id = $${bodyKeys.length + 2}`;
    query += ' RETURNING *';
    const { rows } = await db.query(query, vals);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  }

  async function delete_(req, res) {
    const { orgId } = req.user;
    const { id } = req.params;
    let query = `DELETE FROM ${tableName} WHERE ${idColumn} = $1`;
    const params = [id];
    if (orgScoped) { params.push(orgId); query += ` AND org_id = $2`; }
    query += ' RETURNING id';
    const { rows } = await db.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: rows[0].id });
  }

  async function stats(req, res) {
    const { orgId } = req.user;
    const schema = await getSchema();
    const hasAmount = schema.rows.some(c => c.column_name === 'amount' && ['numeric','integer','bigint'].includes(c.data_type));
    let query = 'SELECT COUNT(*)::int AS total';
    if (hasAmount) query += ', COALESCE(SUM(amount),0)::numeric AS total_amount';
    query += ` FROM ${tableName}`;
    if (orgScoped) query += ' WHERE org_id = $1';
    const { rows } = await db.query(query, orgScoped ? [orgId] : []);
    res.json({ stats: rows[0] });
  }

  async function export_(req, res) {
    const { orgId } = req.user;
    let query = `SELECT * FROM ${tableName}`;
    if (orgScoped) query += ' WHERE org_id = $1';
    const { rows } = await db.query(query, orgScoped ? [orgId] : []);
    sendCsv(res, `${exportName || tableName}.csv`, rows, autoColumns(rows));
  }

  return { list, get, create, update, delete: delete_, bulkDelete: null, export: export_, stats };
}

module.exports = { createCrudController };
