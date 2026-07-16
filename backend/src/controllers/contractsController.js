const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status, type } = req.query;
  
  let query = 'SELECT * FROM contracts WHERE org_id = $1';
  const params = [orgId];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND contract_type = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM contracts WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Contract not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { title, contractType, partyA, partyB, startDate, endDate, terms, value } = req.body;
  
  if (!title || !contractType || !partyA || !partyB) {
    return res.status(400).json({ error: 'Title, type, and parties are required' });
  }
  
  const result = await db.query(
    'INSERT INTO contracts (org_id, title, contract_type, party_a, party_b, start_date, end_date, terms, value, status, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [orgId, title, contractType, partyA, partyB, startDate, endDate, terms, value, 'draft', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { title, startDate, endDate, terms, value, status } = req.body;
  
  const result = await db.query(
    'UPDATE contracts SET title = COALESCE($1, title), start_date = COALESCE($2, start_date), end_date = COALESCE($3, end_date), terms = COALESCE($4, terms), value = COALESCE($5, value), status = COALESCE($6, status) WHERE id = $7 AND org_id = $8 RETURNING *',
    [title, startDate, endDate, terms, value, status, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Contract not found' });
  res.json(result.rows[0]);
});

exports.sign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { signature } = req.body;
  
  const result = await db.query(
    'UPDATE contracts SET status = $1, signed_by = $2, signed_at = NOW(), signature = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
    ['signed', userId, signature, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Contract not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM contracts WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Contract not found' });
  res.json({ message: 'Contract deleted successfully', id: result.rows[0].id });
});
