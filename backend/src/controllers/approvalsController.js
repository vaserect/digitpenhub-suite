const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status, type } = req.query;
  
  let query = 'SELECT * FROM approvals WHERE org_id = $1';
  const params = [orgId];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND approval_type = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM approvals WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Approval not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { approvalType, entityId, entityType, approvers, metadata } = req.body;
  
  if (!approvalType || !entityId || !entityType || !approvers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const result = await db.query(
    'INSERT INTO approvals (org_id, approval_type, entity_id, entity_type, approvers, metadata, requested_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [orgId, approvalType, entityId, entityType, JSON.stringify(approvers), metadata ? JSON.stringify(metadata) : null, userId, 'pending']
  );
  res.status(201).json(result.rows[0]);
});

exports.approve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { comments } = req.body;
  
  const result = await db.query(
    'UPDATE approvals SET status = $1, approved_by = $2, approved_at = NOW(), comments = $3 WHERE id = $4 AND org_id = $5 AND status = $6 RETURNING *',
    ['approved', userId, comments, id, orgId, 'pending']
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Approval not found or already processed' });
  res.json(result.rows[0]);
});

exports.reject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { comments } = req.body;
  
  if (!comments) return res.status(400).json({ error: 'Comments required for rejection' });
  
  const result = await db.query(
    'UPDATE approvals SET status = $1, rejected_by = $2, rejected_at = NOW(), comments = $3 WHERE id = $4 AND org_id = $5 AND status = $6 RETURNING *',
    ['rejected', userId, comments, id, orgId, 'pending']
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Approval not found or already processed' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM approvals WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Approval not found' });
  res.json({ message: 'Approval deleted successfully', id: result.rows[0].id });
});
