const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { status } = req.query;
  
  let query = 'SELECT * FROM crm_upgrades WHERE org_id = $1';
  const params = [orgId];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM crm_upgrades WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Upgrade not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { customerId, fromPlan, toPlan, reason, effectiveDate } = req.body;
  
  if (!customerId || !fromPlan || !toPlan) {
    return res.status(400).json({ error: 'Customer, from plan, and to plan are required' });
  }
  
  const result = await db.query(
    'INSERT INTO crm_upgrades (org_id, customer_id, from_plan, to_plan, reason, effective_date, status, requested_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [orgId, customerId, fromPlan, toPlan, reason, effectiveDate || new Date(), 'pending', userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.approve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  
  const result = await db.query(
    'UPDATE crm_upgrades SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 AND org_id = $4 RETURNING *',
    ['approved', userId, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Upgrade not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM crm_upgrades WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Upgrade not found' });
  res.json({ message: 'Upgrade deleted successfully', id: result.rows[0].id });
});
