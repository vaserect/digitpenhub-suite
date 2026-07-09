const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── A/B Test variant ─────────────────────────────────────────────────────────
router.patch('/campaigns/:id/ab-test', asyncHandler(async (req, res) => {
  const { subjectB, bodyB, splitPct, enabled } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = []; let idx = 1;
  if (enabled !== undefined) { updates.push(`ab_test_enabled = $${idx++}`); params.push(enabled); }
  if (subjectB !== undefined) { updates.push(`ab_test_subject_b = $${idx++}`); params.push(subjectB); }
  if (bodyB !== undefined) { updates.push(`ab_test_body_b = $${idx++}`); params.push(bodyB); }
  if (splitPct !== undefined) { updates.push(`ab_test_split_pct = $${idx++}`); params.push(splitPct); }
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE email_campaigns SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found.' });
  res.json({ campaign: rows[0] });
}));

router.post('/campaigns/:id/declare-winner', asyncHandler(async (req, res) => {
  const { winner } = req.body || {};
  if (!['a', 'b'].includes(winner)) return res.status(400).json({ error: 'Winner must be "a" or "b".' });
  const { rows } = await db.query(
    `UPDATE email_campaigns SET ab_test_winner = $1, updated_at = now()
     WHERE id = $2 AND org_id = $3 AND ab_test_enabled = true RETURNING *`,
    [winner, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found or A/B test not enabled.' });
  res.json({ campaign: rows[0] });
}));

// ── Spam Check ────────────────────────────────────────────────────────────────
router.post('/campaigns/:id/spam-check', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM email_campaigns WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found.' });
  const c = rows[0];

  // Simple heuristic spam scoring
  let score = 0;
  const issues = [];
  const suggestions = [];

  const body = (c.body_html || '').toLowerCase();
  if (body.includes('free')) { score += 10; issues.push('Contains "free"'); suggestions.push('"Free" can trigger spam filters — use sparingly.'); }
  if (body.includes('act now')) { score += 10; issues.push('Contains "act now"'); suggestions.push('Replace "act now" with a specific deadline.'); }
  if (body.includes('click here')) { score += 5; issues.push('Contains "click here"'); suggestions.push('Use specific link text instead of "click here".'); }
  if (body.includes('!!!')) { score += 15; issues.push('Excessive exclamation marks'); suggestions.push('Reduce exclamation marks in your content.'); }
  if (body.match(/[A-Z]{5,}/)) { score += 10; issues.push('Excessive capitalization'); suggestions.push('Avoid long strings of ALL CAPS.'); }
  if (body.includes('$$$')) { score += 15; issues.push('Contains "$$$"'); suggestions.push('Remove "$$$" — it is a common spam trigger.'); }
  if (body.includes('guarantee')) { score += 5; issues.push('Contains "guarantee"'); suggestions.push('Guarantee claims often trigger filtering.'); }
  if (body.includes('limited time')) { score += 5; issues.push('Contains "limited time"'); } 
  if (body.split(/\s+/).filter(Boolean).length < 20) { score += 10; issues.push('Very short email body'); suggestions.push('Add more content — very short emails look suspicious.'); }
  if (body.includes('unsubscribe') || body.includes('opt-out')) { score -= 10; issues.push('Contains unsubscribe link'); suggestions.push('Good! Unsubscribe links improve deliverability.'); }

  const finalScore = Math.max(0, Math.min(100, score));
  const { rows: check } = await db.query(
    `INSERT INTO email_spam_checks (campaign_id, score, issues, suggestions) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, finalScore, issues, suggestions]
  );

  await db.query(`UPDATE email_campaigns SET spam_score = $1, spam_issues = $2, updated_at = now() WHERE id = $3`,
    [finalScore, issues, req.params.id]);

  res.json({
    score: finalScore,
    verdict: finalScore < 30 ? 'pass' : finalScore < 60 ? 'warning' : 'fail',
    issues,
    suggestions,
    check: check[0],
  });
}));

// ── Campaign Stats Recording ──────────────────────────────────────────────────
router.post('/campaigns/:id/stats', asyncHandler(async (req, res) => {
  const { sent, opens, uniqueOpens, clicks, uniqueClicks, bounces, complaints, variant } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO email_campaign_stats (campaign_id, sent_at, recipients, opens, unique_opens, clicks, unique_clicks, bounces, complaints, variant)
     VALUES ($1, now(), $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.params.id, sent || 0, opens || 0, uniqueOpens || 0, clicks || 0, uniqueClicks || 0, bounces || 0, complaints || 0, variant || null]
  );
  res.status(201).json({ stats: rows[0] });
}));

router.get('/campaigns/:id/stats', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM email_campaign_stats WHERE campaign_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  // Aggregate
  const total = rows.reduce((a, s) => ({
    recipients: a.recipients + s.recipients,
    opens: a.opens + s.opens,
    unique_opens: a.unique_opens + s.unique_opens,
    clicks: a.clicks + s.clicks,
    unique_clicks: a.unique_clicks + s.unique_clicks,
    bounces: a.bounces + s.bounces,
  }), { recipients: 0, opens: 0, unique_opens: 0, clicks: 0, unique_clicks: 0, bounces: 0 });
  res.json({ stats: rows, total });
}));

// ── Segment Analytics ─────────────────────────────────────────────────────────
router.get('/segment-analytics', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       count(*) AS total_campaigns,
       sum(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
       avg(CASE WHEN spam_score IS NOT NULL THEN spam_score ELSE NULL END)::numeric(5,2) AS avg_spam_score
     FROM email_campaigns WHERE org_id = $1`,
    [req.user.orgId]
  );
  const { rows: listStats } = await db.query(
    `SELECT l.id, l.name, count(s.id) AS subscriber_count
     FROM email_lists l LEFT JOIN email_subscribers s ON s.list_id = l.id AND s.status = 'subscribed'
     WHERE l.org_id = $1 GROUP BY l.id, l.name ORDER BY l.name`,
    [req.user.orgId]
  );
  res.json({ summary: rows[0], lists: listStats });
}));

module.exports = router;
