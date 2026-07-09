const { Router } = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(
    `SELECT * FROM contracts WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC`,
    params
  );
  res.json({ contracts: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM contracts WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Contract not found.' });
  const { rows: signatures } = await db.query(
    `SELECT id, party_email, party_name, signature_data, ip_address, signed_at
     FROM contract_signatures WHERE contract_id = $1 ORDER BY signed_at NULLS LAST`,
    [req.params.id]
  );
  res.json({ contract: rows[0], signatures });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, description, content, parties, expiresAt } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Contract title is required.' });
  const { rows } = await db.query(
    `INSERT INTO contracts (org_id, title, description, content, parties, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, title.trim(), description || null, content || null,
     JSON.stringify(parties || []), expiresAt || null, req.user.id]
  );
  res.status(201).json({ contract: rows[0] });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, description, content, parties } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = [];
  let idx = 1;
  if (title !== undefined) { updates.push(`title = $${idx++}`); params.push(title); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
  if (content !== undefined) { updates.push(`content = $${idx++}`); params.push(content); }
  if (parties !== undefined) { updates.push(`parties = $${idx++}`); params.push(JSON.stringify(parties)); }
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE contracts SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ contract: rows[0] });
}));

// Send — generate signature tokens for each party and mark as sent
router.post('/:id/send', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM contracts WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Contract not found.' });
  const contract = rows[0];
  if (contract.status !== 'draft') return res.status(400).json({ error: `Cannot send — contract is ${contract.status}.` });

  const parties = Array.isArray(contract.parties) ? contract.parties : [];
  const tokens = [];

  for (const party of parties) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600000); // 30 days
    await db.query(
      `INSERT INTO contract_signatures (contract_id, party_email, party_name, sign_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [contract.id, party.email || party.name, party.name, token, expiresAt]
    );
    tokens.push({ email: party.email, name: party.name, token, signUrl: `${process.env.FRONTEND_ORIGIN || ''}/sign/${token}` });
  }

  await db.query(
    `UPDATE contracts SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = $1`,
    [contract.id]
  );

  res.json({ ok: true, signLinks: tokens });
}));

// Cancel
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE contracts SET status = 'cancelled', updated_at = now() WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ contract: rows[0] });
}));

// Delete
router.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM contracts WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

module.exports = router;
