const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Public: track a page view (embed on customer sites)
router.post('/track', asyncHandler(async (req, res) => {
  const { orgId, visitorHash, pageUrl, pageTitle, events } = req.body || {};
  if (!orgId || !visitorHash || !pageUrl) return res.status(400).json({ error: 'orgId, visitorHash, and pageUrl are required.' });
  const duration = Array.isArray(events) && events.length > 1
    ? Math.round((new Date(events[events.length - 1].t) - new Date(events[0].t)) / 1000)
    : null;
  await db.query(
    `INSERT INTO session_recordings (org_id, visitor_hash, page_url, page_title, events, duration_secs)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orgId, visitorHash, pageUrl, pageTitle || null, JSON.stringify(events || []), duration]
  );
  res.json({ ok: true });
}));

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { rows } = await db.query(
    `SELECT id, visitor_hash, page_url, page_title, duration_secs, created_at
     FROM session_recordings WHERE org_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.orgId, parseInt(limit), offset]
  );
  const { rows: cnt } = await db.query(
    `SELECT count(*) AS c FROM session_recordings WHERE org_id = $1`,
    [req.user.orgId]
  );
  res.json({ recordings: rows, total: parseInt(cnt[0].c), page: parseInt(page) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM session_recordings WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ recording: rows[0] });
}));

module.exports = router;
