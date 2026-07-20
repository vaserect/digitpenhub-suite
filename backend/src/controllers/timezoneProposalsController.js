const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM timezone_proposals WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]);
  res.json({ proposals: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, durationMinutes, proposedDates, timezones } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { rows } = await db.query(
    'INSERT INTO timezone_proposals (org_id, title, duration_minutes, proposed_dates, timezones, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.user.orgId, title, durationMinutes || 60, JSON.stringify(proposedDates || []), timezones || [], req.user.id]
  );
  res.status(201).json({ proposal: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM timezone_proposals WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Proposal not found' });
  res.json({ ok: true });
});
