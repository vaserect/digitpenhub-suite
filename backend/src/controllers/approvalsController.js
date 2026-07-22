const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status, type } = req.query;

  let query = `
    SELECT ar.*, at.name as template_name, u.email as submitted_by_email
    FROM approval_requests ar
    LEFT JOIN approval_templates at ON at.id = ar.template_id
    LEFT JOIN users u ON u.id = ar.submitted_by
    WHERE ar.org_id = $1`;
  const params = [orgId];

  if (status) {
    params.push(status);
    query += ` AND ar.status = $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND ar.resource_type = $${params.length}`;
  }

  query += ' ORDER BY ar.submitted_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { rows } = await db.query(
    `SELECT ar.*, at.name as template_name, u.email as submitted_by_email
     FROM approval_requests ar
     LEFT JOIN approval_templates at ON at.id = ar.template_id
     LEFT JOIN users u ON u.id = ar.submitted_by
     WHERE ar.id = $1 AND ar.org_id = $2`,
    [id, orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Approval not found' });
  res.json(rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, id: userId } = req.user;
  const { templateId, title, resourceType, resourceId } = req.body;

  if (!title || !resourceType) {
    return res.status(400).json({ error: 'title and resourceType are required' });
  }

  const { rows } = await db.query(
    `INSERT INTO approval_requests (org_id, template_id, resource_type, resource_id, title, status, submitted_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [orgId, templateId || null, resourceType, resourceId || null, title, 'pending', userId]
  );
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { title, status } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
  if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(id, orgId);

  const query = `UPDATE approval_requests SET ${updates.join(', ')} WHERE id = $${paramCount++} AND org_id = $${paramCount++} RETURNING *`;
  const result = await db.query(query, values);
  if (!result.rows[0]) return res.status(404).json({ error: 'Approval not found' });
  res.json(result.rows[0]);
});

exports.approve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, id: userId } = req.user;

  const { rows } = await db.query(
    `UPDATE approval_requests SET status = 'approved', resolved_by = $2, resolved_at = NOW()
     WHERE id = $1 AND org_id = $3 AND status = 'pending' RETURNING *`,
    [id, userId, orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Approval not found or already processed' });
  res.json(rows[0]);
});

exports.reject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, id: userId } = req.user;

  const { rows } = await db.query(
    `UPDATE approval_requests SET status = 'rejected', resolved_by = $2, resolved_at = NOW()
     WHERE id = $1 AND org_id = $3 AND status = 'pending' RETURNING *`,
    [id, userId, orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Approval not found or already processed' });
  res.json(rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { rows } = await db.query('DELETE FROM approval_requests WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!rows[0]) return res.status(404).json({ error: 'Approval not found' });
  res.json({ message: 'Approval deleted successfully', id: rows[0].id });
});
